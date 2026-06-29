import {
  AddOutline,
  ChatAddOutline,
  ClockCircleOutline,
  EditSOutline,
  MessageOutline,
} from 'antd-mobile-icons';
import { Button, Card, List, Toast } from 'antd-mobile';
import { AttendanceCard } from '../../components/AttendanceCard';
import { EmptyState } from '../../components/EmptyState';
import { mockAttendances } from '../../services/mockData';

export function AttendancesScreen() {
  return (
    <div className="screen-stack">
      <Card className="soft-card hero-meeting-card hero-meeting-card--attendance">
        <div className="section-head">
          <div>
            <div className="section-label">Atendimento rápido</div>
            <div className="section-title">Registrar o que foi feito hoje</div>
          </div>
        </div>
        <div className="mini-summary-grid">
          <div>
            <strong>{mockAttendances.length}</strong>
            <span>Registros</span>
          </div>
          <div>
            <strong>Hoje</strong>
            <span>Modelo atual</span>
          </div>
          <div>
            <strong>+ Retorno</strong>
            <span>Próxima ação</span>
          </div>
        </div>
        <div className="quick-actions-grid" style={{ marginTop: 16 }}>
          <Button
            block
            color="primary"
            fill="solid"
            shape="rounded"
            onClick={() => {
              Toast.show({ content: 'Fluxo de atendimento será integrado depois.' });
            }}
          >
            <ChatAddOutline />
            Registrar atendimento
          </Button>
          <Button
            block
            color="primary"
            fill="outline"
            shape="rounded"
            onClick={() => {
              Toast.show({ content: 'Modelo rápido virá depois.' });
            }}
          >
            <ClockCircleOutline />
            Modelo rápido
          </Button>
        </div>
      </Card>

      <Card className="soft-card">
        <div className="section-head">
          <div>
            <div className="section-label">Últimos registros</div>
            <div className="section-title">Histórico recente</div>
          </div>
          <Button
            size="small"
            color="primary"
            fill="solid"
            shape="rounded"
            onClick={() => {
              Toast.show({ content: 'Novo atendimento será aberto depois.' });
            }}
          >
            <AddOutline />
            Novo
          </Button>
        </div>

        {mockAttendances.length === 0 ? (
          <EmptyState
            title="Nenhum atendimento salvo"
            description="Registros de atendimento aparecem aqui em cards simples."
            actionLabel="Registrar atendimento"
            onAction={() => {
              Toast.show({ content: 'Fluxo de atendimento será integrado depois.' });
            }}
          />
        ) : (
          <div className="screen-stack">
            {mockAttendances.map((attendance) => (
              <AttendanceCard key={attendance.id} attendance={attendance} />
            ))}
          </div>
        )}
      </Card>

      <Card className="soft-card">
        <div className="section-head">
          <div>
            <div className="section-label">Atalho</div>
            <div className="section-title">Próximos passos</div>
          </div>
        </div>
        <List className="compact-list">
          <List.Item onClick={() => Toast.show({ content: 'Abrir cliente será integrado depois.' })}>
            <span className="more-list__item">
              <MessageOutline />
              <span>Abrir histórico do cliente</span>
            </span>
          </List.Item>
          <List.Item onClick={() => Toast.show({ content: 'Editar modelo será integrado depois.' })}>
            <span className="more-list__item">
              <EditSOutline />
              <span>Editar modelo rápido</span>
            </span>
          </List.Item>
        </List>
      </Card>

      <Button
        block
        color="primary"
        fill="outline"
        shape="rounded"
        onClick={() => {
          Toast.show({ content: 'Novo modelo de atendimento em breve.' });
        }}
      >
        Criar modelo rápido
      </Button>
    </div>
  );
}
