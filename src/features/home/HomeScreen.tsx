import { CalendarOutline, UserAddOutline } from 'antd-mobile-icons';
import { Card, Tag, Toast } from 'antd-mobile';
import { useEffect, useMemo, useState } from 'react';
import { AppointmentCard } from '../../components/AppointmentCard';
import { ClientCard } from '../../components/ClientCard';
import { LoadingState } from '../../components/LoadingState';
import { QuickActionButton } from '../../components/QuickActionButton';
import {
  getDashboardSummary,
  getRecentClients,
  getTodayAppointments,
} from '../../services/mockData';

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

export function HomeScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 450);

    return () => window.clearTimeout(timer);
  }, []);

  const summary = useMemo(() => getDashboardSummary(), []);
  const todayAppointments = useMemo(() => getTodayAppointments(), []);
  const recentClients = useMemo(() => getRecentClients(), []);
  const nextAppointment = todayAppointments[0];

  if (loading) {
    return <LoadingState lines={3} />;
  }

  return (
    <div className="screen-stack">
      <Card className="soft-card hero-meeting-card">
        <div className="hero-meeting-card__top">
          <div className="hero-meeting-card__welcome">
            <div className="hero-meeting-card__avatar">J</div>
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
            <div className="hero-meeting-card__month">Março</div>
            <div className="hero-meeting-card__subline">3 atendimentos hoje</div>
          </div>
          <Tag color="warning" fill="outline">
            Modo demonstração
          </Tag>
        </div>

        <div className="hero-meeting-card__calendar" aria-hidden="true">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => {
            const active = index === 4;
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
          {recentClients.map((client) => (
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
