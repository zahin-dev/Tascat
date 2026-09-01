const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type DateParts = {
  year: number;
  month: number;
  day: number;
};

export function parseDateKey(value: string): DateParts | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(year, month - 1, day, 12);

  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function isDateKey(value: unknown): value is string {
  return typeof value === "string" && parseDateKey(value) !== null;
}

export function isTimeKey(value: unknown): value is string {
  return typeof value === "string" && TIME_PATTERN.test(value);
}

export function formatDateKey(parts: DateParts): string {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function dateToKey(date: Date): string {
  return formatDateKey({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

export function todayKey(now = new Date()): string {
  return dateToKey(now);
}

export function addCalendarDays(dateKey: string, days: number): string {
  const parts = parseDateKey(dateKey);
  if (!parts) throw new Error("Invalid date key");
  const result = new Date(parts.year, parts.month - 1, parts.day + days, 12);
  return dateToKey(result);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0, 12).getDate();
}

export function addCalendarMonth(dateKey: string, anchorDay: number): string {
  const parts = parseDateKey(dateKey);
  if (!parts) throw new Error("Invalid date key");
  const nextMonthIndex = parts.month;
  const nextYear = parts.year + Math.floor(nextMonthIndex / 12);
  const nextMonth = (nextMonthIndex % 12) + 1;
  const day = Math.min(anchorDay, daysInMonth(nextYear, nextMonth));
  return formatDateKey({ year: nextYear, month: nextMonth, day });
}

export function formatDateForDisplay(dateKey: string): string {
  const parts = parseDateKey(dateKey);
  if (!parts) return dateKey;
  return `${parts.year}/${String(parts.month).padStart(2, "0")}/${String(parts.day).padStart(2, "0")}`;
}

export function getMonthGrid(year: number, month: number): Array<number | null> {
  const firstWeekday = new Date(year, month - 1, 1, 12).getDay();
  const totalDays = daysInMonth(year, month);
  const cells: Array<number | null> = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= totalDays; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function moveMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const value = new Date(year, month - 1 + delta, 1, 12);
  return { year: value.getFullYear(), month: value.getMonth() + 1 };
}

