/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { AuthScreen } from './components/AuthScreen';
import { DiaryPanel } from './components/DiaryPanel';
import { HabitModal } from './components/HabitModal';
import { HabitsPanel } from './components/HabitsPanel';
import { MobileNav } from './components/MobileNav';
import { StreakHeatmap } from './components/StreakHeatmap';
import { StrideLogoMark } from './components/StrideLogoMark';
import { TaskReminderBanner } from './components/TaskReminderBanner';
import { TasksPanel } from './components/TasksPanel';
import { TopBar } from './components/TopBar';
import { ViewSummary } from './components/ViewSummary';
import { auth } from './firebase';
import {
  AppThemeId,
  ColorMode,
  DiaryEntry,
  DiaryMood,
  Habit,
  HabitCategory,
  Task,
  TaskCategory,
  TaskPriority,
  WorkspaceView,
} from './types';
import {
  clearCompletedTasksCloud,
  clearDiaryCloud,
  createHabitCloud,
  createTaskCloud,
  deleteDiaryEntryCloud,
  deleteHabitCloud,
  deleteTaskCloud,
  ensureUserProfile,
  saveCloudTheme,
  saveDiaryAuthCloud,
  saveDiaryEntryCloud,
  subscribeUserWorkspace,
  updateHabitDetailsCloud,
  updateHabitLogsCloud,
  updateTaskCompletedCloud,
  updateTaskPriorityCloud,
} from './utils/cloudSync';
import { getTodayISO } from './utils/date';
import { buildBackupJson, buildLogsCsv, triggerFileDownload } from './utils/export';
import {
  incrementHabitLog,
  isHabitCompletedOnDate,
  setHabitCompletedOnDate,
  setHabitNoteForDate,
} from './utils/habits';
import {
  clearDiaryStorage,
  DiaryAuthRecord,
  loadColorMode,
  loadDiaryAuth,
  loadDiaryEntries,
  loadHabits,
  loadTasks,
  loadTheme,
  saveColorMode,
  saveDiaryAuth,
  saveDiaryEntries,
  saveHabits,
  saveTasks,
  saveTheme,
} from './utils/storage';
import { getTaskStats } from './utils/tasks';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function hasAutostartParam(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('autostart') === '1';
}

