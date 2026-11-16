export type HabitCategory = 'Health' | 'Focus' | 'Mindfulness' | 'Fitness' | 'Learning';

export interface HabitLogEntry {
  count: number;
  note?: string;
}

export interface Habit {
  id: string;
  title: string;
  category: HabitCategory;
  targetCount: number;
  unit: string;
  accentColor: string;
  logs: Record<string, HabitLogEntry>;
  createdAt: string;
}

export type TaskCategory = 'Work' | 'Personal' | 'Health' | 'Learning' | 'Finance';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatusFilter = 'all' | 'active' | 'completed';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}

export type DiaryMood = 'Calm' | 'Grateful' | 'Focused' | 'Reflective' | 'Stressed';

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: DiaryMood;
  createdAt: string;
  updatedAt: string;
}

export type AppThemeId = 'classic' | 'ocean' | 'nature' | 'royal';

export type ColorMode = 'light' | 'dark';

export type WorkspaceView = 'overview' | 'habits' | 'tasks' | 'streaks' | 'diary';
