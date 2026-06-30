import { CalendarOutline, MessageOutline } from 'antd-mobile-icons';
import { Button, Card, Empty, Grid, Tag } from 'antd-mobile';
import { useEffect, useMemo, useState } from 'react';
import { AppointmentCard } from '../../components/AppointmentCard';
import { ClientCard } from '../../components/ClientCard';
import { LoadingState } from '../../components/LoadingState';
import { useAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../hooks/useAuth';
import { useClients } from '../../hooks/useClients';
import { compareAppointmentsBySchedule, isAppointmentOnDay } from '../../services/appointmentsService';
import { formatCalendarDate, toDateKey } from '../../utils/date';

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

function goToRoute(route: 'agenda' | 'atendimentos' | 'clientes') {
  if (typeof window !== 'undefined') {
    window.location.hash = `#/${route}`;
  }
}

function buildWeekDays(referenceDate: Date) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function HomeScreen() {
  const { session } = useAuth();
  const { clients, loading: clientsLoading } = useClients(session?.businessId ?? null, session?.id ?? null);
  const { appointments, loading: appointmentsLoading } = useAppointments(
    session?.businessId ?? null,
    session?.id ?? null,
  );
  const [selectedDay, setSelectedDay] = useState(() => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    return day;
  });
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const summary = useMemo(() => {
    const todayAppointments = appointments.filter((appointment) => isAppointmentOnDay(appointment.date));
    const upcomingAppointments = appointments.filter((appointment) => appointment.date > toDateKey(new Date()));

    return {
      todayAppointments: todayAppointments.length,
      nextAppointments: upcomingAppointments.length,
      pendingFollowUps: appointments.filter(
        (appointment) => appointment.status === 'agendado' || appointment.status === 'confirmado',
      ).length,
    };
  }, [appointments]);

  const todayAppointments = useMemo(
    () => [...appointments.filter((appointment) => isAppointmentOnDay(appointment.date))].sort(compareAppointmentsBySchedule),
    [appointments],
  );
  const weekDays = useMemo(() => buildWeekDays(new Date()), []);
  const recentClients = useMemo(() => clients.slice(0, 2), [clients]);
  const selectedDayAppointments = useMemo(
    () =>
      [...appointments]
        .filter((appointment) => isAppointmentOnDay(appointment.date, selectedDay))
        .sort(compareAppointmentsBySchedule),
    [appointments, selectedDay],
  );
  const selectedAppointment = useMemo(
    () => selectedDayAppointments.find((appointment) => appointment.id === selectedAppointmentId) || selectedDayAppointments[0] || null,
    [selectedAppointmentId, selectedDayAppointments],
  );

  useEffect(() => {
    if (selectedDayAppointments.length === 0) {
      setSelectedAppointmentId(null);
      return;
    }

    if (!selectedAppointmentId || !selectedDayAppointments.some((appointment) => appointment.id === selectedAppointmentId)) {
      setSelectedAppointmentId(selectedDayAppointments[0].id);
    }
  }, [selectedAppointmentId, selectedDayAppointments]);

  if (appointmentsLoading || clientsLoading) {
    return <LoadingState lines={3} />;
  }

  return (
    <div className="screen-stack">
      <Card className="soft-card home-today-card">
        <div className="section-head">
          <div>
            <div className="section-label">Atendimentos de hoje</div>
            <div className="section-title">
              {todayAppointments.length > 0
                ? `Você tem ${todayAppointments.length} atendimento${todayAppointments.length === 1 ? '' : 's'}`
                : 'Nenhum atendimento hoje'}
            </div>
          </div>
          <Button size="small" fill="outline" shape="rounded" onClick={() => goToRoute('agenda')}>
            Ver todos
          </Button>
        </div>

        {todayAppointments.length === 0 ? (
          <Empty description="Nenhum atendimento agendado para hoje." />
        ) : (
          <Grid columns={3} gap={8} className="home-appointments-grid">
            {todayAppointments.slice(0, 3).map((appointment) => (
              <Button
                key={appointment.id}
                fill="none"
                className="home-appointment-tile"
                onClick={() => {
                  setSelectedDay(new Date());
                  setSelectedAppointmentId(appointment.id);
                }}
              >
                <span className="home-appointment-tile__time">{appointment.time}</span>
                <strong>{appointment.clientName}</strong>
                <span>{appointment.serviceType}</span>
              </Button>
            ))}
          </Grid>
        )}
      </Card>

      <Card className="soft-card hero-calendar-card">
        <div className="section-head">
          <div>
            <div className="section-label">Agenda da semana</div>
            <div className="section-title">{formatCalendarDate(toDateKey(selectedDay))}</div>
          </div>
          <Button size="small" fill="outline" shape="rounded" onClick={() => goToRoute('agenda')}>
            Ver agenda
          </Button>
        </div>

        <Grid columns={7} gap={8} className="hero-day-row">
          {weekDays.map((date) => {
            const isActive = toDateKey(date) === toDateKey(selectedDay);

            return (
              <Grid.Item key={toDateKey(date)}>
                <Button
                  fill="none"
                  className={isActive ? 'hero-day-chip hero-day-chip--active' : 'hero-day-chip'}
                  onClick={() => setSelectedDay(date)}
                >
                  <span>{date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                  <strong>{date.getDate()}</strong>
                </Button>
              </Grid.Item>
            );
          })}
        </Grid>

        <Grid columns={3} gap={8} className="hero-today-grid">
          <Button fill="none" className="hero-today-card" onClick={() => goToRoute('agenda')}>
            <strong>{summary.todayAppointments}</strong>
            <span>Hoje</span>
          </Button>
          <Button fill="none" className="hero-today-card" onClick={() => goToRoute('agenda')}>
            <strong>{summary.nextAppointments}</strong>
            <span>Próximos</span>
          </Button>
          <Button fill="none" className="hero-today-card" onClick={() => goToRoute('atendimentos')}>
            <strong>{summary.pendingFollowUps}</strong>
            <span>Pendências</span>
          </Button>
        </Grid>
      </Card>

      <Card className="soft-card">
        <div className="section-head">
          <div>
            <div className="section-label">Agenda do dia</div>
            <div className="section-title">
              {selectedDayAppointments.length === 0
                ? 'Nenhum atendimento neste dia'
                : `${selectedDayAppointments.length} atendimento${selectedDayAppointments.length === 1 ? '' : 's'}`}
            </div>
          </div>
          <Button size="small" fill="outline" shape="rounded" onClick={() => goToRoute('agenda')}>
            Abrir agenda
          </Button>
        </div>
        <div className="screen-stack">
          {selectedDayAppointments.length === 0 ? (
            <Empty description="Não há agendamentos para a data selecionada." />
          ) : (
            selectedDayAppointments.map((appointment, index) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                emphasis={index === 0}
                onClick={() => setSelectedAppointmentId(appointment.id)}
              />
            ))
          )}
        </div>
      </Card>

      {selectedAppointment ? (
        <Card className="soft-card highlight-card highlight-card--yellow">
          <div className="section-head">
            <div>
              <div className="section-label">Detalhe</div>
              <div className="section-title">{selectedAppointment.clientName}</div>
            </div>
            <Tag color={statusColor(selectedAppointment.status)}>{selectedAppointment.status}</Tag>
          </div>
          <p className="muted-text">
            {selectedAppointment.time} • {selectedAppointment.serviceType}
            {selectedAppointment.notes ? ` • ${selectedAppointment.notes}` : ''}
          </p>
          <div className="hero-action-row">
            <Button color="primary" fill="solid" shape="rounded" onClick={() => goToRoute('agenda')}>
              <CalendarOutline />
              Abrir agenda
            </Button>
            <Button color="primary" fill="outline" shape="rounded" onClick={() => goToRoute('atendimentos')}>
              <MessageOutline />
              Registrar atendimento
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="soft-card">
        <div className="section-head">
          <div>
            <div className="section-label">Clientes recentes</div>
            <div className="section-title">Acesso rápido</div>
          </div>
          <Button size="small" fill="outline" shape="rounded" onClick={() => goToRoute('clientes')}>
            Ver todos
          </Button>
        </div>
        <div className="screen-stack">
          {recentClients.length === 0 ? (
            <p className="muted-text">Nenhum cliente cadastrado ainda.</p>
          ) : (
            recentClients.map((client) => (
              <ClientCard key={client.id} client={client} onClick={() => goToRoute('clientes')} />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
