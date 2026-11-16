import { useState } from 'react';
import { Calendar, Check, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';
import { Habit } from '../types';
import {
  formatMonthYear,
  formatReadableDate,
  getMonthCalendarGrid,
  parseDateISO,
  shiftMonth,
} from '../utils/date';
import {
  calculateBestStreak,
  calculateCompletionRate,
  calculateCurrentStreak,
  getHabitDaySummary,
  getHeatmapData,
} from '../utils/habits';

interface StreakHeatmapProps {
  habits: Habit[];
  selectedDate: string;
  todayStr: string;
  onSelectDate: (dateStr: string) => void;
  defaultMode?: 'grid' | 'calendar';
}

function getCellColorClass(ratio: number, isSelected: boolean): string {
  const ring = isSelected ? 'ring-2 ring-ink ring-offset-1 ring-offset-surface' : '';
  if (ratio <= 0) return `bg-heat-0 hover:opacity-80 ${ring}`;
  if (ratio < 0.5) return `bg-heat-1 hover:opacity-85 ${ring}`;
  if (ratio < 1) return `bg-heat-2 hover:opacity-90 ${ring}`;
  return `bg-heat-3 hover:opacity-90 ${ring}`;
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function StreakHeatmap({
  habits,
  selectedDate,
  todayStr,
  onSelectDate,
  defaultMode = 'grid',
}: StreakHeatmapProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>(defaultMode);

  const initialParsed = parseDateISO(selectedDate);
  const [calendarYear, setCalendarYear] = useState<number>(initialParsed.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(initialParsed.getMonth());

  const weeksCount = 20;
  const totalDays = weeksCount * 7;
  const cells = getHeatmapData(habits, todayStr, totalDays);

  const weeks: typeof cells[] = [];
  for (let w = 0; w < weeksCount; w += 1) {
    weeks.push(cells.slice(w * 7, (w + 1) * 7));
  }

  const monthGrid = getMonthCalendarGrid(calendarYear, calendarMonth);
  const selectedDaySummary = getHabitDaySummary(habits, selectedDate);

  const handleShiftMonth = (delta: number) => {
    const next = shiftMonth(calendarYear, calendarMonth, delta);
    setCalendarYear(next.year);
    setCalendarMonth(next.monthIndex);
  };

  const handleJumpToday = () => {
    const todayDate = parseDateISO(todayStr);
    setCalendarYear(todayDate.getFullYear());
    setCalendarMonth(todayDate.getMonth());
    onSelectDate(todayStr);
  };

  const todayParsed = parseDateISO(todayStr);
  const isViewingCurrentMonth =
    calendarYear === todayParsed.getFullYear() && calendarMonth === todayParsed.getMonth();

  return (
    <section
      aria-labelledby="streak-heatmap-heading"
      className="rounded-xl border border-line bg-surface p-4 sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="streak-heatmap-heading" className="font-display text-lg font-semibold text-ink">
            Streak &amp; Consistency
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {formatReadableDate(selectedDate)} · {selectedDaySummary.completedCount} of{' '}
            {selectedDaySummary.totalHabits} goals met
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex items-center rounded-lg bg-subtle p-1"
            role="group"
            aria-label="Heatmap display mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'grid' ? 'bg-surface text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>20-Week</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              aria-pressed={viewMode === 'calendar'}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'calendar' ? 'bg-surface text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Monthly</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-ink-muted" aria-hidden="true">
            <span>Less</span>
            <span className="h-3 w-3 rounded-[3px] bg-heat-0" />
            <span className="h-3 w-3 rounded-[3px] bg-heat-1" />
            <span className="h-3 w-3 rounded-[3px] bg-heat-2" />
            <span className="h-3 w-3 rounded-[3px] bg-heat-3" />
            <span>All</span>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="mt-4 overflow-x-auto pb-1">
          <div
            className="grid min-w-[540px] grid-cols-20 gap-1.5"
            role="grid"
            aria-label="20-week habit consistency heatmap"
          >
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-rows-7 gap-1.5" role="row">
                {week.map((cell) => {
                  const isSelected = cell.date === selectedDate;
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => onSelectDate(cell.date)}
                      aria-label={`${formatReadableDate(cell.date)}: ${cell.completedCount} of ${cell.totalHabits} habits completed`}
                      aria-pressed={isSelected}
                      title={`${cell.date} · ${cell.completedCount}/${cell.totalHabits} completed`}
                      className={`aspect-square w-full rounded-[4px] transition-colors ${getCellColorClass(
                        cell.ratio,
                        isSelected
                      )}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4" data-testid="monthly-calendar-view">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-ink">
              {formatMonthYear(calendarYear, calendarMonth)}
            </h3>
            <div className="flex items-center gap-1.5">
              {!isViewingCurrentMonth && (
                <button
                  type="button"
                  onClick={handleJumpToday}
                  className="rounded-lg border border-line bg-subtle px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-hover-surface"
                >
                  Today
                </button>
              )}
              <button
                type="button"
                onClick={() => handleShiftMonth(-1)}
                aria-label="Previous month"
                className="flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg border border-line bg-surface text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleShiftMonth(1)}
                aria-label="Next month"
                className="flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg border border-line bg-surface text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[10px] sm:text-[11px] font-medium text-ink-muted">
            {WEEKDAY_HEADERS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label="Monthly habit calendar">
            {monthGrid.map((cell) => {
              const summary = getHabitDaySummary(habits, cell.date);
              const isSelected = cell.date === selectedDate;
              const isToday = cell.date === todayStr;
              const hasNotes = summary.entries.some((e) => Boolean(e.note));
              const isFullDay = summary.ratio >= 1 && habits.length > 0;

              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => onSelectDate(cell.date)}
                  aria-label={`${formatReadableDate(cell.date)}: ${summary.completedCount} of ${summary.totalHabits} habits completed${hasNotes ? ', has reflection notes' : ''}`}
                  aria-pressed={isSelected}
                  className={`flex min-h-[44px] sm:min-h-[54px] flex-col justify-between rounded-lg border p-1 sm:p-1.5 text-left transition-colors ${
                    isSelected
                      ? 'border-ink ring-2 ring-ink/30'
                      : 'border-line hover:border-line-strong'
                  } ${cell.inCurrentMonth ? '' : 'opacity-45'} ${getCellColorClass(summary.ratio, false)} ${
                    isFullDay ? 'text-heat-3-fg' : 'text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between gap-0.5 sm:gap-1">
                    <span
                      className={`font-mono text-[11px] sm:text-xs tabular-nums ${
                        isToday ? 'font-bold underline underline-offset-2' : 'font-medium'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {hasNotes && (
                      <span
                        title="Has reflection note"
                        className={`h-1.5 w-1.5 rounded-full ${
                          isFullDay ? 'bg-heat-3-fg' : 'bg-ink'
                        }`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <span
                    className={`font-mono text-[9px] sm:text-[10px] tabular-nums ${
                      isFullDay ? 'text-heat-3-fg/90' : 'text-ink-secondary'
                    }`}
                  >
                    {summary.completedCount}/{summary.totalHabits}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Logs & Reflections Inspector */}
      {habits.length > 0 && (
        <div
          className="mt-5 border-t border-line pt-4"
          data-testid="selected-day-logs"
          aria-label={`Logs and reflections for ${formatReadableDate(selectedDate)}`}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-ink">
              Logs &amp; Reflections · {formatReadableDate(selectedDate)}
            </h3>
            <span className="font-mono text-xs font-medium text-accent-text tabular-nums">
              {selectedDaySummary.completedCount}/{selectedDaySummary.totalHabits} completed
            </span>
          </div>

          <ul className="divide-y divide-line">
            {selectedDaySummary.entries.map(({ habit, count, completed, note }) => (
              <li key={habit.id} className="py-2.5 first:pt-1 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                        completed
                          ? 'border-accent bg-accent text-accent-fg'
                          : 'border-line-strong bg-surface text-transparent'
                      }`}
                      aria-hidden="true"
                    >
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    <span className="truncate text-xs font-semibold text-ink">{habit.title}</span>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-ink-secondary tabular-nums">
                    {count}/{habit.targetCount} {habit.unit} · {completed ? 'Done' : 'Incomplete'}
                  </span>
                </div>
                {note ? (
                  <p className="mt-1 pl-0 sm:pl-6 text-xs leading-relaxed text-ink-secondary">
                    <span className="font-medium text-ink-muted">Note: </span>
                    {note}
                  </p>
                ) : (
                  <p className="mt-1 pl-0 sm:pl-6 text-[11px] text-ink-muted">No reflection note for this day</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Streak Comparison Table */}
      {habits.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-ink-muted">
                  <th className="pb-2 font-medium">Habit</th>
                  <th className="pb-2 text-right font-medium">Current</th>
                  <th className="pb-2 text-right font-medium">Best</th>
                  <th className="pb-2 text-right font-medium">30d Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {habits.map((habit) => {
                  const current = calculateCurrentStreak(habit, todayStr);
                  const best = calculateBestStreak(habit);
                  const rate30 = calculateCompletionRate(habit, todayStr, 30);
                  return (
                    <tr key={habit.id} className="hover:bg-subtle/50">
                      <td className="py-2.5 pr-3 font-medium text-ink">{habit.title}</td>
                      <td className="py-2.5 text-right font-mono font-semibold text-accent-text tabular-nums">
                        {current}d
                      </td>
                      <td className="py-2.5 text-right font-mono text-ink-secondary tabular-nums">
                        {best}d
                      </td>
                      <td className="py-2.5 text-right font-mono text-ink-secondary tabular-nums">
                        {rate30}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
