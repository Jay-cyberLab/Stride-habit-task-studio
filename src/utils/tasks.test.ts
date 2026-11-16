import test from 'node:test';
import assert from 'node:assert/strict';
import { Task } from '../types';
import {
  filterAndSortTasks,
  getTaskStats,
  getWeeklyTaskPerformanceData,
  validateTaskInput,
} from './tasks';

const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Low priority work',
    category: 'Work',
    priority: 'low',
    completed: false,
    createdAt: '2026-11-10',
  },
  {
    id: '2',
    title: 'High priority work',
    category: 'Work',
    priority: 'high',
    completed: false,
    dueDate: '2026-11-15',
    createdAt: '2026-11-11',
  },
  {
    id: '3',
    title: 'Completed high priority health',
    category: 'Health',
    priority: 'high',
    completed: true,
    createdAt: '2026-11-12',
  },
  {
    id: '4',
    title: 'Medium priority finance',
    category: 'Finance',
    priority: 'medium',
    completed: false,
    createdAt: '2026-11-13',
  },
];

test('filterAndSortTasks puts incomplete tasks first and orders by priority weight', () => {
  const result = filterAndSortTasks(sampleTasks, {
    category: 'All',
    priority: 'all',
    status: 'all',
    search: '',
  });

  assert.deepEqual(
    result.map((t) => t.id),
    ['2', '4', '1', '3']
  );
});

test('filterAndSortTasks filters accurately by category, priority, status, and search', () => {
  const workHigh = filterAndSortTasks(sampleTasks, {
    category: 'Work',
    priority: 'high',
    status: 'active',
    search: '',
  });
  assert.deepEqual(workHigh.map((t) => t.id), ['2']);

  const searchFinance = filterAndSortTasks(sampleTasks, {
    category: 'All',
    priority: 'all',
    status: 'all',
    search: 'portfolio',
  });
  assert.equal(searchFinance.length, 0);

  const searchFinanceMatch = filterAndSortTasks(sampleTasks, {
    category: 'All',
    priority: 'all',
    status: 'all',
    search: 'finance',
  });
  assert.deepEqual(searchFinanceMatch.map((t) => t.id), ['4']);
});

test('getTaskStats calculates counts accurately', () => {
  const stats = getTaskStats(sampleTasks);
  assert.equal(stats.total, 4);
  assert.equal(stats.active, 3);
  assert.equal(stats.completed, 1);
  assert.equal(stats.highPriorityActive, 1);
  assert.equal(stats.byCategory.Work, 2);
  assert.equal(stats.byCategory.Health, 1);
});

test('getWeeklyTaskPerformanceData aggregates added, completed, and due tasks across 7 days', () => {
  const weekly = getWeeklyTaskPerformanceData(sampleTasks, '2026-11-16', 7);
  assert.equal(weekly.length, 7);
  assert.equal(weekly[0].date, '2026-11-10');
  assert.equal(weekly[0].addedCount, 1);
  assert.equal(weekly[2].date, '2026-11-12');
  assert.equal(weekly[2].completedCount, 1);
  assert.equal(weekly[5].date, '2026-11-15');
  assert.equal(weekly[5].dueCount, 1);
});

test('validateTaskInput rejects empty titles', () => {
  assert.ok(validateTaskInput({ title: '' }));
  assert.ok(validateTaskInput({ title: '   ' }));
  assert.equal(validateTaskInput({ title: 'Submit report' }), null);
});
