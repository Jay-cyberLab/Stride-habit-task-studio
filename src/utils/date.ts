export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateISO(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function addDaysISO(dateStr: string, deltaDays: number): string {
  const d = parseDateISO(dateStr);
  d.setDate(d.getDate() + deltaDays);
  return formatDateISO(d);
}

export function getTodayISO(): string {
  return formatDateISO(new Date());
}

export function getRecentDays(referenceDateStr: string, count: number): string[] {
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    days.push(addDaysISO(referenceDateStr, -i));
  }
  return days;
}

export function formatShortDayLabel(dateStr: string): { weekday: string; dayNum: string; monthShort: string } {
  const d = parseDateISO(dateStr);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    weekday: weekdays[d.getDay()],
    dayNum: String(d.getDate()),
    monthShort: months[d.getMonth()],
  };
}

export function formatReadableDate(dateStr: string): string {
  const d = parseDateISO(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export interface CalendarGridDay {
  date: string;
  dayNum: number;
  inCurrentMonth: boolean;
}

/**
 * Builds a full Sunday-to-Saturday calendar grid (35 or 42 cells) for the given year and 0-indexed month.
 */
export function getMonthCalendarGrid(year: number, monthIndex: number): CalendarGridDay[] {
  const firstOfMonth = new Date(year, monthIndex, 1, 12, 0, 0, 0);
  const startWeekday = firstOfMonth.getDay(); // 0 (Sun) .. 6 (Sat)
  const daysInMonth = new Date(year, monthIndex + 1, 0, 12, 0, 0, 0).getDate();

  const totalCells = startWeekday + daysInMonth > 35 ? 42 : 35;
  const startDate = new Date(year, monthIndex, 1 - startWeekday, 12, 0, 0, 0);

  const cells: CalendarGridDay[] = [];
  for (let i = 0; i < totalCells; i += 1) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    cells.push({
      date: formatDateISO(d),
      dayNum: d.getDate(),
      inCurrentMonth: d.getMonth() === monthIndex && d.getFullYear() === year,
    });
  }
  return cells;
}

export function formatMonthYear(year: number, monthIndex: number): string {
  const d = new Date(year, monthIndex, 1, 12, 0, 0, 0);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function shiftMonth(year: number, monthIndex: number, deltaMonths: number): { year: number; monthIndex: number } {
  const d = new Date(year, monthIndex + deltaMonths, 1, 12, 0, 0, 0);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}
