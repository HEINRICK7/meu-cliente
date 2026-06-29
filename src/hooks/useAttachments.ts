import { useEffect, useMemo, useState } from 'react';
import type { Attachment } from '../types/domain';
import { listenAttachments, uploadAttachmentFile } from '../services/attachmentsService';

type UseAttachmentsFilters = {
  clientId?: string | null;
  attendanceId?: string | null;
};

type UseAttachmentsResult = {
  attachments: Attachment[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  uploadAttachment: (
    file: File,
    context: {
      businessId: string;
      ownerId: string;
      clientId?: string | null;
      attendanceId?: string | null;
    },
  ) => Promise<Attachment>;
};

export function useAttachments(businessId: string | null, filters: UseAttachmentsFilters = {}): UseAttachmentsResult {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) {
      setAttachments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenAttachments(
      businessId,
      (nextAttachments) => {
        setAttachments(nextAttachments);
        setLoading(false);
        setError(null);
      },
      () => {
        setAttachments([]);
        setLoading(false);
        setError('Não foi possível carregar os anexos agora.');
      },
    );

    return () => unsubscribe();
  }, [businessId]);

  const filteredAttachments = useMemo(() => {
    return [...attachments]
      .filter((attachment) => {
        const matchesClient = !filters.clientId || attachment.clientId === filters.clientId;
        const matchesAttendance = !filters.attendanceId || attachment.attendanceId === filters.attendanceId;

        if (filters.clientId && filters.attendanceId) {
          return matchesClient || matchesAttendance;
        }

        return matchesClient && matchesAttendance;
      })
      .sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || ''));
  }, [attachments, filters.attendanceId, filters.clientId]);

  async function uploadAttachment(
    file: File,
    context: {
      businessId: string;
      ownerId: string;
      clientId?: string | null;
      attendanceId?: string | null;
    },
  ) {
    setUploading(true);

    try {
      return await uploadAttachmentFile({
        businessId: context.businessId,
        ownerId: context.ownerId,
        file,
        clientId: context.clientId || undefined,
        attendanceId: context.attendanceId || undefined,
      });
    } finally {
      setUploading(false);
    }
  }

  return {
    attachments: filteredAttachments,
    loading,
    error,
    uploading,
    uploadAttachment,
  };
}
