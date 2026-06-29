import { AddOutline, CalendarOutline, CheckCircleOutline, RightOutline } from 'antd-mobile-icons';
import { Button, Card, List, Tabs, Toast } from 'antd-mobile';
import { useMemo, useState } from 'react';
import { AppointmentCard } from '../../components/AppointmentCard';
import { EmptyState } from '../../components/EmptyState';
import { getAgendaAppointments, getTodayAppointments } from '../../services/mockData';

type ScheduleView = 'hoje' | 'proximos' | 'semana';

const views: Array<{ key: ScheduleView; title: string }> = [
  { key: 'hoje', title: 'Hoje' },
  { key: 'proximos', title: 'Próximos' },
  { key: 'semana', title: 'Semana' },
];

export function ScheduleScreen() {
  const [view, setView] = useState<ScheduleView>('hoje');
  const appointments = useMemo(() => getAgendaAppointments(view), [view]);
  const todayAppointments = useMemo(() => getTodayAppointments(), []);
  const nextAppointment = todayAppointments[0];

  return (
    <div className="screen-stack">
      <Card className="soft-card hero-meeting-card hero-meeting-card--agenda">
        <div className="section-head">
          <div>
            <div className="section-label">Agenda</div>
            <div className="section-title">Quem precisa ser atendido agora</div>
          </div>
          <Button
            size="small"
            color="primary"
            fill="solid"
            shape="rounded"
            onClick={() => {
              Toast.show({ content: 'Novo agendamento será aberto depois.' });
            }}
          >
            <AddOutline />
            Novo
          </Button>
        </div>

        <div className="mini-summary-grid">
          <div>
            <strong>{todayAppointments.length}</strong>
            <span>Hoje</span>
          </div>
          <div>
            <strong>{appointments.length}</strong>
            <span>No período</span>
          </div>
          <div>
            <strong>{nextAppointment ? nextAppointment.time : '--:--'}</strong>
            <span>Próximo horário</span>
          </div>
        </div>
      </Card>

      <Tabs activeKey={view} onChange={(key) => setView(key as ScheduleView)}>
        {views.map((tab) => (
          <Tabs.Tab key={tab.key} title={tab.title} />
        ))}
      </Tabs>

      <Card className="soft-card">
        <div className="section-head">
          <div>
            <div className="section-label">Agenda</div>
            <div className="section-title">Compromissos do período</div>
          </div>
          <Button
            size="small"
            color="primary"
            fill="outline"
            shape="rounded"
            onClick={() => {
              Toast.show({ content: 'Ações rápidas virão depois.' });
            }}
          >
            <CalendarOutline />
            <RightOutline />
            Ações
          </Button>
        </div>

        {appointments.length === 0 ? (
          <EmptyState
            title="Sem compromissos por enquanto"
            description="Quando houver agenda, ela aparece aqui como cards grandes e simples."
            actionLabel="Novo agendamento"
            onAction={() => {
              Toast.show({ content: 'Novo agendamento será aberto depois.' });
            }}
          />
        ) : (
          <div className="screen-stack">
            {appointments.map((appointment, index) => (
              <AppointmentCard key={appointment.id} appointment={appointment} emphasis={view === 'hoje' && index === 0} />
            ))}
          </div>
        )}
      </Card>

      <Card className="soft-card">
        <div className="section-head">
          <div>
            <div className="section-label">Próximas ações</div>
            <div className="section-title">Operações rápidas</div>
          </div>
        </div>
        <List className="compact-list">
          <List.Item onClick={() => Toast.show({ content: 'Confirmar horário será integrado depois.' })}>
            <span className="more-list__item">
              <CheckCircleOutline />
              <span>Confirmar horário</span>
            </span>
          </List.Item>
          <List.Item onClick={() => Toast.show({ content: 'Reagendamento será integrado depois.' })}>
            <span className="more-list__item">
              <CalendarOutline />
              <span>Reagendar atendimento</span>
            </span>
          </List.Item>
        </List>
      </Card>
    </div>
  );
}
