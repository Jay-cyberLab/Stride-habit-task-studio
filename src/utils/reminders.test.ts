import test from 'node:test';
import assert from 'node:assert/strict';
import { Task } from '../types';
import {
  classifyTaskDueStatus,
  formatReminderRelativeDay,
  getTaskReminders,
} from './reminders';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Sample Task',
    category: 'Work',
    priority: 'medium',
    completed: false,
    createdAt: '2026-11-10',
    ...overrides,
  };
}

test('classifyTaskDueStatus detects overdue, due_today, upcoming, and ignores completed or distant tasks', () => {
  const today = '2026-11-16';

  assert.deepEqual(classifyTaskDueStatus(makeTask({ dueDate: '2026-11-14' }), today), {
    status: 'overdue',
    daysDelta: -2,
  });
  assert.deepEqual(classifyTaskDueStatus(makeTask({ dueDate: '2026-11-16' }), today), {
    status: 'due_today',
    daysDelta: 0,
  });
  assert.deepEqual(classifyTaskDueStatus(makeTask({ dueDate: '2026-11-18' }), today), {
    status: 'upcoming',
    daysDelta: 2,
  });
  assert.equal(classifyTaskDueStatus(makeTask({ dueDate: '2026-11-25' }), today), null);
  assert.equal(
    classifyTaskDueStatus(makeTask({ dueDate: '2026-11-14', completed: true }), today),
    null
  );
  assert.equal(classifyTaskDueStatus(makeTask({ dueDate: undefined }), today), null);
});

test('getTaskReminders groups and orders urgent tasks by urgency and priority', () => {
  const today = '2026-11-16';
  const tasks: Task[] = [
    makeTask({ id: 't-up', title: 'Upcoming low', dueDate: '2026-11-17', priority: 'low' }),
    makeTask({ id: 't-today-low', title: 'Today low', dueDate: '2026-11-16', priority: 'low' }),
    makeTask({ id: 't-today-high', title: 'Today high', dueDate: '2026-11-16', priority: 'high' }),
    makeTask({ id: 't-over', title: 'Overdue', dueDate: '2026-11-15', priority: 'medium' }),
    makeTask({ id: 't-done', title: 'Done overdue', dueDate: '2026-11-10', completed: true }),
    makeTask({ id: 't-far', title: 'Far', dueDate: '2026-11-30' }),
  ];

  const summary = getTaskReminders(tasks, today);
  assert.equal(summary.totalUrgent, 4);
  assert.deepEqual(summary.overdue.map((r) => r.task.id), ['t-over']);
  assert.deepEqual(summary.dueToday.map((r) => r.task.id), ['t-today-high', 't-today-low']);
  assert.deepEqual(summary.upcoming.map((r) => r.task.id), ['t-up']);
  assert.deepEqual(summary.all.map((r) => r.task.id), [
    't-over',
    't-today-high',
    't-today-low',
    't-up',
  ]);
});

test('formatReminderRelativeDay produces clear human-readable labels', () => {
  assert.equal(formatReminderRelativeDay(-1), '1 day overdue');
  assert.equal(formatReminderRelativeDay(-3), '3 days overdue');
  assert.equal(formatReminderRelativeDay(0), 'Due today');
  assert.equal(formatReminderRelativeDay(1), 'Due tomorrow');
  assert.equal(formatReminderRelativeDay(2), 'Due in 2 days');
});
