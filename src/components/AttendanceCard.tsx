import { MessageOutline } from 'antd-mobile-icons';
import { Card } from 'antd-mobile';
import type { Attendance } from '../types/domain';

type AttendanceCardProps = {
  attendance: Attendance;
  onClick?: () => void;
};

export function AttendanceCard({ attendance, onClick }: AttendanceCardProps) {
  return (
    <Card className="soft-card attendance-card" onClick={onClick}>
      <div className="card-top-row">
        <div className="attendance-card__main">
          <div className="attendance-card__avatar">{attendance.clientName.charAt(0)}</div>
          <div className="section-title attendance-card__title">{attendance.clientName}</div>
          <div className="attendance-card__subtitle">
            <MessageOutline fontSize={14} />
            <span>{attendance.date}</span>
          </div>
        </div>
      </div>

      <div className="attendance-card__meta">
        <span>{attendance.title}</span>
        <span>{attendance.description}</span>
        {attendance.nextAction ? <span>{attendance.nextAction}</span> : null}
        {attendance.returnDate ? <span>Retorno: {attendance.returnDate}</span> : null}
      </div>
    </Card>
  );
}
