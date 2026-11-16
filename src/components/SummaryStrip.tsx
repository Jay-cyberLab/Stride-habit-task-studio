import { Habit, Task } from '../types';
import {
  calculateCompletionRate,
  calculateCurrentStreak,
  isHabitCompletedOnDate,
} from '../utils/habits';
import { getTaskStats } from '../utils/tasks';
import { formatReadableDate } from '../utils/date';

interface SummaryStripProps {
  habits: Habit[];
  tasks: Task[];
  selectedDate: string;
  todayStr: string;
}

export function SummaryStrip({ habits, tasks, selectedDate, todayStr }: SummaryStripProps) {
  const completedToday = habits.filter((h) => isHabitCompletedOnDate(h, selectedDate)).length;
  const totalHabits = habits.length;
  const dailyPercent = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  let topStreak = 0;
  let topStreakHabitTitle = 'No active streak';
  for (const h of habits) {
    const streak = calculateCurrentStreak(h, todayStr);
    if (streak > topStreak) {
      topStreak = streak;
      topStreakHabitTitle = h.title;
    }
  }

  const avg14DayRate =
    totalHabits > 0
      ? Math.round(
          habits.reduce((sum, h) => sum + calculateCompletionRate(h, todayStr, 14), 0) / totalHabits
        )
      : 0;

  const taskStats = getTaskStats(tasks);
  const dateLabel = selectedDate === todayStr ? 'Today' : formatReadableDate(selectedDate);

  return (
    <section
      aria-label="Daily summary"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4"
    >
      <div className="bg-surface p-4 sm:p-5">
        <p className="text-xs font-medium text-ink-muted">Habit Progress · {dateLabel}</p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
            {completedToday}/{totalHabits}
          </span>
          <span className="font-mono text-xs font-medium text-accent-text tabular-nums">
            {dailyPercent}%
          </span>
        </div>
      </div>

      <div className="bg-surface p-4 sm:p-5">
        <p className="text-xs font-medium text-ink-muted">Top Active Streak</p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
            {topStreak}d
          </span>
          <span className="truncate text-xs text-ink-muted" title={topStreakHabitTitle}>
            {topStreakHabitTitle}
          </span>
        </div>
      </div>

      <div className="bg-surface p-4 sm:p-5">
        <p className="text-xs font-medium text-ink-muted">14-Day Consistency</p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
            {avg14DayRate}%
          </span>
          <span className="text-xs text-ink-muted">across {totalHabits} habits</span>
        </div>
      </div>

      <div className="bg-surface p-4 sm:p-5">
        <p className="text-xs font-medium text-ink-muted">Task Queue</p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
            {taskStats.active}
          </span>
          <span className="text-xs text-ink-muted tabular-nums">
            open · {taskStats.highPriorityActive} high priority
          </span>
        </div>
      </div>
    </section>
  );
}
