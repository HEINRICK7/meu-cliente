import { Badge, Button } from 'antd-mobile';
import { toDateKey } from '../../utils/date';

type ScheduleWeekStripProps = {
  days: Date[];
  selectedDate: Date;
  appointmentCounts: Record<string, number>;
  onSelectDate: (date: Date) => void;
};

export function ScheduleWeekStrip({ days, selectedDate, appointmentCounts, onSelectDate }: ScheduleWeekStripProps) {
  const selectedKey = toDateKey(selectedDate);

  return (
    <div className="schedule-week-strip">
      {days.map((date) => {
        const dateKey = toDateKey(date);
        const isSelected = dateKey === selectedKey;
        const count = appointmentCounts[dateKey] ?? 0;

        return (
          <Button
            key={dateKey}
            fill="none"
            className={isSelected ? 'schedule-day-chip schedule-day-chip--active' : 'schedule-day-chip'}
            onClick={() => onSelectDate(date)}
          >
            <Badge content={count > 0 ? count : null}>
              <span className="schedule-day-chip__content">
                <span>{date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                <strong>{date.getDate()}</strong>
              </span>
            </Badge>
          </Button>
        );
      })}
    </div>
  );
}
