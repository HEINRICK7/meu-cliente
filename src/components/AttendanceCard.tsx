import { MessageOutline } from 'antd-mobile-icons';
import { Avatar, Card, Ellipsis, Space } from 'antd-mobile';
import { formatAttendanceDate } from '../services/attendancesService';
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
          <Avatar className="attendance-card__avatar" src="" fallback={attendance.clientName.charAt(0)} />
          <div className="section-title attendance-card__title">
            <Ellipsis content={attendance.clientName} />
          </div>
          <div className="attendance-card__subtitle">
            <MessageOutline fontSize={14} />
            <span>{formatAttendanceDate(attendance.date)}</span>
          </div>
        </div>
      </div>

      <Space direction="vertical" className="attendance-card__meta" block>
        <span>{attendance.title}</span>
        <span>{attendance.description}</span>
        {attendance.nextAction ? <span>{attendance.nextAction}</span> : null}
        {attendance.returnDate ? <span>Retorno: {attendance.returnDate}</span> : null}
      </Space>
    </Card>
  );
}
