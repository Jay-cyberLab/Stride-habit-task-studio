import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  Download,
  FileJson,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react';
import { AppThemeId, ColorMode, Task, WorkspaceView } from '../types';
import { formatReminderRelativeDay, getTaskReminders } from '../utils/reminders';
import { StrideLogoMark } from './StrideLogoMark';
import { ThemeSwitcher } from './ThemeSwitcher';

export interface AccountSummary {
  isAuthenticated: boolean;
  displayName: string;
  email?: string;
}

interface TopBarProps {
  activeView: WorkspaceView;
  activeTheme: AppThemeId;
  colorMode: ColorMode;
  searchQuery: string;
  tasks: Task[];
  todayStr: string;
  account: AccountSummary;
  onSelectView: (view: WorkspaceView) => void;
  onSelectTheme: (theme: AppThemeId) => void;
  onToggleColorMode: () => void;
  onSearchChange: (query: string) => void;
  onToggleTask: (taskId: string) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onSignOut: () => void;
  onOpenAuth: () => void;
  onOpenNewHabit: () => void;
}

const NAV_ITEMS: { id: WorkspaceView; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'habits', label: 'Habits' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'streaks', label: 'Streaks' },
  { id: 'diary', label: 'Diary' },
];

export function TopBar({
  activeView,
  activeTheme,
  colorMode,
  searchQuery,
  tasks,
  todayStr,
  account,
  onSelectView,
  onSelectTheme,
  onToggleColorMode,
  onSearchChange,
  onToggleTask,
  onExportJson,
  onExportCsv,
  onSignOut,
  onOpenAuth,
  onOpenNewHabit,
}: TopBarProps) {
  const [openMenu, setOpenMenu] = useState<'export' | 'reminders' | 'account' | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const reminderSummary = getTaskReminders(tasks, todayStr, 2);

  useEffect(() => {
    if (!openMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenu]);

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 lg:gap-7 shrink-0">
          <button
            type="button"
            onClick={() => onSelectView('overview')}
            aria-label="Stride home"
            className="inline-flex items-center gap-2 sm:gap-2.5 font-display text-lg font-bold tracking-tight text-ink whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <StrideLogoMark size="sm" />
            <span>Stride</span>
          </button>

          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-3 lg:gap-5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectView(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-accent"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div ref={actionsRef} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop global search */}
          <div className="relative hidden xl:block w-52 2xl:w-60">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search habits and tasks"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search habits & tasks..."
              className="min-h-[40px] w-full rounded-lg border border-line bg-subtle py-2 pr-8 pl-9 text-xs text-ink placeholder:text-ink-muted transition-colors focus:border-accent focus:bg-surface focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-ink-muted hover:text-ink"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Due-date Reminders Popover */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpenMenu((prev) => (prev === 'reminders' ? null : 'reminders'))}
              aria-expanded={openMenu === 'reminders'}
              aria-haspopup="dialog"
              aria-label={`Task reminders (${reminderSummary.totalUrgent} due soon or overdue)`}
              className="relative inline-flex min-h-[40px] min-w-[36px] sm:min-w-[40px] items-center justify-center rounded-lg border border-line bg-surface px-2 sm:px-2.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-subtle whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Bell
                className={`h-4 w-4 ${
                  reminderSummary.overdue.length > 0 ? 'text-danger-text' : 'text-ink-muted'
                }`}
                aria-hidden="true"
              />
              {reminderSummary.totalUrgent > 0 && (
                <span className="ml-1 font-mono text-xs font-semibold text-ink tabular-nums">
                  {reminderSummary.totalUrgent}
                </span>
              )}
            </button>

            {openMenu === 'reminders' && (
              <div
                role="dialog"
                aria-label="Upcoming and overdue task reminders"
                className="fixed inset-x-3 top-[68px] z-50 rounded-xl border border-line bg-surface p-3 shadow-lg sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-80"
              >
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <p className="font-display text-xs font-semibold text-ink">
                    Due-Date Reminders
                  </p>
                  <span className="font-mono text-[11px] text-ink-muted tabular-nums">
                    {reminderSummary.totalUrgent} alert{reminderSummary.totalUrgent === 1 ? '' : 's'}
                  </span>
                </div>

                {reminderSummary.totalUrgent === 0 ? (
                  <p className="py-5 text-center text-xs text-ink-muted">
                    No upcoming or overdue tasks right now.
                  </p>
                ) : (
                  <ul className="mt-2 max-h-64 divide-y divide-line overflow-y-auto">
                    {reminderSummary.all.map(({ task, status, daysDelta }) => (
                      <li key={task.id} className="flex items-start justify-between gap-2 py-2.5 text-xs">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{task.title}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                            <span
                              className={`font-medium ${
                                status === 'overdue'
                                  ? 'text-danger-text'
                                  : status === 'due_today'
                                  ? 'text-warn-text'
                                  : 'text-accent-text'
                              }`}
                            >
                              {formatReminderRelativeDay(daysDelta)}
                            </span>
                            <span aria-hidden="true" className="text-ink-muted">·</span>
                            <span className="text-ink-muted">{task.category}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleTask(task.id)}
                          aria-label={`Mark "${task.title}" done`}
                          className="inline-flex min-h-[28px] shrink-0 items-center gap-1 rounded-md border border-line bg-subtle px-2 py-1 text-[11px] font-medium text-ink hover:bg-hover-surface"
                        >
                          <Check className="h-3 w-3" aria-hidden="true" />
                          <span>Done</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-2 border-t border-line pt-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectView('tasks');
                      setOpenMenu(null);
                    }}
                    className="text-xs font-medium text-accent-text hover:underline"
                  >
                    Open Task Planner
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleColorMode}
            aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={colorMode === 'dark'}
            title={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex min-h-[40px] min-w-[36px] sm:min-w-[40px] items-center justify-center rounded-lg border border-line bg-surface px-2 py-2 text-ink transition-colors hover:bg-subtle whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {colorMode === 'dark' ? (
              <Sun className="h-4 w-4 text-accent-text" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
            )}
          </button>

          {/* Export backup menu (inline on lg+, accessible inside Account menu on <lg) */}
          <div className="relative hidden lg:block shrink-0">
            <button
              type="button"
              onClick={() => setOpenMenu((prev) => (prev === 'export' ? null : 'export'))}
              aria-expanded={openMenu === 'export'}
              aria-haspopup="menu"
              aria-label="Export habit and task logs"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-subtle whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Download className="h-4 w-4 text-ink-muted" aria-hidden="true" />
              <span className="hidden lg:inline">Export</span>
              <ChevronDown className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
            </button>

            {openMenu === 'export' && (
              <div
                role="menu"
                aria-label="Download backup options"
                className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-line bg-surface p-1.5 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onExportJson();
                    setOpenMenu(null);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-subtle"
                >
                  <FileJson className="h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink">Download JSON Backup</p>
                    <p className="text-[11px] text-ink-muted">Full habits, logs & tasks</p>
                  </div>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onExportCsv();
                    setOpenMenu(null);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-subtle"
                >
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink">Download CSV Logs</p>
                    <p className="text-[11px] text-ink-muted">Spreadsheet-ready export</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <ThemeSwitcher activeTheme={activeTheme} onSelectTheme={onSelectTheme} />

          {/* Account Menu */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpenMenu((prev) => (prev === 'account' ? null : 'account'))}
              aria-expanded={openMenu === 'account'}
              aria-haspopup="menu"
              aria-label={`Account menu (${account.displayName})`}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-line bg-surface px-2 sm:px-2.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-subtle whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <UserIcon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
              <span className="hidden lg:inline max-w-[96px] truncate">{account.displayName}</span>
            </button>

            {openMenu === 'account' && (
              <div
                role="menu"
                aria-label="Account actions"
                className="fixed inset-x-3 top-[68px] z-50 rounded-xl border border-line bg-surface p-2 shadow-lg sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-60"
              >
                <div className="border-b border-line px-2.5 pb-2">
                  <p className="truncate text-xs font-semibold text-ink">{account.displayName}</p>
                  <p className="truncate text-[11px] text-ink-muted">
                    {account.isAuthenticated
                      ? account.email || 'Cloud sync active'
                      : 'Local preview mode'}
                  </p>
                </div>

                {/* Mobile & tablet quick export actions inside Account menu */}
                <div className="mt-1.5 space-y-0.5 border-b border-line pb-1.5 lg:hidden">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onExportJson();
                      setOpenMenu(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-subtle"
                  >
                    <FileJson className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
                    <span>Download JSON Backup</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onExportCsv();
                      setOpenMenu(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-subtle"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
                    <span>Download CSV Logs</span>
                  </button>
                </div>

                {account.isAuthenticated ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenu(null);
                      onSignOut();
                    }}
                    className="mt-1.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-danger-text transition-colors hover:bg-danger-bg"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenu(null);
                      onOpenAuth();
                    }}
                    className="mt-1.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-subtle"
                  >
                    <LogIn className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
                    <span>Sign In or Create Account</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenNewHabit}
            className="inline-flex min-h-[40px] items-center gap-1 lg:gap-1.5 rounded-lg bg-cta px-2.5 lg:px-4 py-2 text-sm font-medium text-cta-fg transition-colors hover:bg-cta-hover active:scale-[0.99] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="lg:hidden">Habit</span>
            <span className="hidden lg:inline">New Habit</span>
          </button>
        </div>
      </div>

      {/* Tablet & Mobile search row */}
      <div className="border-t border-line/70 px-4 py-2 sm:px-6 xl:hidden">
        <div className="relative mx-auto max-w-7xl">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search habits and tasks"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search habits & tasks by title or category..."
            className="min-h-[38px] w-full rounded-lg border border-line bg-subtle py-1.5 pr-8 pl-9 text-xs text-ink placeholder:text-ink-muted transition-colors focus:border-accent focus:bg-surface focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-ink-muted hover:text-ink"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
