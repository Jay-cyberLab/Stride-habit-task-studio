import { AppThemeId, ColorMode, DiaryEntry, Habit, Task } from '../types';
import { createSeedDiaryEntries, createSeedHabits, createSeedTasks } from '../data/seed';
import { normalizeLegacyHabit } from './habits';

const HABITS_STORAGE_KEY = 'cadence_habits_v1';
const TASKS_STORAGE_KEY = 'cadence_tasks_v1';
const DIARY_ENTRIES_STORAGE_KEY = 'cadence_diary_entries_v1';
const DIARY_AUTH_STORAGE_KEY = 'cadence_diary_auth_v1';
const THEME_STORAGE_KEY = 'cadence_theme_v1';
const COLOR_MODE_STORAGE_KEY = 'cadence_color_mode_v1';

export interface DiaryAuthRecord {
  salt: string;
  passwordHash: string;
  updatedAt: string;
}

export function loadHabits(): Habit[] {
  try {
    const raw = window.localStorage.getItem(HABITS_STORAGE_KEY);
    if (!raw) return createSeedHabits();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return createSeedHabits();
    return parsed.map((item) => normalizeLegacyHabit(item as Habit));
  } catch {
    return createSeedHabits();
  }
}

export function saveHabits(habits: Habit[]): void {
  try {
    window.localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadTasks(): Task[] {
  try {
    const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return createSeedTasks();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return createSeedTasks();
    return parsed;
  } catch {
    return createSeedTasks();
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadDiaryEntries(): DiaryEntry[] {
  try {
    const raw = window.localStorage.getItem(DIARY_ENTRIES_STORAGE_KEY);
    if (!raw) return createSeedDiaryEntries();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return createSeedDiaryEntries();
    return parsed;
  } catch {
    return createSeedDiaryEntries();
  }
}

export function saveDiaryEntries(entries: DiaryEntry[]): void {
  try {
    window.localStorage.setItem(DIARY_ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadDiaryAuth(): DiaryAuthRecord | null {
  try {
    const raw = window.localStorage.getItem(DIARY_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.passwordHash === 'string' && typeof parsed.salt === 'string') {
      return parsed as DiaryAuthRecord;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveDiaryAuth(record: DiaryAuthRecord): void {
  try {
    window.localStorage.setItem(DIARY_AUTH_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function clearDiaryStorage(): void {
  try {
    window.localStorage.removeItem(DIARY_AUTH_STORAGE_KEY);
    window.localStorage.removeItem(DIARY_ENTRIES_STORAGE_KEY);
  } catch {
    // Ignore storage errors gracefully
  }
}

export function loadTheme(): AppThemeId {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'classic' || raw === 'ocean' || raw === 'nature' || raw === 'royal') {
      return raw;
    }
    return 'classic';
  } catch {
    return 'classic';
  }
}

export function saveTheme(theme: AppThemeId): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors gracefully
  }
}

export function loadColorMode(): ColorMode {
  try {
    const raw = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    if (raw === 'light' || raw === 'dark') {
      return raw;
    }
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  } catch {
    return 'light';
  }
}

export function saveColorMode(mode: ColorMode): void {
  try {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage errors gracefully
  }
}

