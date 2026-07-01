import type { AppointmentStatus } from '../../types/domain';

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  atendido: 'Atendido',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
};

export const appointmentStatusColor: Record<
  AppointmentStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'default'
> = {
  agendado: 'primary',
  confirmado: 'success',
  atendido: 'success',
  cancelado: 'danger',
  faltou: 'warning',
};
