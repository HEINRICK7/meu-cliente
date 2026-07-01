import { AddOutline, ClockCircleOutline } from 'antd-mobile-icons';
import { Button, Empty, Tag } from 'antd-mobile';
import type { Appointment } from '../../types/domain';
import { appointmentStatusColor, appointmentStatusLabel } from './appointmentStatus';

type ScheduleSlot = {
  time: string;
  appointment?: Appointment;
};

type ScheduleTimelineProps = {
  slots: ScheduleSlot[];
  onSelectAppointment: (appointment: Appointment) => void;
  onSelectFreeSlot: (time: string) => void;
};

export function ScheduleTimeline({ slots, onSelectAppointment, onSelectFreeSlot }: ScheduleTimelineProps) {
  if (slots.length === 0) {
    return <Empty description="Nenhum horário para exibir neste dia." />;
  }

  return (
    <div className="schedule-timeline">
      {slots.map((slot) => {
        const appointment = slot.appointment;

        return (
          <div key={`${slot.time}-${appointment?.id ?? 'free'}`} className="schedule-timeline__row">
            <div className="schedule-timeline__time">{slot.time}</div>
            <div className="schedule-timeline__line" aria-hidden="true" />
            {appointment ? (
              <Button
                fill="none"
                className={`schedule-appointment-card schedule-appointment-card--${appointment.status}`}
                onClick={() => onSelectAppointment(appointment)}
              >
                <span className="schedule-appointment-card__top">
                  <strong>{appointment.clientName}</strong>
                  <Tag color={appointmentStatusColor[appointment.status]}>
                    {appointmentStatusLabel[appointment.status]}
                  </Tag>
                </span>
                <span className="schedule-appointment-card__service">{appointment.serviceType}</span>
                {appointment.notes ? <span className="schedule-appointment-card__notes">{appointment.notes}</span> : null}
              </Button>
            ) : (
              <Button fill="none" className="schedule-free-slot" onClick={() => onSelectFreeSlot(slot.time)}>
                <ClockCircleOutline />
                <span>Horário livre</span>
                <AddOutline />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
