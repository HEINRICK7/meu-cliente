const ISO_CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const BRAZILIAN_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

function pad(value: number) {
  return `${value}`.padStart(2, '0');
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseCalendarDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const isoMatch = ISO_CALENDAR_DATE_PATTERN.exec(trimmed);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const brazilianMatch = BRAZILIAN_DATE_PATTERN.exec(trimmed);
  if (brazilianMatch) {
    const [, day, month, year] = brazilianMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatCalendarDate(value: string) {
  const parsed = parseCalendarDate(value);

  if (!parsed) {
    return value || 'Data sem registro';
  }

  return parsed.toLocaleDateString('pt-BR');
}

