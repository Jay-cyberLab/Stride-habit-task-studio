import { Task, TaskPriority } from '../types';
import { parseDateISO } from './date';

export type TaskDueStatus = 'overdue' | 'due_today' | 'upcoming';

export interface TaskReminderItem {
  task: Task;
  status: TaskDueStatus;
  daysDelta: number;
}

export interface TaskReminderSummary {
  overdue: TaskReminderItem[];
  dueToday: TaskReminderItem[];
  upcoming: TaskReminderItem[];
  all: TaskReminderItem[];
  totalUrgent: number;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function diffCalendarDays(targetDateStr: string, referenceDateStr: string): number {
  const target = parseDateISO(targetDateStr);
  const reference = parseDateISO(referenceDateStr);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - reference.getTime()) / msPerDay);
}

export function classifyTaskDueStatus(
  task: Task,
  todayStr: string,
  upcomingWindowDays: number = 2
): { status: TaskDueStatus; daysDelta: number } | null {
  if (task.completed || !task.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) {
    return null;
  }

  const daysDelta = diffCalendarDays(task.dueDate, todayStr);
  if (daysDelta < 0) {
    return { status: 'overdue', daysDelta };
  }
  if (daysDelta === 0) {
    return { status: 'due_today', daysDelta: 0 };
  }
  if (daysDelta > 0 && daysDelta <= upcomingWindowDays) {
    return { status: 'upcoming', daysDelta };
  }
  return null;
}

export function getTaskReminders(
  tasks: Task[],
  todayStr: string,
  upcomingWindowDays: number = 2
): TaskReminderSummary {
  const overdue: TaskReminderItem[] = [];
  const dueToday: TaskReminderItem[] = [];
  const upcoming: TaskReminderItem[] = [];

  for (const task of tasks) {
    const classified = classifyTaskDueStatus(task, todayStr, upcomingWindowDays);
    if (!classified) continue;

    const item: TaskReminderItem = {
      task,
      status: classified.status,
      daysDelta: classified.daysDelta,
    };

    if (classified.status === 'overdue') overdue.push(item);
    else if (classified.status === 'due_today') dueToday.push(item);
    else upcoming.push(item);
  }

  const sortItems = (a: TaskReminderItem, b: TaskReminderItem) => {
    if (a.daysDelta !== b.daysDelta) return a.daysDelta - b.daysDelta;
    return PRIORITY_WEIGHT[b.task.priority] - PRIORITY_WEIGHT[a.task.priority];
  };

  overdue.sort(sortItems);
  dueToday.sort(sortItems);
  upcoming.sort(sortItems);

  const all = [...overdue, ...dueToday, ...upcoming];
  return {
    overdue,
    dueToday,
    upcoming,
    all,
    totalUrgent: all.length,
  };
}

export function formatReminderRelativeDay(daysDelta: number): string {
  if (daysDelta === -1) return '1 day overdue';
  if (daysDelta < -1) return `${Math.abs(daysDelta)} days overdue`;
  if (daysDelta === 0) return 'Due today';
  if (daysDelta === 1) return 'Due tomorrow';
  return `Due in ${daysDelta} days`;
}
