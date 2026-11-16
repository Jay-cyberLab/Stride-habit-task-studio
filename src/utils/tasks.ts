import { Task, TaskCategory, TaskPriority, TaskStatusFilter } from '../types';
import { formatShortDayLabel, getRecentDays } from './date';

export interface TaskFilterOptions {
  category: TaskCategory | 'All';
  priority: TaskPriority | 'all';
  status: TaskStatusFilter;
  search: string;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function filterAndSortTasks(tasks: Task[], filters: TaskFilterOptions): Task[] {
  const query = filters.search.trim().toLowerCase();

  return tasks
    .filter((task) => {
      if (filters.category !== 'All' && task.category !== filters.category) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.status === 'active' && task.completed) return false;
      if (filters.status === 'completed' && !task.completed) return false;
      if (query && !task.title.toLowerCase().includes(query) && !task.category.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const priorityDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      return b.createdAt.localeCompare(a.createdAt);
    });
}

export interface TaskStats {
  total: number;
  active: number;
  completed: number;
  highPriorityActive: number;
  byCategory: Record<TaskCategory, number>;
}

export function getTaskStats(tasks: Task[]): TaskStats {
  const byCategory: Record<TaskCategory, number> = {
    Work: 0,
    Personal: 0,
    Health: 0,
    Learning: 0,
    Finance: 0,
  };

  let active = 0;
  let completed = 0;
  let highPriorityActive = 0;

  for (const task of tasks) {
    byCategory[task.category] = (byCategory[task.category] ?? 0) + 1;
    if (task.completed) {
      completed += 1;
    } else {
      active += 1;
      if (task.priority === 'high') {
        highPriorityActive += 1;
      }
    }
  }

  return {
    total: tasks.length,
    active,
    completed,
    highPriorityActive,
    byCategory,
  };
}

export interface WeeklyTaskPoint {
  date: string;
  dayLabel: string;
  shortDay: string;
  addedCount: number;
  completedCount: number;
  dueCount: number;
}

export function getWeeklyTaskPerformanceData(
  tasks: Task[],
  todayStr: string,
  daysCount: number = 7
): WeeklyTaskPoint[] {
  const days = getRecentDays(todayStr, daysCount);

  return days.map((date) => {
    const { weekday, dayNum } = formatShortDayLabel(date);
    let addedCount = 0;
    let completedCount = 0;
    let dueCount = 0;

    for (const task of tasks) {
      const createdDate = task.createdAt.slice(0, 10);
      if (createdDate === date) {
        addedCount += 1;
      }
      if (task.dueDate === date) {
        dueCount += 1;
      }
      if (task.completed && (task.dueDate || createdDate) === date) {
        completedCount += 1;
      }
    }

    return {
      date,
      dayLabel: `${weekday} ${dayNum}`,
      shortDay: weekday,
      addedCount,
      completedCount,
      dueCount,
    };
  });
}

export function validateTaskInput(input: { title: string }): string | null {
  const trimmed = input.title.trim();
  if (!trimmed) {
    return 'Please enter a task title.';
  }
  if (trimmed.length > 120) {
    return 'Task title must be 120 characters or fewer.';
  }
  return null;
}
