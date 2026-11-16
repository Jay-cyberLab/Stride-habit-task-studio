import { Habit, Task } from '../types';
import { isHabitCompletedOnDate } from './habits';

export interface StrideBackupPayload {
  app: string;
  exportedAt: string;
  habits: Habit[];
  tasks: Task[];
}

export function buildBackupJson(
  habits: Habit[],
  tasks: Task[],
  exportedAt: string = new Date().toISOString()
): string {
  const payload: StrideBackupPayload = {
    app: 'Stride',
    exportedAt,
    habits,
    tasks,
  };
  return JSON.stringify(payload, null, 2);
}

export function escapeCsvCell(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildLogsCsv(habits: Habit[], tasks: Task[]): string {
  const headers = [
    'record_type',
    'id',
    'title',
    'category',
    'date',
    'count',
    'target',
    'unit',
    'completed',
    'priority',
    'due_date',
    'note',
  ];

  const rows: string[] = [headers.join(',')];

  for (const habit of habits) {
    const logDates = Object.keys(habit.logs).sort();
    if (logDates.length === 0) {
      rows.push(
        [
          'habit_goal',
          habit.id,
          habit.title,
          habit.category,
          habit.createdAt,
          0,
          habit.targetCount,
          habit.unit,
          false,
          '',
          '',
          '',
        ]
          .map(escapeCsvCell)
          .join(',')
      );
    } else {
      for (const dateStr of logDates) {
        const entry = habit.logs[dateStr];
        rows.push(
          [
            'habit_log',
            habit.id,
            habit.title,
            habit.category,
            dateStr,
            entry?.count ?? 0,
            habit.targetCount,
            habit.unit,
            isHabitCompletedOnDate(habit, dateStr),
            '',
            '',
            entry?.note ?? '',
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      }
    }
  }

  for (const task of tasks) {
    rows.push(
      [
        'task',
        task.id,
        task.title,
        task.category,
        task.createdAt.slice(0, 10),
        task.completed ? 1 : 0,
        1,
        'task',
        task.completed,
        task.priority,
        task.dueDate ?? '',
        '',
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return rows.join('\n');
}

export function triggerFileDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
