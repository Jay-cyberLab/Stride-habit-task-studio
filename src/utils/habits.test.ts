import test from 'node:test';
import assert from 'node:assert/strict';
import { Habit, HabitLogEntry } from '../types';
import {
  calculateBestStreak,
  calculateCompletionRate,
  calculateCurrentStreak,
  filterHabits,
  getHabitDaySummary,
  getHabitNoteForDate,
  getHeatmapData,
  getWeeklyPerformanceData,
  incrementHabitLog,
  isHabitCompletedOnDate,
  normalizeLegacyHabit,
  setHabitCompletedOnDate,
  setHabitNoteForDate,
  validateHabitInput,
} from './habits';
import { getMonthCalendarGrid, shiftMonth } from './date';

function makeHabit(counts: Record<string, number>, targetCount = 8): Habit {
  const logs: Record<string, HabitLogEntry> = {};
  for (const [dateStr, count] of Object.entries(counts)) {
    logs[dateStr] = { count };
  }
  return {
    id: 'h1',
    title: 'Drink Water',
    category: 'Health',
    targetCount,
    unit: 'glasses',
    accentColor: '#0F766E',
    logs,
    createdAt: '2026-10-01',
  };
}

test('calculateCurrentStreak counts today when completed and preserves active streak from yesterday', () => {
  const today = '2026-11-15';
  const habitBeforeToday = makeHabit({
    '2026-11-14': 8,
    '2026-11-13': 8,
    '2026-11-12': 9,
    '2026-11-10': 8,
  });

  assert.equal(isHabitCompletedOnDate(habitBeforeToday, today), false);
  assert.equal(calculateCurrentStreak(habitBeforeToday, today), 3);

  const habitWithToday = incrementHabitLog(habitBeforeToday, today, 8);
  assert.equal(isHabitCompletedOnDate(habitWithToday, today), true);
  assert.equal(calculateCurrentStreak(habitWithToday, today), 4);
});

test('calculateCurrentStreak resets to 0 when neither today nor yesterday was completed', () => {
  const today = '2026-11-15';
  const habit = makeHabit({
    '2026-11-13': 8,
    '2026-11-12': 8,
  });

  assert.equal(calculateCurrentStreak(habit, today), 0);
});

test('calculateBestStreak computes longest consecutive run ignoring incomplete days', () => {
  const habit = makeHabit({
    '2026-11-01': 8,
    '2026-11-02': 8,
    '2026-11-03': 8,
    '2026-11-04': 5, // incomplete
    '2026-11-05': 8,
    '2026-11-06': 8,
    '2026-11-07': 8,
    '2026-11-08': 8,
  });

  assert.equal(calculateBestStreak(habit), 4);
});

test('incrementHabitLog and setHabitCompletedOnDate preserve daily reflection notes', () => {
  const today = '2026-11-15';
  const habit = makeHabit({}, 4);

  const withNote = setHabitNoteForDate(habit, today, 'Felt energized after breakfast.');
  assert.equal(getHabitNoteForDate(withNote, today), 'Felt energized after breakfast.');

  const incremented = incrementHabitLog(withNote, today, 2);
  assert.equal(incremented.logs[today]?.count, 2);
  assert.equal(getHabitNoteForDate(incremented, today), 'Felt energized after breakfast.');

  const completed = setHabitCompletedOnDate(incremented, today, true);
  assert.equal(completed.logs[today]?.count, 4);
  assert.equal(getHabitNoteForDate(completed, today), 'Felt energized after breakfast.');

  const clearedCountOnly = setHabitCompletedOnDate(completed, today, false);
  assert.equal(clearedCountOnly.logs[today]?.count, 0);
  assert.equal(getHabitNoteForDate(clearedCountOnly, today), 'Felt energized after breakfast.');

  const clearedNote = setHabitNoteForDate(clearedCountOnly, today, '   ');
  assert.equal(clearedNote.logs[today], undefined);
});

test('normalizeLegacyHabit converts numeric log values to HabitLogEntry objects', () => {
  const legacyRaw = {
    id: 'legacy-1',
    title: 'Walk',
    category: 'Fitness',
    targetCount: 1,
    unit: 'session',
    accentColor: '#15803D',
    logs: { '2026-11-14': 1, '2026-11-13': 0 },
    createdAt: '2026-11-01',
  } as unknown as Habit;

  const normalized = normalizeLegacyHabit(legacyRaw);
  assert.deepEqual(normalized.logs, { '2026-11-14': { count: 1 } });
});