export default function App() {
  const [todayStr] = useState<string>(() => getTodayISO());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeView, setActiveView] = useState<WorkspaceView>('overview');
  const [activeTheme, setActiveTheme] = useState<AppThemeId>(() => loadTheme());
  const [colorMode, setColorMode] = useState<ColorMode>(() => loadColorMode());

  const [authReady, setAuthReady] = useState<boolean>(() => hasAutostartParam());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocalDemo, setIsLocalDemo] = useState<boolean>(() => hasAutostartParam());
  const [profileDisplayName, setProfileDisplayName] = useState<string>('Stride Member');

  const [habits, setHabits] = useState<Habit[]>(() => (hasAutostartParam() ? loadHabits() : []));
  const [tasks, setTasks] = useState<Task[]>(() => (hasAutostartParam() ? loadTasks() : []));
  const [diaryAuth, setDiaryAuth] = useState<DiaryAuthRecord | null>(() =>
    hasAutostartParam() ? loadDiaryAuth() : null
  );
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(() =>
    hasAutostartParam() ? loadDiaryEntries() : []
  );
  const [isDiaryUnlocked, setIsDiaryUnlocked] = useState(false);

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const themeInitializedForCloud = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    saveTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', colorMode === 'dark');
    document.documentElement.setAttribute('data-color-mode', colorMode);
    saveColorMode(colorMode);
  }, [colorMode]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    let unsubWorkspace: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubWorkspace) {
        unsubWorkspace();
        unsubWorkspace = null;
      }

      setCurrentUser(user);
      setIsDiaryUnlocked(false);

      if (user) {
        setIsLocalDemo(false);
        themeInitializedForCloud.current = false;
        try {
          const profile = await ensureUserProfile(user, loadTheme());
          setProfileDisplayName(profile.displayName);
          setActiveTheme(profile.theme);
          themeInitializedForCloud.current = true;
        } catch (err) {
          console.error('Failed to load user profile:', err);
          setProfileDisplayName(user.displayName || user.email?.split('@')[0] || 'Stride Member');
        }

        unsubWorkspace = subscribeUserWorkspace(user.uid, {
          onHabits: (nextHabits) => setHabits(nextHabits),
          onTasks: (nextTasks) => setTasks(nextTasks),
          onDiaryEntries: (nextEntries) => setDiaryEntries(nextEntries),
          onDiaryAuth: (nextAuth) => setDiaryAuth(nextAuth),
        });
      } else if (isLocalDemo) {
        setHabits(loadHabits());
        setTasks(loadTasks());
        setDiaryAuth(loadDiaryAuth());
        setDiaryEntries(loadDiaryEntries());
      } else {
        setHabits([]);
        setTasks([]);
        setDiaryAuth(null);
        setDiaryEntries([]);
      }

      setAuthReady(true);
    });

    return () => {
      unsubAuth();
      if (unsubWorkspace) unsubWorkspace();
    };
  }, [isLocalDemo]);

  // Persist local demo state only when in local preview mode
  useEffect(() => {
    if (isLocalDemo && !currentUser) {
      saveHabits(habits);
    }
  }, [habits, isLocalDemo, currentUser]);

  useEffect(() => {
    if (isLocalDemo && !currentUser) {
      saveTasks(tasks);
    }
  }, [tasks, isLocalDemo, currentUser]);

  useEffect(() => {
    if (isLocalDemo && !currentUser) {
      saveDiaryEntries(diaryEntries);
    }
  }, [diaryEntries, isLocalDemo, currentUser]);

  const handleSelectTheme = (nextTheme: AppThemeId) => {
    setActiveTheme(nextTheme);
    if (currentUser && themeInitializedForCloud.current) {
      void saveCloudTheme(currentUser.uid, profileDisplayName, currentUser.email, nextTheme);
    }
  };

  const handleToggleColorMode = () => {
    setColorMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleContinueDemo = () => {
    setHabits(loadHabits());
    setTasks(loadTasks());
    setDiaryAuth(loadDiaryAuth());
    setDiaryEntries(loadDiaryEntries());
    setIsLocalDemo(true);
    setAuthReady(true);
  };

  const handleSignOut = async () => {
    setIsDiaryUnlocked(false);
    setIsLocalDemo(false);
    setSearchQuery('');
    await signOut(auth);
  };

  const handleOpenAuth = () => {
    setIsLocalDemo(false);
  };

  const handleOpenNewHabit = () => {
    setEditingHabit(null);
    setIsHabitModalOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsHabitModalOpen(true);
  };

  const handleSaveHabit = (data: {
    title: string;
    category: HabitCategory;
    targetCount: number;
    unit: string;
    accentColor: string;
  }) => {
    if (editingHabit) {
      const updatedHabit: Habit = {
        ...editingHabit,
        title: data.title,
        category: data.category,
        targetCount: data.targetCount,
        unit: data.unit,
        accentColor: data.accentColor,
      };
      setHabits((prev) => prev.map((h) => (h.id === editingHabit.id ? updatedHabit : h)));
      if (currentUser) {
        void updateHabitDetailsCloud(currentUser.uid, updatedHabit);
      }
    } else {
      const newHabit: Habit = {
        id: createId('habit'),
        title: data.title,
        category: data.category,
        targetCount: data.targetCount,
        unit: data.unit,
        accentColor: data.accentColor,
        logs: {},
        createdAt: todayStr,
      };
      setHabits((prev) => [newHabit, ...prev]);
      if (currentUser) {
        void createHabitCloud(currentUser.uid, newHabit);
      }
    }
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    if (currentUser) {
      void deleteHabitCloud(currentUser.uid, habitId);
    }
  };

  const handleIncrementHabit = (habitId: string, delta: number) => {
    const existing = habits.find((h) => h.id === habitId);
    if (!existing) return;
    const updated = incrementHabitLog(existing, selectedDate, delta);
    setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));
    if (currentUser) {
      void updateHabitLogsCloud(currentUser.uid, updated);
    }
  };

  const handleToggleHabitComplete = (habitId: string) => {
    const existing = habits.find((h) => h.id === habitId);
    if (!existing) return;
    const currentlyCompleted = isHabitCompletedOnDate(existing, selectedDate);
    const updated = setHabitCompletedOnDate(existing, selectedDate, !currentlyCompleted);
    setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));
    if (currentUser) {
      void updateHabitLogsCloud(currentUser.uid, updated);
    }
  };

  const handleSaveHabitNote = (habitId: string, note: string) => {
    const existing = habits.find((h) => h.id === habitId);
    if (!existing) return;
    const updated = setHabitNoteForDate(existing, selectedDate, note);
    setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));
    if (currentUser) {
      void updateHabitLogsCloud(currentUser.uid, updated);
    }
  };

  const handleAddTask = (input: {
    title: string;
    category: TaskCategory;
    priority: TaskPriority;
    dueDate?: string;
  }) => {
    const newTask: Task = {
      id: createId('task'),
      title: input.title,
      category: input.category,
      priority: input.priority,
      completed: false,
      dueDate: input.dueDate,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    if (currentUser) {
      void createTaskCloud(currentUser.uid, newTask);
    }
  };

  const handleToggleTask = (taskId: string) => {
    const existing = tasks.find((t) => t.id === taskId);
    if (!existing) return;
    const nextCompleted = !existing.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: nextCompleted } : t))
    );
    if (currentUser) {
      void updateTaskCompletedCloud(currentUser.uid, taskId, nextCompleted);
    }
  };

  const handleUpdateTaskPriority = (taskId: string, priority: TaskPriority) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, priority } : t)));
    if (currentUser) {
      void updateTaskPriorityCloud(currentUser.uid, taskId, priority);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (currentUser) {
      void deleteTaskCloud(currentUser.uid, taskId);
    }
  };

  const handleClearCompletedTasks = () => {
    const completedIds = tasks.filter((t) => t.completed).map((t) => t.id);
    setTasks((prev) => prev.filter((t) => !t.completed));
    if (currentUser && completedIds.length > 0) {
      void clearCompletedTasksCloud(currentUser.uid, completedIds);
    }
  };

  const handleSaveDiaryAuth = (record: DiaryAuthRecord) => {
    if (currentUser) {
      void saveDiaryAuthCloud(currentUser.uid, record);
    } else {
      saveDiaryAuth(record);
    }
    setDiaryAuth(record);
  };

  const handleResetDiary = () => {
    const entryIds = diaryEntries.map((e) => e.id);
    if (currentUser) {
      void clearDiaryCloud(currentUser.uid, entryIds);
    } else {
      clearDiaryStorage();
    }
    setDiaryAuth(null);
    setDiaryEntries([]);
    setIsDiaryUnlocked(false);
  };

  const handleSaveDiaryEntry = (input: {
    id?: string;
    date: string;
    title: string;
    content: string;
    mood: DiaryMood;
  }) => {
    const now = new Date().toISOString();
    if (input.id) {
      const existing = diaryEntries.find((e) => e.id === input.id);
      const updatedEntry: DiaryEntry = {
        id: input.id,
        date: input.date,
        title: input.title,
        content: input.content,
        mood: input.mood,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      setDiaryEntries((prev) =>
        prev.map((entry) => (entry.id === input.id ? updatedEntry : entry))
      );
      if (currentUser) {
        void saveDiaryEntryCloud(currentUser.uid, updatedEntry, true);
      }
    } else {
      const created: DiaryEntry = {
        id: createId('diary'),
        date: input.date,
        title: input.title,
        content: input.content,
        mood: input.mood,
        createdAt: now,
        updatedAt: now,
      };
      setDiaryEntries((prev) => [created, ...prev]);
      if (currentUser) {
        void saveDiaryEntryCloud(currentUser.uid, created, false);
      }
    }
  };

  const handleDeleteDiaryEntry = (entryId: string) => {
    setDiaryEntries((prev) => prev.filter((e) => e.id !== entryId));
    if (currentUser) {
      void deleteDiaryEntryCloud(currentUser.uid, entryId);
    }
  };

  const handleExportJson = () => {
    const json = buildBackupJson(habits, tasks);
    triggerFileDownload(`stride-backup-${todayStr}.json`, json, 'application/json;charset=utf-8');
  };

  const handleExportCsv = () => {
    const csv = buildLogsCsv(habits, tasks);
    triggerFileDownload(`stride-logs-${todayStr}.csv`, csv, 'text/csv;charset=utf-8');
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas text-ink">
        <div className="flex items-center gap-3">
          <StrideLogoMark size="md" />
          <span className="font-display text-lg font-bold tracking-tight">Stride</span>
        </div>
        <p className="mt-3 text-xs text-ink-muted">Checking account session...</p>
      </div>
    );
  }

  if (!currentUser && !isLocalDemo) {
    return (
      <AuthScreen
        colorMode={colorMode}
        onToggleColorMode={handleToggleColorMode}
        onContinueDemo={handleContinueDemo}
      />
    );
  }

  const taskStats = getTaskStats(tasks);
  const accountSummary = {
    isAuthenticated: Boolean(currentUser),
    displayName: currentUser
      ? profileDisplayName || currentUser.displayName || 'Account'
      : 'Local Demo',
    email: currentUser?.email ?? undefined,
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <TopBar
        activeView={activeView}
        activeTheme={activeTheme}
        colorMode={colorMode}
        searchQuery={searchQuery}
        tasks={tasks}
        todayStr={todayStr}
        account={accountSummary}
        onSelectView={setActiveView}
        onSelectTheme={handleSelectTheme}
        onToggleColorMode={handleToggleColorMode}
        onSearchChange={setSearchQuery}
        onToggleTask={handleToggleTask}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
        onSignOut={handleSignOut}
        onOpenAuth={handleOpenAuth}
        onOpenNewHabit={handleOpenNewHabit}
      />

      <main className="mx-auto max-w-7xl px-3.5 py-5 pb-20 sm:px-6 sm:py-6 md:pb-12 lg:px-8">
        <ViewSummary
          activeView={activeView}
          habits={habits}
          tasks={tasks}
          selectedDate={selectedDate}
          todayStr={todayStr}
        />

        {activeView !== 'diary' && (
          <TaskReminderBanner
            tasks={tasks}
            todayStr={todayStr}
            onToggleTask={handleToggleTask}
            onJumpToTasks={() => setActiveView('tasks')}
          />
        )}

        {activeView === 'overview' && (
          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <HabitsPanel
                habits={habits}
                selectedDate={selectedDate}
                todayStr={todayStr}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                onSelectDate={setSelectedDate}
                onIncrementHabit={handleIncrementHabit}
                onToggleHabitComplete={handleToggleHabitComplete}
                onSaveHabitNote={handleSaveHabitNote}
                onEditHabit={handleEditHabit}
                onOpenNewHabit={handleOpenNewHabit}
              />
              <StreakHeatmap
                habits={habits}
                selectedDate={selectedDate}
                todayStr={todayStr}
                onSelectDate={setSelectedDate}
              />
            </div>

            <div className="lg:col-span-5">
              <TasksPanel
                tasks={tasks}
                todayStr={todayStr}
                globalSearchQuery={searchQuery}
                onClearGlobalSearch={() => setSearchQuery('')}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onUpdateTaskPriority={handleUpdateTaskPriority}
                onDeleteTask={handleDeleteTask}
                onClearCompleted={handleClearCompletedTasks}
              />
            </div>
          </div>
        )}

        {activeView === 'habits' && (
          <div className="mt-6 space-y-6">
            <HabitsPanel
              habits={habits}
              selectedDate={selectedDate}
              todayStr={todayStr}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              onSelectDate={setSelectedDate}
              onIncrementHabit={handleIncrementHabit}
              onToggleHabitComplete={handleToggleHabitComplete}
              onSaveHabitNote={handleSaveHabitNote}
              onEditHabit={handleEditHabit}
              onOpenNewHabit={handleOpenNewHabit}
            />
          </div>
        )}

        {activeView === 'tasks' && (
          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <TasksPanel
                tasks={tasks}
                todayStr={todayStr}
                globalSearchQuery={searchQuery}
                onClearGlobalSearch={() => setSearchQuery('')}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onUpdateTaskPriority={handleUpdateTaskPriority}
                onDeleteTask={handleDeleteTask}
                onClearCompleted={handleClearCompletedTasks}
              />
            </div>
            <aside className="rounded-xl border border-line bg-surface p-5 sm:p-6 lg:col-span-4">
              <h2 className="font-display text-base font-semibold text-ink">
                Tasks by Category
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Distribution across active and completed items
              </p>
              <dl className="mt-4 divide-y divide-line">
                {(Object.keys(taskStats.byCategory) as TaskCategory[]).map((cat) => (
                  <div key={cat} className="flex items-center justify-between py-2.5 text-sm">
                    <dt className="text-ink-secondary">{cat}</dt>
                    <dd className="font-mono font-medium text-ink tabular-nums">
                      {taskStats.byCategory[cat]}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        )}

        {activeView === 'streaks' && (
          <div className="mt-6">
            <StreakHeatmap
              habits={habits}
              selectedDate={selectedDate}
              todayStr={todayStr}
              onSelectDate={setSelectedDate}
              defaultMode="calendar"
            />
          </div>
        )}

        {activeView === 'diary' && (
          <div className="mt-6">
            <DiaryPanel
              entries={diaryEntries}
              authRecord={diaryAuth}
              isUnlocked={isDiaryUnlocked}
              todayStr={todayStr}
              onUnlock={() => setIsDiaryUnlocked(true)}
              onLock={() => setIsDiaryUnlocked(false)}
              onSaveAuth={handleSaveDiaryAuth}
              onResetDiary={handleResetDiary}
              onSaveEntry={handleSaveDiaryEntry}
              onDeleteEntry={handleDeleteDiaryEntry}
            />
          </div>
        )}
      </main>

      <MobileNav activeView={activeView} onSelectView={setActiveView} />

      <HabitModal
        isOpen={isHabitModalOpen}
        editingHabit={editingHabit}
        onClose={() => setIsHabitModalOpen(false)}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
      />
    </div>
  );
}
