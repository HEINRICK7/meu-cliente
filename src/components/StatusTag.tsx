import { Tag } from 'antd-mobile';
import type { AppointmentStatus, ClientStatus } from '../types/domain';

type StatusValue = ClientStatus | AppointmentStatus | string;

type StatusTagProps = {
  status: StatusValue;
};

function getStatusMeta(status: StatusValue) {
  switch (status) {
    case 'ativo':
      return { color: 'success' as const, label: 'Ativo' };
    case 'inativo':
      return { color: 'default' as const, label: 'Inativo' };
    case 'agendado':
      return { color: 'primary' as const, label: 'Agendado' };
    case 'confirmado':
      return { color: 'success' as const, label: 'Confirmado' };
    case 'atendido':
      return { color: 'success' as const, label: 'Atendido' };
    case 'cancelado':
      return { color: 'danger' as const, label: 'Cancelado' };
    case 'faltou':
      return { color: 'warning' as const, label: 'Faltou' };
    default:
      return {
        color: 'primary' as const,
        label: status.charAt(0).toUpperCase() + status.slice(1),
      };
  }
}

export function StatusTag({ status }: StatusTagProps) {
  const meta = getStatusMeta(status);

  return (
    <Tag color={meta.color} fill="outline">
      {meta.label}
    </Tag>
  );
}
