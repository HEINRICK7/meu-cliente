import { CalendarOutline, ClockCircleOutline } from 'antd-mobile-icons';
import { Card } from 'antd-mobile';
import { formatAppointmentDate } from '../services/appointmentsService';
import type { Appointment } from '../types/domain';
import { StatusTag } from './StatusTag';

type AppointmentCardProps = {
  appointment: Appointment;
  emphasis?: boolean;
  onClick?: () => void;
};

export function AppointmentCard({ appointment, emphasis, onClick }: AppointmentCardProps) {
  return (
    <Card
      className={emphasis ? 'soft-card appointment-card appointment-card--emphasis' : 'soft-card appointment-card'}
      onClick={onClick}
    >
      <div className="card-top-row">
        <div className="appointment-card__main">
          <div className="appointment-card__time">
            <ClockCircleOutline />
            <span>{appointment.time}</span>
          </div>
          <div>
            <div className="section-title appointment-card__title">{appointment.clientName}</div>
            <div className="appointment-card__subtitle">
              <CalendarOutline fontSize={14} />
              <span>{formatAppointmentDate(appointment.date)}</span>
            </div>
          </div>
        </div>
        <StatusTag status={appointment.status} />
      </div>

      <div className="appointment-card__meta">
        <span>{appointment.serviceType}</span>
        {appointment.notes ? <span>{appointment.notes}</span> : null}
      </div>
    </Card>
  );
}
