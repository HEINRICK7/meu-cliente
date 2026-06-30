import { CalendarOutline, ClockCircleOutline, EditSOutline } from 'antd-mobile-icons';
import { Button, Card, Grid, List, Popup, SafeArea, Space } from 'antd-mobile';
import type { Client } from '../../types/domain';

type ClientProfileSheetProps = {
  visible: boolean;
  client: Client | null;
  appointmentCount: number;
  attendanceCount: number;
  lastAttendanceLabel?: string | null;
  nextAppointmentLabel?: string | null;
  onClose: () => void;
  onCreateAppointment: () => void;
  onCreateAttendance: () => void;
  onEditClient?: () => void;
};

function valueOrFallback(value?: string | null) {
  return value && value.trim() ? value : '--';
}

export function ClientProfileSheet({
  visible,
  client,
  appointmentCount,
  attendanceCount,
  lastAttendanceLabel,
  nextAppointmentLabel,
  onClose,
  onCreateAppointment,
  onCreateAttendance,
  onEditClient,
}: ClientProfileSheetProps) {
  function runSheetAction(action: () => void) {
    onClose();
    action();
  }

  return (
    <Popup
      visible={visible}
      position="bottom"
      onMaskClick={onClose}
      bodyClassName="client-profile-sheet"
      bodyStyle={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
    >
      <SafeArea position="top" />
      <Space direction="vertical" block className="client-profile-sheet__content">
        <div className="client-profile-sheet__handle" aria-hidden="true" />

        <Card className="client-profile-sheet__hero">
          <div className="client-profile-sheet__header">
            <div className="client-profile-sheet__title-group">
              <span className="client-profile-sheet__eyebrow">PERFIL COMPLETO</span>
              <strong>{valueOrFallback(client?.name)}</strong>
            </div>
            <Button size="small" shape="rounded" fill="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </Card>

        <Grid columns={2} gap={10}>
          <Grid.Item>
            <Card className="client-profile-sheet__metric">
              <strong>{appointmentCount}</strong>
              <span>Agendamentos</span>
            </Card>
          </Grid.Item>
          <Grid.Item>
            <Card className="client-profile-sheet__metric">
              <strong>{attendanceCount}</strong>
              <span>Atendimentos</span>
            </Card>
          </Grid.Item>
          <Grid.Item>
            <Card className="client-profile-sheet__metric">
              <strong>{valueOrFallback(lastAttendanceLabel)}</strong>
              <span>Último atendimento</span>
            </Card>
          </Grid.Item>
          <Grid.Item>
            <Card className="client-profile-sheet__metric">
              <strong>{valueOrFallback(nextAppointmentLabel)}</strong>
              <span>Próximo agendamento</span>
            </Card>
          </Grid.Item>
        </Grid>

        <Card className="client-profile-sheet__card">
          <List className="client-profile-sheet__list">
            <List.Item extra={valueOrFallback(client?.phone)}>Telefone</List.Item>
            <List.Item extra={valueOrFallback(client?.email)}>E-mail</List.Item>
          </List>
        </Card>

        <Grid columns={3} gap={8} className="client-profile-sheet__actions">
          <Grid.Item>
            <Button
              className="client-profile-sheet__action client-profile-sheet__action--primary"
              color="primary"
              fill="solid"
              onClick={() => runSheetAction(onCreateAppointment)}
            >
              <Space direction="vertical" align="center" className="client-profile-sheet__action-content">
                <span className="client-profile-sheet__action-icon">
                  <CalendarOutline />
                </span>
                <span>Agendar</span>
              </Space>
            </Button>
          </Grid.Item>
          <Grid.Item>
            <Button
              className="client-profile-sheet__action client-profile-sheet__action--attendance"
              color="primary"
              fill="solid"
              onClick={() => runSheetAction(onCreateAttendance)}
            >
              <Space direction="vertical" align="center" className="client-profile-sheet__action-content">
                <span className="client-profile-sheet__action-icon">
                  <ClockCircleOutline />
                </span>
                <span>Atender</span>
              </Space>
            </Button>
          </Grid.Item>
          <Grid.Item>
            {onEditClient ? (
              <Button
                className="client-profile-sheet__action client-profile-sheet__action--edit"
                color="primary"
                fill="solid"
                onClick={() => runSheetAction(onEditClient)}
              >
                <Space direction="vertical" align="center" className="client-profile-sheet__action-content">
                  <span className="client-profile-sheet__action-icon">
                    <EditSOutline />
                  </span>
                  <span>Editar</span>
                </Space>
              </Button>
            ) : null}
          </Grid.Item>
        </Grid>
      </Space>
      <SafeArea position="bottom" />
    </Popup>
  );
}
