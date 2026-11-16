import test from 'node:test';
import assert from 'node:assert/strict';
import { Habit, Task } from '../types';
import { buildBackupJson, buildLogsCsv, escapeCsvCell } from './export';

const sampleHabits: Habit[] = [
  {
    id: 'h-1',
    title: 'Deep Focus, Morning',
    category: 'Focus',
    targetCount: 90,
    unit: 'min',
    accentColor: '#0F766E',
    logs: {
      '2026-11-15': { count: 90, note: 'Zero distractions, "great" flow!' },
    },
    createdAt: '2026-11-01',
  },
  {
    id: 'h-2',
    title: 'Evening Stretch',
    category: 'Fitness',
    targetCount: 1,
    unit: 'session',
    accentColor: '#15803D',
    logs: {},
    createdAt: '2026-11-10',
  },
];

const sampleTasks: Task[] = [
  {
    id: 't-1',
    title: 'Submit Q4 budget',
    category: 'Work',
    priority: 'high',
    completed: false,
    dueDate: '2026-11-18',
    createdAt: '2026-11-15T10:00:00Z',
  },
];

test('buildBackupJson serializes Stride habits and tasks cleanly', () => {
  const json = buildBackupJson(sampleHabits, sampleTasks, '2026-11-15T21:00:00Z');
  const parsed = JSON.parse(json);

  assert.equal(parsed.app, 'Stride');
  assert.equal(parsed.exportedAt, '2026-11-15T21:00:00Z');
  assert.equal(parsed.habits.length, 2);
  assert.equal(parsed.tasks.length, 1);
  assert.equal(parsed.habits[0].logs['2026-11-15'].note, 'Zero distractions, "great" flow!');
});

test('escapeCsvCell quotes commas, double quotes, and newlines safely', () => {
  assert.equal(escapeCsvCell('plain'), 'plain');
  assert.equal(escapeCsvCell('a, b'), '"a, b"');
  assert.equal(escapeCsvCell('say "hi"'), '"say ""hi"""');
});

test('buildLogsCsv exports habit logs, unlogged habits, and tasks with escaped cells', () => {
  const csv = buildLogsCsv(sampleHabits, sampleTasks);
  const lines = csv.split('\n');

  assert.equal(lines.length, 4); // header + 2 habit rows + 1 task row
  assert.ok(lines[0].startsWith('record_type,id,title,category,date'));
  assert.ok(lines[1].includes('habit_log,h-1,"Deep Focus, Morning",Focus,2026-11-15,90,90,min,true'));
  assert.ok(lines[1].includes('"Zero distractions, ""great"" flow!"'));
  assert.ok(lines[2].includes('habit_goal,h-2,Evening Stretch,Fitness,2026-11-10,0,1,session,false'));
  assert.ok(lines[3].includes('task,t-1,Submit Q4 budget,Work,2026-11-15,0,1,task,false,high,2026-11-18'));
});
