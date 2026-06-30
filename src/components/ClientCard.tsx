import { UserOutline } from 'antd-mobile-icons';
import { Avatar, Card, Ellipsis, Space } from 'antd-mobile';
import type { Client } from '../types/domain';
import { StatusTag } from './StatusTag';

type ClientCardProps = {
  client: Client;
  selected?: boolean;
  onClick?: () => void;
};

export function ClientCard({ client, selected, onClick }: ClientCardProps) {
  return (
    <Card
      className={selected ? 'soft-card client-card client-card--selected' : 'soft-card client-card'}
      onClick={onClick}
    >
      <div className="card-top-row">
        <div className="client-card__main">
          <Avatar className="client-card__avatar" src="" fallback={client.name.charAt(0)} />
          <div className="section-title client-card__title">
            <Ellipsis content={client.name} />
          </div>
          <div className="client-card__phone">
            <Ellipsis content={client.phone} />
          </div>
        </div>
        <div className="card-inline-badge">
          <UserOutline fontSize={14} />
          <StatusTag status={client.status} />
        </div>
      </div>

      <Space direction="vertical" className="client-card__meta" block>
        <span>{client.lastAttendance ?? 'Sem atendimento ainda'}</span>
        <span>{client.nextAppointment ?? 'Sem agendamento'}</span>
        {client.notes ? <span>{client.notes}</span> : null}
      </Space>
    </Card>
  );
}
