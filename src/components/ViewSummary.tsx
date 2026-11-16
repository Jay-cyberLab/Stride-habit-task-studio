import { useState } from 'react';
import { BarChart3, LayoutGrid } from 'lucide-react';
import { Habit, Task, WorkspaceView } from '../types';
import { formatReadableDate } from '../utils/date';
import {
  calculateBestStreak,
  calculateCompletionRate,
  calculateCurrentStreak,
  getHabitNoteForDate,
  isHabitCompletedOnDate,
} from '../utils/habits';
import { getTaskStats } from '../utils/tasks';
import { SummaryStrip } from './SummaryStrip';
import { WeeklyPerformanceChart } from './WeeklyPerformanceChart';
import { WeeklyTaskPerformanceChart } from './WeeklyTaskPerformanceChart';

type SummaryDisplayMode = 'cards' | 'weekly-chart';

interface ViewSummaryProps {
  activeView: WorkspaceView;
  habits: Habit[];
  tasks: Task[];
  selectedDate: string;
  todayStr: string;
}

const PAGE_COPY: Record<WorkspaceView, { title: string; subtitle: string }> = {
  overview: {
    title: 'Daily Overview',
    subtitle: 'Your daily snapshot across habit goals, streak momentum, and priority tasks.',
  },
  habits: {
    title: 'Habit Tracker',
    subtitle: 'Set daily targets, log progress across the week, and capture daily self-reflection notes.',
  },
  tasks: {
    title: 'Task Planner',
    subtitle: 'Organize actionable work by category, priority tag, and due date.',
  },
  streaks: {
    title: 'Streaks & Calendar',
    subtitle: 'Inspect monthly calendars or 20-week heatmaps and review completion logs for any past day.',
  },
  diary: {
    title: 'Personal Diary',
    subtitle: 'A password-protected space to record daily thoughts, moods, and private reflections.',
  },
};

