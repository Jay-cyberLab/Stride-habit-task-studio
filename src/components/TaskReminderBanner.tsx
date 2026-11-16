import { useState } from 'react';
import { Bell, BellRing, Check, Clock, X } from 'lucide-react';
import { Task } from '../types';
import { formatReminderRelativeDay, getTaskReminders } from '../utils/reminders';

interface TaskReminderBannerProps {
  tasks: Task[];
  todayStr: string;
  onToggleTask: (taskId: string) => void;
  onJumpToTasks: () => void;
}

export function TaskReminderBanner({
  tasks,
  todayStr,
  onToggleTask,
  onJumpToTasks,
}: TaskReminderBannerProps) {
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'unsupported'
  );
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  const summary = getTaskReminders(tasks, todayStr, 2);
  if (summary.totalUrgent === 0) return null;

  const signature = summary.all.map((r) => `${r.task.id}:${r.status}`).join('|');
  if (dismissedKey === signature) return null;

  const hasOverdue = summary.overdue.length > 0;
  const visibleItems = summary.all.slice(0, 3);
  const extraCount = summary.all.length - visibleItems.length;

  const handleEnableNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifFeedback('Browser notifications are unavailable here; visual alerts remain active.');
      return;
    }

    try {
      const permission =
        window.Notification.permission === 'granted'
          ? 'granted'
          : await window.Notification.requestPermission();
      setNotifPermission(permission);

      if (permission === 'granted') {
        const headline = hasOverdue
          ? `${summary.overdue.length} overdue & ${summary.dueToday.length + summary.upcoming.length} upcoming tasks`
          : `${summary.totalUrgent} task reminder${summary.totalUrgent === 1 ? '' : 's'} due soon`;
        const body = summary.all
          .slice(0, 3)
          .map((item) => `• ${item.task.title} (${formatReminderRelativeDay(item.daysDelta)})`)
          .join('\n');
        new window.Notification(headline, { body });
        setNotifFeedback('Local notification sent for your upcoming and overdue tasks.');
      } else {
        setNotifFeedback('Browser permission declined; in-app visual reminders stay active.');
      }
    } catch {
      setNotifFeedback('Could not trigger browser notification; visual reminders stay active.');
    }
  };

  return (
    <section
      aria-label="Task due-date reminders"
      data-testid="task-reminder-banner"
      className={`mt-5 rounded-xl border p-4 sm:px-5 ${
        hasOverdue
          ? 'border-danger-border bg-danger-bg/60'
          : 'border-line bg-surface'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {hasOverdue ? (
              <BellRing className="h-4 w-4 shrink-0 text-danger-text" aria-hidden="true" />
            ) : (
              <Clock className="h-4 w-4 shrink-0 text-warn-text" aria-hidden="true" />
            )}
            <h2 className="font-display text-sm font-semibold text-ink">
              {hasOverdue
                ? `${summary.overdue.length} overdue · ${summary.dueToday.length + summary.upcoming.length} due soon`
                : `${summary.totalUrgent} upcoming task reminder${summary.totalUrgent === 1 ? '' : 's'}`}
            </h2>
          </div>

          <ul className="mt-2.5 divide-y divide-line/80" data-testid="reminder-items">
            {visibleItems.map(({ task, status, daysDelta }) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0 text-xs"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`font-medium shrink-0 ${
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
                  <span className="truncate font-medium text-ink">{task.title}</span>
                  <span aria-hidden="true" className="hidden sm:inline text-ink-muted">·</span>
                  <span className="hidden sm:inline text-ink-muted">{task.category}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  aria-label={`Complete reminder task "${task.title}"`}
                  className="inline-flex min-h-[28px] items-center gap-1 rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink transition-colors hover:bg-subtle whitespace-nowrap shrink-0"
                >
                  <Check className="h-3 w-3" aria-hidden="true" />
                  <span>Mark Done</span>
                </button>
              </li>
            ))}
          </ul>

          {(extraCount > 0 || notifFeedback) && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
              {extraCount > 0 && (
                <button
                  type="button"
                  onClick={onJumpToTasks}
                  className="font-medium text-accent-text underline-offset-2 hover:underline"
                >
                  View +{extraCount} more in Tasks
                </button>
              )}
              {notifFeedback && <span>{notifFeedback}</span>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {notifPermission !== 'unsupported' && (
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-subtle whitespace-nowrap"
            >
              <Bell className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
              <span>{notifPermission === 'granted' ? 'Notify Now' : 'Enable Alerts'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissedKey(signature)}
            aria-label="Dismiss due-date reminder banner"
            className="flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
