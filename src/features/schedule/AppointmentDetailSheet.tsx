import {
  CalendarOutline,
  CheckCircleOutline,
  CloseCircleOutline,
  ExclamationCircleOutline,
} from 'antd-mobile-icons';
import { Button, Card, List, Popup, SafeArea, Space, Tag } from 'antd-mobile';
import type { Appointment, AppointmentStatus } from '../../types/domain';
import { formatAppointmentDate } from '../../services/appointmentsService';
import { appointmentStatusColor, appointmentStatusLabel } from './appointmentStatus';

type AppointmentDetailSheetProps = {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
  onChangeStatus: (appointment: Appointment, status: AppointmentStatus) => void;
};

function valueOrFallback(value?: string | null) {
  return value && value.trim() ? value : '--';
}

export function AppointmentDetailSheet({
  visible,
  appointment,
  onClose,
  onEdit,
  onChangeStatus,
}: AppointmentDetailSheetProps) {
  function runAction(action: () => void) {
    onClose();
    action();
  }

  return (
    <Popup
      visible={visible}
      position="bottom"
      onMaskClick={onClose}
      bodyClassName="appointment-detail-sheet"
      bodyStyle={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
    >
      <SafeArea position="top" />
      {appointment ? (
        <Space direction="vertical" block className="appointment-detail-sheet__content">
          <div className="client-profile-sheet__handle" aria-hidden="true" />

          <Card className="appointment-detail-sheet__hero">
            <div className="appointment-detail-sheet__header">
              <div>
                <span className="client-profile-sheet__eyebrow">AGENDAMENTO</span>
                <h3>{appointment.clientName}</h3>
              </div>
              <Tag color={appointmentStatusColor[appointment.status]}>
                {appointmentStatusLabel[appointment.status]}
              </Tag>
            </div>
          </Card>

          <Card className="appointment-detail-sheet__card">
            <List className="client-profile-sheet__list">
              <List.Item extra={`${formatAppointmentDate(appointment.date)} às ${appointment.time}`}>Horário</List.Item>
              <List.Item extra={valueOrFallback(appointment.serviceType)}>Atendimento</List.Item>
              <List.Item extra={valueOrFallback(appointment.notes)}>Observações</List.Item>
            </List>
          </Card>

          <Space wrap className="appointment-detail-sheet__actions">
            <Button
              color="primary"
              fill="solid"
              onClick={() => runAction(() => onChangeStatus(appointment, 'confirmado'))}
            >
              <CheckCircleOutline />
              Confirmar
            </Button>
            <Button fill="outline" onClick={() => runAction(() => onEdit(appointment))}>
              <CalendarOutline />
              Remarcar
            </Button>
            <Button fill="outline" onClick={() => runAction(() => onChangeStatus(appointment, 'cancelado'))}>
              <CloseCircleOutline />
              Cancelar
            </Button>
            <Button fill="outline" onClick={() => runAction(() => onChangeStatus(appointment, 'faltou'))}>
              <ExclamationCircleOutline />
              Falta
            </Button>
          </Space>
        </Space>
      ) : null}
      <SafeArea position="bottom" />
    </Popup>
  );
}
