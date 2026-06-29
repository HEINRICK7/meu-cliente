import { CalendarOutline, UserAddOutline } from 'antd-mobile-icons';
import { Card, Tag, Toast } from 'antd-mobile';
import { useMemo } from 'react';
import { AppointmentCard } from '../../components/AppointmentCard';
import { ClientCard } from '../../components/ClientCard';
import { LoadingState } from '../../components/LoadingState';
import { QuickActionButton } from '../../components/QuickActionButton';
import { useAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../hooks/useAuth';
import { useClients } from '../../hooks/useClients';
import { isAppointmentOnDay } from '../../services/appointmentsService';

function showSoonFeedback(action: string) {
  void Toast.show({
    content: `${action} será integrado depois.`,
  });
}

function statusColor(status: string) {
  if (status === 'confirmado') {
    return 'success';
  }

  if (status === 'agendado') {
    return 'primary';
  }

  if (status === 'atendido') {
    return 'success';
  }

  if (status === 'cancelado') {
    return 'danger';
  }

  if (status === 'faltou') {
    return 'warning';
  }

  return 'default';
}

function todayKey() {
  const today = new Date();
  const pad = (value: number) => `${value}`.padStart(2, '0');

  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

export function HomeScreen() {
  const { session } = useAuth();
  const { clients, loading: clientsLoading } = useClients(session?.businessId ?? null, session?.id ?? null);
  const { appointments, loading: appointmentsLoading } = useAppointments(
    session?.businessId ?? null,
    session?.id ?? null,
  );

  const summary = useMemo(() => {
    const todayAppointments = appointments.filter((appointment) => isAppointmentOnDay(appointment.date));
    const upcomingAppointments = appointments.filter(
      (appointment) => appointment.date > todayKey(),
    );

    return {
      todayAppointments: todayAppointments.length,
      nextAppointments: upcomingAppointments.length,
      pendingFollowUps: appointments.filter(
        (appointment) => appointment.status === 'agendado' || appointment.status === 'confirmado',
      ).length,
    };
  }, [appointments]);

  const todayAppointments = useMemo(
    () => appointments.filter((appointment) => isAppointmentOnDay(appointment.date)),
    [appointments],
  );
  const recentClients = useMemo(() => clients.slice(0, 2), [clients]);
  const nextAppointment = useMemo(() => todayAppointments[0] || appointments[0] || null, [appointments, todayAppointments]);

  if (appointmentsLoading || clientsLoading) {
    return <LoadingState lines={3} />;
  }

  return (
    <div className="screen-stack">
      <Card className="soft-card hero-meeting-card">
        <div className="hero-meeting-card__top">
              <div className="hero-meeting-card__welcome">
            <div className="hero-meeting-card__avatar">MC</div>
            <div>
              <div className="hero-meeting-card__eyebrow">Bem-vindo de volta 👋</div>
              <div className="hero-meeting-card__text">Vamos fazer de hoje um dia produtivo.</div>
            </div>
          </div>
          <div className="hero-meeting-card__tools" aria-hidden="true">
            <button type="button" className="icon-chip icon-chip--light">
              +
            </button>
            <button type="button" className="icon-chip icon-chip--light">
              ◌
            </button>
          </div>
        </div>

        <div className="hero-meeting-card__month-row">
            <div>
            <div className="hero-meeting-card__month">
              {new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())}
            </div>
            <div className="hero-meeting-card__subline">
              {summary.todayAppointments} atendimento{summary.todayAppointments === 1 ? '' : 's'} hoje
            </div>
          </div>
          <Tag color="success" fill="outline">
            Dados reais
          </Tag>
        </div>

        <div className="hero-meeting-card__calendar" aria-hidden="true">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => {
            const active = index === new Date().getDay();
            const dayNumber = [12, 13, 14, 15, 16, 17, 18][index];

            return (
              <div key={day} className={active ? 'day-pill day-pill--active' : 'day-pill'}>
                <span className="day-pill__label">{day}</span>
                <span className="day-pill__value">{dayNumber}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="metrics-grid">
        <Card className="soft-card metric-card metric-card--yellow">
          <div className="metric-card__value">{summary.todayAppointments}</div>
          <div className="metric-card__label">Atendimentos hoje</div>
        </Card>
        <Card className="soft-card metric-card">
          <div className="metric-card__value">{summary.nextAppointments}</div>
          <div className="metric-card__label">Próximos agendamentos</div>
        </Card>
        <Card className="soft-card metric-card">
          <div className="metric-card__value">{summary.pendingFollowUps}</div>
          <div className="metric-card__label">Pendências</div>
        </Card>
      </div>

      <Card className="soft-card highlight-card highlight-card--yellow">
        <div className="section-head">
          <div>
            <div className="section-label">Próximo atendimento</div>
            <div className="section-title">
              {nextAppointment?.clientName ?? 'Nenhum atendimento hoje'}
            </div>
          </div>
          {nextAppointment ? <Tag color={statusColor(nextAppointment.status)}>{nextAppointment.status}</Tag> : null}
        </div>
        {nextAppointment ? (
          <p className="muted-text">
            {nextAppointment.time} • {nextAppointment.serviceType}
            {nextAppointment.notes ? ` • ${nextAppointment.notes}` : ''}
          </p>
        ) : (
          <p className="muted-text">Nenhum atendimento programado para hoje.</p>
        )}
      </Card>

      <Card className="soft-card">
        <div className="section-head">
          <div>
            <div className="section-label">Atendimentos de hoje</div>
            <div className="section-title">Sequência do dia</div>
          </div>
        </div>
        <div className="screen-stack">
          {todayAppointments.length === 0 ? (
            <p className="muted-text">Nenhum atendimento hoje.</p>
          ) : (
            todayAppointments.map((appointment, index) => (
              <AppointmentCard key={appointment.id} appointment={appointment} emphasis={index === 0} />
            ))
          )}
        </div>
      </Card>

      <Card className="soft-card">
        <div className="section-head">
          <div>
            <div className="section-label">Clientes recentes</div>
            <div className="section-title">Acesso rápido</div>
          </div>
        </div>
        <div className="screen-stack">
          {recentClients.length === 0 ? (
            <p className="muted-text">Nenhum cliente cadastrado ainda.</p>
          ) : recentClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      </Card>

      <div className="quick-actions-grid">
        <QuickActionButton
          label="Novo cliente"
          hint="Cadastro rápido"
          onClick={() => showSoonFeedback('Novo cliente')}
          tone="primary"
          icon={<UserAddOutline />}
        />
        <QuickActionButton
          label="Novo agendamento"
          hint="Hora e serviço"
          onClick={() => showSoonFeedback('Novo agendamento')}
          tone="dark"
          icon={<CalendarOutline />}
        />
      </div>
    </div>
  );
}
