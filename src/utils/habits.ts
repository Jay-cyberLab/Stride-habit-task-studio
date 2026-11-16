import { Habit, HabitLogEntry } from '../types';
import { addDaysISO, formatShortDayLabel, getRecentDays } from './date';

export function getHabitCountForDate(habit: Habit, dateStr: string): number {
  return Math.max(0, habit.logs[dateStr]?.count ?? 0);
}

export function getHabitNoteForDate(habit: Habit, dateStr: string): string {
  return habit.logs[dateStr]?.note ?? '';
}

export function isHabitCompletedOnDate(habit: Habit, dateStr: string): boolean {
  return getHabitCountForDate(habit, dateStr) >= habit.targetCount;
}

export function getHabitProgressRatio(habit: Habit, dateStr: string): number {
  if (habit.targetCount <= 0) return 1;
  return Math.min(1, getHabitCountForDate(habit, dateStr) / habit.targetCount);
}

/**
 * Counts consecutive completed days up to referenceDateStr.
 * If referenceDateStr is not yet completed today, checks if yesterday was completed
 * so an active streak remains visible before today's log is recorded.
 */
export function calculateCurrentStreak(habit: Habit, referenceDateStr: string): number {
  const completedToday = isHabitCompletedOnDate(habit, referenceDateStr);
  let cursor = completedToday ? referenceDateStr : addDaysISO(referenceDateStr, -1);

  let streak = 0;
  while (isHabitCompletedOnDate(habit, cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

export function calculateBestStreak(habit: Habit): number {
  const completedDates = Object.keys(habit.logs)
    .filter((d) => (habit.logs[d]?.count ?? 0) >= habit.targetCount)
    .sort();

  if (completedDates.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let i = 1; i < completedDates.length; i += 1) {
    const prevExpectedNext = addDaysISO(completedDates[i - 1], 1);
    if (completedDates[i] === prevExpectedNext) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }

  return best;
}

export function calculateCompletionRate(habit: Habit, referenceDateStr: string, days: number): number {
  if (days <= 0) return 0;
  const windowDates = getRecentDays(referenceDateStr, days);
  const completedCount = windowDates.filter((d) => isHabitCompletedOnDate(habit, d)).length;
  return Math.round((completedCount / days) * 100);
}

export function incrementHabitLog(habit: Habit, dateStr: string, delta: number): Habit {
  const current = getHabitCountForDate(habit, dateStr);
  const existingNote = habit.logs[dateStr]?.note;
  const next = Math.max(0, current + delta);
  const nextLogs: Record<string, HabitLogEntry> = { ...habit.logs };

  if (next === 0 && !existingNote) {
    delete nextLogs[dateStr];
  } else {
    nextLogs[dateStr] = existingNote ? { count: next, note: existingNote } : { count: next };
  }

  return {
    ...habit,
    logs: nextLogs,
  };
}

export function setHabitCompletedOnDate(habit: Habit, dateStr: string, completed: boolean): Habit {
  const existingNote = habit.logs[dateStr]?.note;
  const nextLogs: Record<string, HabitLogEntry> = { ...habit.logs };

  if (completed) {
    const nextCount = Math.max(habit.targetCount, getHabitCountForDate(habit, dateStr));
    nextLogs[dateStr] = existingNote ? { count: nextCount, note: existingNote } : { count: nextCount };
  } else if (existingNote) {
    nextLogs[dateStr] = { count: 0, note: existingNote };
  } else {
    delete nextLogs[dateStr];
  }

  return {
    ...habit,
    logs: nextLogs,
  };
}

export function setHabitNoteForDate(habit: Habit, dateStr: string, note: string): Habit {
  const trimmed = note.trim();
  const currentCount = getHabitCountForDate(habit, dateStr);
  const nextLogs: Record<string, HabitLogEntry> = { ...habit.logs };

  if (!trimmed && currentCount === 0) {
    delete nextLogs[dateStr];
  } else if (!trimmed) {
    nextLogs[dateStr] = { count: currentCount };
  } else {
    nextLogs[dateStr] = { count: currentCount, note: trimmed };
  }

  return {
    ...habit,
    logs: nextLogs,
  };
}

export function normalizeLegacyHabit(raw: Habit): Habit {
  const normalizedLogs: Record<string, HabitLogEntry> = {};
  const rawLogs = raw.logs as Record<string, HabitLogEntry | number> | undefined;
  if (rawLogs && typeof rawLogs === 'object') {
    for (const [dateStr, val] of Object.entries(rawLogs)) {
      if (typeof val === 'number') {
        if (val > 0) normalizedLogs[dateStr] = { count: val };
      } else if (val && typeof val === 'object') {
        const count = typeof val.count === 'number' ? Math.max(0, val.count) : 0;
        const note = typeof val.note === 'string' && val.note.trim() ? val.note.trim() : undefined;
        if (count > 0 || note) {
          normalizedLogs[dateStr] = note ? { count, note } : { count };
        }
      }
    }
  }
  return {
    ...raw,
    logs: normalizedLogs,
  };
}

export interface HeatmapCell {
  date: string;
  completedCount: number;
  totalHabits: number;
  ratio: number;
}

export function getHeatmapData(habits: Habit[], referenceDateStr: string, totalDays: number): HeatmapCell[] {
  const dates = getRecentDays(referenceDateStr, totalDays);
  const totalHabits = habits.length;

  return dates.map((date) => {
    if (totalHabits === 0) {
      return { date, completedCount: 0, totalHabits: 0, ratio: 0 };
    }
    const completedCount = habits.filter((h) => isHabitCompletedOnDate(h, date)).length;
    return {
      date,
      completedCount,
      totalHabits,
      ratio: completedCount / totalHabits,
    };
  });
}

export interface HabitDayEntry {
  habit: Habit;
  count: number;
  completed: boolean;
  note: string;
}

export interface HabitDaySummary {
  date: string;
  completedCount: number;
  totalHabits: number;
  ratio: number;
  entries: HabitDayEntry[];
}

export function getHabitDaySummary(habits: Habit[], dateStr: string): HabitDaySummary {
  const entries: HabitDayEntry[] = habits.map((habit) => ({
    habit,
    count: getHabitCountForDate(habit, dateStr),
    completed: isHabitCompletedOnDate(habit, dateStr),
    note: getHabitNoteForDate(habit, dateStr),
  }));

  const completedCount = entries.filter((e) => e.completed).length;
  const totalHabits = habits.length;

  return {
    date: dateStr,
    completedCount,
    totalHabits,
    ratio: totalHabits > 0 ? completedCount / totalHabits : 0,
    entries,
  };
}

export function validateHabitInput(input: { title: string; targetCount: number; unit: string }): string | null {
  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) {
    return 'Please enter a habit name.';
  }
  if (trimmedTitle.length > 60) {
    return 'Habit name must be 60 characters or fewer.';
  }
  if (!Number.isFinite(input.targetCount) || input.targetCount < 1 || input.targetCount > 999) {
    return 'Daily goal target must be between 1 and 999.';
  }
  if (!input.unit.trim()) {
    return 'Please specify a unit (e.g. min, glasses, times).';
  }
  return null;
}

export function filterHabits(habits: Habit[], search: string): Habit[] {
  const q = search.trim().toLowerCase();
  if (!q) return habits;
  return habits.filter(
    (habit) =>
      habit.title.toLowerCase().includes(q) || habit.category.toLowerCase().includes(q)
  );
}

export interface WeeklyPerformancePoint {
  date: string;
  dayLabel: string;
  shortDay: string;
  completedCount: number;
  totalHabits: number;
  completionRate: number;
  notesCount: number;
}

export function getWeeklyPerformanceData(
  habits: Habit[],
  referenceDateStr: string,
  days: number = 7
): WeeklyPerformancePoint[] {
  const dates = getRecentDays(referenceDateStr, days);
  const totalHabits = habits.length;

  return dates.map((date) => {
    const { weekday, dayNum } = formatShortDayLabel(date);
    if (totalHabits === 0) {
      return {
        date,
        dayLabel: `${weekday} ${dayNum}`,
        shortDay: weekday,
        completedCount: 0,
        totalHabits: 0,
        completionRate: 0,
        notesCount: 0,
      };
    }

    const completedCount = habits.filter((h) => isHabitCompletedOnDate(h, date)).length;
    const notesCount = habits.filter((h) => Boolean(getHabitNoteForDate(h, date))).length;
    return {
      date,
      dayLabel: `${weekday} ${dayNum}`,
      shortDay: weekday,
      completedCount,
      totalHabits,
      completionRate: Math.round((completedCount / totalHabits) * 100),
      notesCount,
    };
  });
}
