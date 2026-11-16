import React, { useState } from 'react';
import { Check, FileText, Minus, Pencil, Plus, RotateCcw } from 'lucide-react';
import { Habit } from '../types';
import { formatReadableDate, formatShortDayLabel, getRecentDays } from '../utils/date';
import {
  calculateBestStreak,
  calculateCurrentStreak,
  filterHabits,
  getHabitCountForDate,
  getHabitNoteForDate,
  getHabitProgressRatio,
  isHabitCompletedOnDate,
} from '../utils/habits';

interface HabitsPanelProps {
  habits: Habit[];
  selectedDate: string;
  todayStr: string;
  searchQuery?: string;
  onClearSearch?: () => void;
  onSelectDate: (dateStr: string) => void;
  onIncrementHabit: (habitId: string, delta: number) => void;
  onToggleHabitComplete: (habitId: string) => void;
  onSaveHabitNote: (habitId: string, note: string) => void;
  onEditHabit: (habit: Habit) => void;
  onOpenNewHabit: () => void;
}

export function HabitsPanel({
  habits,
  selectedDate,
  todayStr,
  searchQuery = '',
  onClearSearch,
  onSelectDate,
  onIncrementHabit,
  onToggleHabitComplete,
  onSaveHabitNote,
  onEditHabit,
  onOpenNewHabit,
}: HabitsPanelProps) {
  const recentSevenDays = getRecentDays(todayStr, 7);
  const isViewingToday = selectedDate === todayStr;
  const trimmedSearch = searchQuery.trim();
  const filteredHabits = filterHabits(habits, trimmedSearch);

  const [editingNoteHabitId, setEditingNoteHabitId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const handleOpenNoteEditor = (habit: Habit) => {
    if (editingNoteHabitId === habit.id) {
      setEditingNoteHabitId(null);
      return;
    }
    setEditingNoteHabitId(habit.id);
    setNoteDraft(getHabitNoteForDate(habit, selectedDate));
  };

  const handleNoteSubmit = (e: React.FormEvent, habitId: string) => {
    e.preventDefault();
    onSaveHabitNote(habitId, noteDraft);
    setEditingNoteHabitId(null);
  };

  return (
    <section
      aria-labelledby="habits-section-heading"
      className="rounded-xl border border-line bg-surface p-4 sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="habits-section-heading" className="font-display text-lg font-semibold text-ink">
            Daily Habits
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {isViewingToday ? 'Today' : 'Viewing'} · {formatReadableDate(selectedDate)}
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {!isViewingToday && (
            <button
              type="button"
              onClick={() => onSelectDate(todayStr)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-line bg-subtle px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-hover-surface whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Today</span>
            </button>
          )}
          <div className="flex items-center gap-1 rounded-lg bg-subtle p-1" role="group" aria-label="Select day">
            {recentSevenDays.map((dayStr) => {
              const { weekday, dayNum } = formatShortDayLabel(dayStr);
              const isSelected = dayStr === selectedDate;
              const isToday = dayStr === todayStr;
              return (
                <button
                  key={dayStr}
                  type="button"
                  onClick={() => {
                    onSelectDate(dayStr);
                    setEditingNoteHabitId(null);
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${weekday} ${dayNum}${isToday ? ' (Today)' : ''}`}
                  className={`flex min-w-[36px] sm:min-w-[40px] flex-col items-center rounded-md px-1.5 sm:px-2 py-1 text-center transition-colors ${
                    isSelected
                      ? 'bg-cta text-cta-fg shadow-xs'
                      : 'text-ink-muted hover:bg-surface/70 hover:text-ink'
                  }`}
                >
                  <span className="text-[10px] font-medium leading-none">{weekday.slice(0, 2)}</span>
                  <span className="mt-1 font-mono text-xs font-semibold leading-none tabular-nums">
                    {dayNum}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-ink">No daily habits configured yet</p>
          <p className="mt-1 text-xs text-ink-muted">
            Create a daily goal to start tracking streaks and consistency.
          </p>
          <button
            type="button"
            onClick={onOpenNewHabit}
            className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-cta px-4 py-2 text-sm font-medium text-cta-fg transition-colors hover:bg-cta-hover"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Create First Habit</span>
          </button>
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="py-10 text-center" data-testid="habits-empty-search">
          <p className="text-sm font-medium text-ink">
            No habits match &ldquo;{trimmedSearch}&rdquo;
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Try searching another habit title or category.
          </p>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="mt-3 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-subtle"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-line" data-testid="habits-list">
          {filteredHabits.map((habit) => {
            const count = getHabitCountForDate(habit, selectedDate);
            const dailyNote = getHabitNoteForDate(habit, selectedDate);
            const completed = isHabitCompletedOnDate(habit, selectedDate);
            const ratio = getHabitProgressRatio(habit, selectedDate);
            const currentStreak = calculateCurrentStreak(habit, todayStr);
            const bestStreak = calculateBestStreak(habit);
            const isEditingNote = editingNoteHabitId === habit.id;

            const radius = 16;
            const circumference = 2 * Math.PI * radius;
            const strokeOffset = circumference * (1 - ratio);

            return (
              <li key={habit.id} className="py-4 first:pt-4 last:pb-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <button
                      type="button"
                      onClick={() => onToggleHabitComplete(habit.id)}
                      aria-label={
                        completed
                          ? `Unmark ${habit.title} for ${selectedDate}`
                          : `Mark ${habit.title} complete for ${selectedDate}`
                      }
                      aria-pressed={completed}
                      className="relative flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
                        <circle
                          cx="20"
                          cy="20"
                          r={radius}
                          fill="none"
                          stroke="var(--border-subtle)"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r={radius}
                          fill="none"
                          stroke={completed ? 'var(--accent)' : habit.accentColor}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeOffset}
                          className="transition-all duration-200"
                        />
                      </svg>
                      <span
                        className={`absolute flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                          completed ? 'bg-accent text-accent-fg' : 'bg-transparent text-ink-muted'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                      </span>
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-ink">{habit.title}</h3>
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-muted">
                        <span>{habit.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-ink-secondary">
                          {count}/{habit.targetCount} {habit.unit}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-mono tabular-nums ${
                            currentStreak > 0 ? 'font-medium text-accent-text' : 'text-ink-muted'
                          }`}
                        >
                          {currentStreak}d streak
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">Best {bestStreak}d</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pl-0 sm:justify-end sm:pl-0">
                    {/* 7-day visual streak mini-strip */}
                    <div className="hidden items-center gap-1 xl:flex" aria-hidden="true">
                      {recentSevenDays.map((d) => {
                        const done = isHabitCompletedOnDate(habit, d);
                        return (
                          <span
                            key={d}
                            title={`${d}: ${done ? 'Completed' : 'Incomplete'}`}
                            className="h-2.5 w-2.5 rounded-[3px] transition-colors"
                            style={{
                              backgroundColor: done ? habit.accentColor : 'var(--border-subtle)',
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Goal stepper */}
                    <div className="flex items-center rounded-lg border border-line bg-subtle">
                      <button
                        type="button"
                        onClick={() => onIncrementHabit(habit.id, -1)}
                        disabled={count === 0}
                        aria-label={`Decrease ${habit.title} progress`}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-l-lg text-ink-secondary transition-colors hover:bg-hover-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[36px] sm:min-w-[36px]"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="min-w-[44px] px-1.5 text-center font-mono text-xs font-medium text-ink tabular-nums">
                        {Math.round(ratio * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => onIncrementHabit(habit.id, 1)}
                        aria-label={`Increase ${habit.title} progress`}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-r-lg text-ink transition-colors hover:bg-hover-surface sm:min-h-[36px] sm:min-w-[36px]"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenNoteEditor(habit)}
                      aria-expanded={isEditingNote}
                      aria-label={
                        dailyNote
                          ? `Edit reflection note for ${habit.title}`
                          : `Add reflection note for ${habit.title}`
                      }
                      title={dailyNote ? 'Edit daily reflection note' : 'Add daily reflection note'}
                      className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors sm:min-h-[36px] sm:min-w-[36px] ${
                        dailyNote || isEditingNote
                          ? 'bg-accent-soft text-accent-text'
                          : 'text-ink-muted hover:bg-subtle hover:text-ink'
                      }`}
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditHabit(habit)}
                      aria-label={`Edit ${habit.title}`}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-subtle hover:text-ink sm:min-h-[36px] sm:min-w-[36px]"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Saved Daily Reflection Note Display */}
                {dailyNote && !isEditingNote && (
                  <div className="mt-2.5 pl-0 sm:pl-14">
                    <button
                      type="button"
                      onClick={() => handleOpenNoteEditor(habit)}
                      className="text-left text-xs leading-relaxed text-ink-secondary hover:text-ink"
                    >
                      <span className="font-medium text-ink-muted">Reflection: </span>
                      <span>{dailyNote}</span>
                    </button>
                  </div>
                )}

                {/* Inline Reflection Note Editor */}
                {isEditingNote && (
                  <form
                    onSubmit={(e) => handleNoteSubmit(e, habit.id)}
                    className="mt-3 space-y-2 pl-0 sm:pl-14"
                  >
                    <label htmlFor={`habit-note-${habit.id}`} className="block text-xs font-medium text-ink-secondary">
                      Reflection note for {formatReadableDate(selectedDate)}
                    </label>
                    <textarea
                      id={`habit-note-${habit.id}`}
                      rows={2}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="How did this habit go today? Any quick observations..."
                      autoFocus
                      className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="submit"
                        className="rounded-md bg-cta px-3 py-1.5 text-xs font-medium text-cta-fg hover:bg-cta-hover"
                      >
                        Save Note
                      </button>
                      {dailyNote && (
                        <button
                          type="button"
                          onClick={() => {
                            onSaveHabitNote(habit.id, '');
                            setEditingNoteHabitId(null);
                          }}
                          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-danger-text hover:bg-danger-bg"
                        >
                          Remove Note
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditingNoteHabitId(null)}
                        className="rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