export function ViewSummary({
  activeView,
  habits,
  tasks,
  selectedDate,
  todayStr,
}: ViewSummaryProps) {
  const [summaryMode, setSummaryMode] = useState<SummaryDisplayMode>('cards');
  const copy = PAGE_COPY[activeView];

  const renderSummaryCards = () => {
    if (activeView === 'overview') {
      return (
        <SummaryStrip
          habits={habits}
          tasks={tasks}
          selectedDate={selectedDate}
          todayStr={todayStr}
        />
      );
    }

    if (activeView === 'habits') {
      const completedSelected = habits.filter((h) => isHabitCompletedOnDate(h, selectedDate)).length;
      const total = habits.length;
      const pct = total > 0 ? Math.round((completedSelected / total) * 100) : 0;
      const activeStreaksCount = habits.filter((h) => calculateCurrentStreak(h, todayStr) > 0).length;
      const notesOnDay = habits.filter((h) => Boolean(getHabitNoteForDate(h, selectedDate))).length;
      const totalNotesCount = habits.reduce(
        (sum, h) => sum + Object.values(h.logs).filter((entry) => Boolean(entry.note)).length,
        0
      );

      return (
        <section
          aria-label="Habits summary"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4"
        >
          <div className="bg-surface p-4 sm:p-5">
            <p className="text-xs font-medium text-ink-muted">
              Completed · {selectedDate === todayStr ? 'Today' : formatReadableDate(selectedDate)}
            </p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {completedSelected}/{total}
              </span>
              <span className="font-mono text-xs font-medium text-accent-text tabular-nums">
                {pct}%
              </span>
            </div>
          </div>
          <div className="bg-surface p-4 sm:p-5">
            <p className="text-xs font-medium text-ink-muted">Active Streaks</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {activeStreaksCount}
              </span>
              <span className="text-xs text-ink-muted">habits with active runs</span>
            </div>
          </div>
          <div className="bg-surface p-4 sm:p-5">
            <p className="text-xs font-medium text-ink-muted">Reflections Logged</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {totalNotesCount}
              </span>
              <span className="text-xs text-ink-muted tabular-nums">
                {notesOnDay} on selected day
              </span>
            </div>
          </div>
          <div className="bg-surface p-4 sm:p-5">
            <p className="text-xs font-medium text-ink-muted">14-Day Habit Rate</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {total > 0
                  ? Math.round(
                      habits.reduce((s, h) => s + calculateCompletionRate(h, todayStr, 14), 0) /
                        total
                    )
                  : 0}
                %
              </span>
              <span className="text-xs text-ink-muted">rolling average</span>
            </div>
          </div>
        </section>
      );
    }

    if (activeView === 'tasks') {
      const stats = getTaskStats(tasks);
      const donePct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      const activeCategories = Object.values(stats.byCategory).filter((n) => n > 0).length;

      return (
        <section
          aria-label="Tasks summary"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4"
        >
          <div className="bg-surface p-4 sm:p-5">
            <p className="text-xs font-medium text-ink-muted">Open Tasks</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {stats.active}
              </span>
              <span className="text-xs text-ink-muted">of {stats.total} total</span>
            </div>
          </div>
          <div className="bg-surface p-4 sm:p-5">
            <p className="text-xs font-medium text-ink-muted">High Priority Open</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-danger-text tabular-nums">
                {stats.highPriorityActive}
              </span>
              <span className="text-xs text-ink-muted">urgent focus items</span>
            </div>
          </div>
          <div className="bg-surface p-4 sm:p-5">
            <p className="text-xs font-medium text-ink-muted">Completed</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {stats.completed}
              </span>
              <span className="font-mono text-xs font-medium text-accent-text tabular-nums">
                {donePct}%
              </span>
            </div>
          </div>
          <div className="bg-surface p-4 sm:p-5">
            <p className="text-xs font-medium text-ink-muted">Active Categories</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {activeCategories}
              </span>
              <span className="text-xs text-ink-muted">tagged areas</span>
            </div>
          </div>
        </section>
      );
    }

    if (activeView === 'streaks') {
      let topCurrent = 0;
      let topCurrentName = 'No active streak';
      let allTimeBest = 0;
      let bestHabitName = 'No logs yet';

      for (const h of habits) {
        const cur = calculateCurrentStreak(h, todayStr);
        if (cur > topCurrent) {
          topCurrent = cur;
          topCurrentName = h.title;
        }
        const best = calculateBestStreak(h);
        if (best > allTimeBest) {
          allTimeBest = best;
          bestHabitName = h.title;
        }
      }

      const avg14 =
        habits.length > 0
          ? Math.round(
              habits.reduce((s, h) => s + calculateCompletionRate(h, todayStr, 14), 0) / habits.length
            )
          : 0;
      const avg30 =
        habits.length > 0
          ? Math.round(
              habits.reduce((s, h) => s + calculateCompletionRate(h, todayStr, 30), 0) / habits.length
            )
          : 0;

      return (
        <section
          aria-label="Streaks summary"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4"
        >
          <div className="bg-surface p-4 sm:p-5">
            <p className="text-xs font-medium text-ink-muted">Top Active Streak</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {topCurrent}d
              </span>
              <span className="truncate text-xs text-ink-muted">{topCurrentName}</span>
            </div>
          </div>
          <div className="bg-surface p-4 sm:p-5">
            <p className="text-xs font-medium text-ink-muted">All-Time Best</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {allTimeBest}d
              </span>
              <span className="truncate text-xs text-ink-muted">{bestHabitName}</span>
            </div>
          </div>
          <div className="bg-surface p-4 sm:p-5">
            <p className="text-xs font-medium text-ink-muted">14-Day Consistency</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {avg14}%
              </span>
              <span className="text-xs text-ink-muted">recent 2 weeks</span>
            </div>
          </div>
          <div className="bg-surface p-4 sm:p-5">
            <p className="text-xs font-medium text-ink-muted">30-Day Consistency</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {avg30}%
              </span>
              <span className="text-xs text-ink-muted">monthly average</span>
            </div>
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl [text-wrap:balance]">
            {copy.title}
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">{copy.subtitle}</p>
        </div>

        {activeView !== 'diary' && (
          <div
            role="group"
            aria-label="Summary view mode"
            className="inline-flex self-start rounded-lg border border-line bg-subtle p-1 sm:self-auto shrink-0"
          >
            <button
              type="button"
              onClick={() => setSummaryMode('cards')}
              aria-pressed={summaryMode === 'cards'}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                summaryMode === 'cards'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Summary</span>
            </button>
            <button
              type="button"
              onClick={() => setSummaryMode('weekly-chart')}
              aria-pressed={summaryMode === 'weekly-chart'}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                summaryMode === 'weekly-chart'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Weekly Performance</span>
            </button>
          </div>
        )}
      </div>

      {activeView !== 'diary' && summaryMode === 'weekly-chart' ? (
        activeView === 'tasks' ? (
          <WeeklyTaskPerformanceChart tasks={tasks} todayStr={todayStr} />
        ) : (
          <WeeklyPerformanceChart habits={habits} todayStr={todayStr} />
        )
      ) : (
        renderSummaryCards()
      )}
    </div>
  );
}
