import { FolderOutline, UploadOutline } from 'antd-mobile-icons';
import { Card, Empty, ImageUploader, List, Toast, type ImageUploadItem } from 'antd-mobile';
import { useMemo } from 'react';
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

  async function handleImageUpload(file: File): Promise<ImageUploadItem> {
    if (!targetReady) {
      Toast.show({ content: 'Selecione um cliente ou atendimento para anexar.' });
      throw new Error('Selecione um cliente ou atendimento para anexar.');
    }

    if (!businessId || !ownerId) {
      Toast.show({ content: 'Faça login novamente para continuar.' });
      throw new Error('Faça login novamente para continuar.');
    }

    try {
      await uploadAttachment(file, {
        businessId,
        ownerId,
        clientId,
        attendanceId,
      });
      Toast.show({ content: 'Anexo enviado.' });
      return { url: URL.createObjectURL(file) };
    } catch {
      Toast.show({ content: 'Não foi possível enviar o anexo.' });
      throw new Error('Não foi possível enviar o anexo.');
    }
  }

  return (
    <Card className="soft-card attachments-card">
      <div className="section-head">
        <div>
          <div className="section-label">{title}</div>
          <div className="section-title">{description || contextLabel}</div>
        </div>
        <ImageUploader
          value={[]}
          upload={handleImageUpload}
          maxCount={1}
          accept="image/*"
          showUpload={targetReady && !uploading}
        >
          <span className="attachment-upload-button">
            <UploadOutline />
            Enviar
          </span>
        </ImageUploader>
      </div>

      {loading ? (
        <p className="muted-text">Carregando anexos...</p>
      ) : error ? (
        <p className="muted-text">{error}</p>
      ) : attachments.length === 0 ? (
        <Empty description={emptyDescription} imageStyle={{ width: 72, height: 72 }} />
      ) : (
        <List className="attachment-list">
          {attachments.map((attachment) => (
            <List.Item
              key={attachment.id}
              className="attachment-item"
              onClick={() => openAttachment(attachment.fileUrl)}
              prefix={(
                <span className="attachment-item__icon">
                  <FolderOutline />
                </span>
              )}
            >
              <div className="attachment-item__copy">
                <strong>{attachment.fileName}</strong>
                <span>{attachmentTypeLabel(attachment.fileType)}</span>
                <span>{attachment.createdAt ? formatAttachmentDate(attachment.createdAt) : 'Data sem registro'}</span>
              </div>
            </List.Item>
          ))}
        </List>
      )}
    </Card>
  );
}