test('calculateCompletionRate and getHeatmapData return accurate ratios', () => {
  const today = '2026-11-15';
  const h1 = makeHabit({ '2026-11-15': 8, '2026-11-14': 8, '2026-11-12': 8 }, 8);
  const h2 = makeHabit({ '2026-11-15': 1 }, 1);

  assert.equal(calculateCompletionRate(h1, today, 4), 75);

  const heatmap = getHeatmapData([h1, h2], today, 3);
  assert.equal(heatmap.length, 3);
  assert.deepEqual(heatmap[2], {
    date: '2026-11-15',
    completedCount: 2,
    totalHabits: 2,
    ratio: 1,
  });
  assert.deepEqual(heatmap[1], {
    date: '2026-11-14',
    completedCount: 1,
    totalHabits: 2,
    ratio: 0.5,
  });
});

test('validateHabitInput rejects blank title or invalid target', () => {
  assert.ok(validateHabitInput({ title: '   ', targetCount: 1, unit: 'times' }));
  assert.ok(validateHabitInput({ title: 'Read', targetCount: 0, unit: 'pages' }));
  assert.ok(validateHabitInput({ title: 'Read', targetCount: 10, unit: '' }));
  assert.equal(validateHabitInput({ title: 'Read', targetCount: 10, unit: 'pages' }), null);
});

test('getMonthCalendarGrid generates full week rows and marks inCurrentMonth accurately', () => {
  // November 2026 starts on Sunday Nov 1 and has 30 days -> 35 cells
  const novGrid = getMonthCalendarGrid(2026, 10);
  assert.equal(novGrid.length, 35);
  assert.equal(novGrid[0].date, '2026-11-01');
  assert.equal(novGrid[0].inCurrentMonth, true);
  assert.equal(novGrid[29].date, '2026-11-30');
  assert.equal(novGrid[29].inCurrentMonth, true);
  assert.equal(novGrid[30].date, '2026-12-01');
  assert.equal(novGrid[30].inCurrentMonth, false);

  const prev = shiftMonth(2026, 0, -1);
  assert.deepEqual(prev, { year: 2025, monthIndex: 11 });
});

test('getHabitDaySummary returns completion logs and reflection notes for any past date', () => {
  const h1 = setHabitNoteForDate(
    incrementHabitLog(makeHabit({}, 8), '2026-11-10', 8),
    '2026-11-10',
    'Consistent hydration all day.'
  );
  const h2 = incrementHabitLog(makeHabit({}, 1), '2026-11-10', 0);

  const summary = getHabitDaySummary([h1, h2], '2026-11-10');
  assert.equal(summary.completedCount, 1);
  assert.equal(summary.totalHabits, 2);
  assert.equal(summary.entries[0].completed, true);
  assert.equal(summary.entries[0].note, 'Consistent hydration all day.');
  assert.equal(summary.entries[1].completed, false);
  assert.equal(summary.entries[1].note, '');
});

test('filterHabits filters habits by title or category case-insensitively', () => {
  const hydration = makeHabit({}, 8); // Drink Water, Health
  const deepWork: Habit = {
    ...makeHabit({}, 90),
    id: 'h2',
    title: 'Deep Focus Session',
    category: 'Focus',
  };

  assert.equal(filterHabits([hydration, deepWork], '').length, 2);
  assert.deepEqual(
    filterHabits([hydration, deepWork], 'water').map((h) => h.id),
    ['h1']
  );
  assert.deepEqual(
    filterHabits([hydration, deepWork], 'FOCUS').map((h) => h.id),
    ['h2']
  );
  assert.equal(filterHabits([hydration, deepWork], 'nonexistent').length, 0);
});

test('getWeeklyPerformanceData generates 7-day completion trends and note counts', () => {
  const today = '2026-11-16';
  const h1 = setHabitNoteForDate(
    makeHabit({ '2026-11-16': 8, '2026-11-15': 8 }, 8),
    '2026-11-16',
    'Great hydration'
  );
  const h2: Habit = {
    ...makeHabit({ '2026-11-16': 1, '2026-11-14': 1 }, 1),
    id: 'h2',
    title: 'Walk',
  };

  const weekly = getWeeklyPerformanceData([h1, h2], today, 7);
  assert.equal(weekly.length, 7);
  assert.equal(weekly[0].date, '2026-11-10');
  assert.equal(weekly[6].date, '2026-11-16');
  assert.equal(weekly[6].completedCount, 2);
  assert.equal(weekly[6].totalHabits, 2);
  assert.equal(weekly[6].completionRate, 100);
  assert.equal(weekly[6].notesCount, 1);

  assert.equal(weekly[5].date, '2026-11-15');
  assert.equal(weekly[5].completedCount, 1);
  assert.equal(weekly[5].completionRate, 50);

  const emptyWeekly = getWeeklyPerformanceData([], today, 7);
  assert.equal(emptyWeekly.length, 7);
  assert.equal(emptyWeekly[6].completionRate, 0);
});
