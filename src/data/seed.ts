import { AppThemeId, DiaryEntry, Habit, HabitLogEntry, Task } from '../types';
import { addDaysISO, getTodayISO } from '../utils/date';

export interface ThemePalette {
  id: AppThemeId;
  name: string;
  description: string;
  swatches: [string, string, string];
}

export const APP_THEMES: ThemePalette[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Black, White & Yellow',
    swatches: ['#111111', '#FFFFFF', '#FACC15'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'White, Navy & Sky Blue',
    swatches: ['#FFFFFF', '#0F2942', '#38BDF8'],
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Cream, Forest Green & Lime',
    swatches: ['#FAF7F0', '#143D2B', '#84CC16'],
  },
  {
    id: 'royal',
    name: 'Royal',
    description: 'White, Deep Purple & Gold',
    swatches: ['#FFFFFF', '#3B1D6E', '#F59E0B'],
  },
];

export function createSeedHabits(today: string = getTodayISO()): Habit[] {
  const buildLogs = (
    daysAgoList: number[],
    count: number,
    notesByDaysAgo: Record<number, string> = {}
  ): Record<string, HabitLogEntry> => {
    const logs: Record<string, HabitLogEntry> = {};
    for (const daysAgo of daysAgoList) {
      const note = notesByDaysAgo[daysAgo];
      logs[addDaysISO(today, -daysAgo)] = note ? { count, note } : { count };
    }
    return logs;
  };

  return [
    {
      id: 'habit-focus-deep',
      title: 'Deep Focus Block',
      category: 'Focus',
      targetCount: 90,
      unit: 'min',
      accentColor: '#0F766E',
      logs: {
        ...buildLogs([1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 18, 20, 21], 90, {
          1: 'Completed architecture review without phone distractions.',
          3: 'Protected 90 minutes before checking Slack.',
        }),
        [today]: {
          count: 90,
          note: 'Zero context switches during morning sprint.',
        },
      },
      createdAt: addDaysISO(today, -30),
    },
    {
      id: 'habit-hydration',
      title: 'Daily Hydration',
      category: 'Health',
      targetCount: 8,
      unit: 'glasses',
      accentColor: '#0284C7',
      logs: {
        ...buildLogs([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 19], 8, {
          2: 'Kept a water carafe on desk all afternoon.',
        }),
        [today]: { count: 6 },
      },
      createdAt: addDaysISO(today, -30),
    },
    {
      id: 'habit-reading',
      title: 'Technical Reading',
      category: 'Learning',
      targetCount: 25,
      unit: 'pages',
      accentColor: '#4338CA',
      logs: {
        ...buildLogs([1, 2, 3, 4, 6, 7, 8, 11, 12, 15, 16, 19, 22], 25, {
          1: 'Highlighted consensus protocols notes.',
        }),
        [today]: { count: 10 },
      },
      createdAt: addDaysISO(today, -28),
    },
    {
      id: 'habit-movement',
      title: 'Outdoor Walk',
      category: 'Fitness',
      targetCount: 1,
      unit: 'session',
      accentColor: '#15803D',
      logs: {
        ...buildLogs([1, 2, 3, 5, 6, 8, 9, 10, 12, 14, 15, 17, 18, 20], 1, {
          1: 'Evening loop around the park after sunset.',
        }),
      },
      createdAt: addDaysISO(today, -25),
    },
  ];
}

export function createSeedTasks(today: string = getTodayISO()): Task[] {
  return [
    {
      id: 'task-1',
      title: 'Finalize Q4 product roadmap milestones',
      category: 'Work',
      priority: 'high',
      completed: false,
      dueDate: today,
      createdAt: addDaysISO(today, -2),
    },
    {
      id: 'task-2',
      title: 'Review monthly portfolio allocation & savings transfer',
      category: 'Finance',
      priority: 'high',
      completed: false,
      dueDate: addDaysISO(today, 1),
      createdAt: addDaysISO(today, -1),
    },
    {
      id: 'task-3',
      title: 'Prepare sprint retrospective notes',
      category: 'Work',
      priority: 'medium',
      completed: false,
      dueDate: addDaysISO(today, 2),
      createdAt: addDaysISO(today, -1),
    },
    {
      id: 'task-4',
      title: 'Schedule annual dental checkup',
      category: 'Health',
      priority: 'medium',
      completed: false,
      createdAt: addDaysISO(today, -3),
    },
    {
      id: 'task-5',
      title: 'Read Chapter 4 of Designing Data-Intensive Apps',
      category: 'Learning',
      priority: 'low',
      completed: false,
      createdAt: addDaysISO(today, -4),
    },
    {
      id: 'task-6',
      title: 'Order fresh espresso beans for the week',
      category: 'Personal',
      priority: 'low',
      completed: true,
      createdAt: addDaysISO(today, -2),
    },
  ];
}

export function createSeedDiaryEntries(today: string = getTodayISO()): DiaryEntry[] {
  return [
    {
      id: 'diary-seed-1',
      date: addDaysISO(today, -1),
      title: 'Quiet Sunday Reset',
      content:
        'Took a long walk without headphones and mapped out priorities for the week ahead. Keeping mornings free of meetings continues to make the biggest difference in focus.',
      mood: 'Calm',
      createdAt: addDaysISO(today, -1),
      updatedAt: addDaysISO(today, -1),
    },
  ];
}
