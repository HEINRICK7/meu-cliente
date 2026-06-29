import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  type Unsubscribe,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, firebaseReady, storage } from '../firebase/client';
import { withTimeout } from './asyncTimeout';
import { isFirestoreUnavailable, markFirestoreUnavailable, runFirestoreOperation } from './firestoreHealth';
import { normalizeFirestoreId } from './firestoreIds';
import type { Attachment, AttachmentUpsertInput } from '../types/domain';
import { formatCalendarDate, parseCalendarDate } from '../utils/date';

const ATTACHMENTS_COLLECTION = 'attachments';

function nowIso() {
  return new Date().toISOString();
}

function normalizeAttachment(data: Record<string, unknown>, id: string): Attachment {
  return {
    id,
    businessId: (data.businessId as string | undefined) || undefined,
    ownerId: (data.ownerId as string | undefined) || undefined,
    clientId: (data.clientId as string | undefined) || undefined,
    attendanceId: (data.attendanceId as string | undefined) || undefined,
    fileName: (data.fileName as string | undefined) || 'Arquivo',
    fileUrl: (data.fileUrl as string | undefined) || '',
    fileType: (data.fileType as string | undefined) || 'application/octet-stream',
    storagePath: (data.storagePath as string | undefined) || '',
    fileSize: (data.fileSize as number | undefined) || undefined,
    createdAt: (data.createdAt as string | undefined) || undefined,
    updatedAt: (data.updatedAt as string | undefined) || undefined,
  };
}

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function buildStoragePath(businessId: string, attachmentId: string, fileName: string) {
  const safeName = sanitizeSegment(fileName) || 'arquivo';
  return `businesses/${businessId}/attachments/${attachmentId}/${safeName}`;
}

function sortAttachments(left: Attachment, right: Attachment) {
  const leftDate = left.createdAt ? parseCalendarDate(left.createdAt) : null;
  const rightDate = right.createdAt ? parseCalendarDate(right.createdAt) : null;

  const leftTime = leftDate ? leftDate.getTime() : Number.NEGATIVE_INFINITY;
  const rightTime = rightDate ? rightDate.getTime() : Number.NEGATIVE_INFINITY;

  return rightTime - leftTime || left.fileName.localeCompare(right.fileName);
}

export function formatAttachmentDate(value: string) {
  return formatCalendarDate(value);
}

export function listenAttachments(
  businessId: string,
  onChange: (attachments: Attachment[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  if (!firebaseReady || !db) {
    onChange([]);
    return () => undefined;
  }

  if (isFirestoreUnavailable()) {
    onChange([]);
    return () => undefined;
  }

  const normalizedBusinessId = normalizeFirestoreId(businessId, businessId);
  const attachmentsRef = collection(db, ATTACHMENTS_COLLECTION);
  const attachmentsQuery = query(attachmentsRef, where('businessId', '==', normalizedBusinessId));

  return onSnapshot(
    attachmentsQuery,
    (snapshot) => {
      const attachments = snapshot.docs
        .map((document) => normalizeAttachment(document.data() as Record<string, unknown>, document.id))
        .sort(sortAttachments);

      onChange(attachments);
    },
    (error) => {
      markFirestoreUnavailable(error);
      onError?.(error);
      onChange([]);
    },
  );
}

export async function uploadAttachmentFile(params: {
  businessId: string;
  ownerId: string;
  file: File;
  clientId?: string;
  attendanceId?: string;
}) {
  if (!firebaseReady || !db || !storage) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  const timestamp = nowIso();
  const attachmentRef = doc(collection(db, ATTACHMENTS_COLLECTION));
  const businessId = normalizeFirestoreId(params.businessId);
  const ownerId = normalizeFirestoreId(params.ownerId);

  if (!businessId || !ownerId) {
    throw new Error('Dados de negócio inválidos para salvar o anexo.');
  }
  const storagePath = buildStoragePath(businessId, attachmentRef.id, params.file.name);
  const storageRef = ref(storage, storagePath);

  await withTimeout(uploadBytes(storageRef, params.file), 15000, 'O envio do arquivo demorou demais. Tente novamente.');
  const fileUrl = await withTimeout(
    getDownloadURL(storageRef),
    8000,
    'Não foi possível obter a URL do arquivo. Tente novamente.',
  );

  const record: AttachmentUpsertInput = {
    clientId: params.clientId,
    attendanceId: params.attendanceId,
    fileName: params.file.name,
    fileUrl,
    fileType: params.file.type || 'application/octet-stream',
    storagePath,
    fileSize: params.file.size,
  };

  await runFirestoreOperation(
    withTimeout(
      setDoc(attachmentRef, {
        businessId,
        ownerId,
        ...record,
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
      12000,
      'O salvamento do anexo demorou demais. Tente novamente.',
    ),
  );

  return normalizeAttachment(
    {
      businessId,
      ownerId,
      ...record,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    attachmentRef.id,
  );
}
