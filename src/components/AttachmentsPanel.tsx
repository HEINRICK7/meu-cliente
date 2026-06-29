import { FolderOutline, UploadOutline } from 'antd-mobile-icons';
import { Button, Card, Empty, Toast } from 'antd-mobile';
import { useMemo, useRef, type ChangeEvent } from 'react';
import { useAttachments } from '../hooks/useAttachments';
import { formatAttachmentDate } from '../services/attachmentsService';

type AttachmentsPanelProps = {
  title: string;
  description?: string;
  businessId: string | null;
  ownerId: string | null;
  clientId?: string | null;
  attendanceId?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
};

function attachmentTypeLabel(fileType: string) {
  if (!fileType) {
    return 'Arquivo';
  }

  if (fileType.startsWith('image/')) {
    return 'Imagem';
  }

  if (fileType === 'application/pdf') {
    return 'PDF';
  }

  if (fileType.includes('word')) {
    return 'Documento';
  }

  return fileType.split('/')[0]?.toUpperCase() || 'Arquivo';
}

function openAttachment(url: string) {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function AttachmentsPanel({
  title,
  description,
  businessId,
  ownerId,
  clientId,
  attendanceId,
  emptyTitle = 'Nenhum anexo salvo',
  emptyDescription = 'Envie arquivos para manter registros e imagens juntos no mesmo lugar.',
}: AttachmentsPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { attachments, loading, error, uploading, uploadAttachment } = useAttachments(businessId, {
    clientId,
    attendanceId,
  });

  const targetReady = Boolean(clientId || attendanceId);
  const contextLabel = useMemo(() => {
    if (attendanceId) {
      return 'Atendimento selecionado';
    }

    if (clientId) {
      return 'Cliente selecionado';
    }

    return 'Nenhum vínculo';
  }, [attendanceId, clientId]);

  function handleUploadClick() {
    if (!targetReady) {
      Toast.show({ content: 'Selecione um cliente ou atendimento para anexar.' });
      return;
    }

    inputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!businessId || !ownerId) {
      Toast.show({ content: 'Faça login novamente para continuar.' });
      return;
    }

    try {
      await uploadAttachment(file, {
        businessId,
        ownerId,
        clientId,
        attendanceId,
      });
      Toast.show({ content: 'Anexo enviado.' });
    } catch {
      Toast.show({ content: 'Não foi possível enviar o anexo.' });
    }
  }

  return (
    <Card className="soft-card attachments-card">
      <div className="section-head">
        <div>
          <div className="section-label">{title}</div>
          <div className="section-title">{description || contextLabel}</div>
        </div>
        <Button color="primary" fill="solid" size="small" shape="rounded" loading={uploading} onClick={handleUploadClick}>
          <UploadOutline />
          Enviar
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/*,application/pdf,.txt,.doc,.docx,.xls,.xlsx"
        onChange={handleFileChange}
      />

      {loading ? (
        <p className="muted-text">Carregando anexos...</p>
      ) : error ? (
        <p className="muted-text">{error}</p>
      ) : attachments.length === 0 ? (
        <Empty description={emptyDescription} imageStyle={{ width: 72, height: 72 }} />
      ) : (
        <div className="attachment-list">
          {attachments.map((attachment) => (
            <button
              key={attachment.id}
              type="button"
              className="attachment-item"
              onClick={() => openAttachment(attachment.fileUrl)}
            >
              <div className="attachment-item__icon">
                <FolderOutline />
              </div>
              <div className="attachment-item__copy">
                <strong>{attachment.fileName}</strong>
                <span>{attachmentTypeLabel(attachment.fileType)}</span>
                <span>{attachment.createdAt ? formatAttachmentDate(attachment.createdAt) : 'Data sem registro'}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
