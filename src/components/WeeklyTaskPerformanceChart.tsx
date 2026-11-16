import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Task } from '../types';
import { getTaskStats, getWeeklyTaskPerformanceData, WeeklyTaskPoint } from '../utils/tasks';

interface WeeklyTaskPerformanceChartProps {
  tasks: Task[];
  todayStr: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WeeklyTaskPoint }>;
}

function WeeklyTaskTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-ink">{point.dayLabel}</p>
      <p className="mt-1 font-mono text-xs text-ink-secondary tabular-nums">
        {point.addedCount} added · {point.completedCount} completed
      </p>
      {point.dueCount > 0 && (
        <p className="mt-0.5 font-mono text-[11px] text-accent-text tabular-nums">
          {point.dueCount} due on this date
        </p>
      )}
    </div>
  );
}

export function WeeklyTaskPerformanceChart({ tasks, todayStr }: WeeklyTaskPerformanceChartProps) {
  const data = getWeeklyTaskPerformanceData(tasks, todayStr, 7);
  const stats = getTaskStats(tasks);

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const added7d = data.reduce((sum, d) => sum + d.addedCount, 0);

  return (
    <section
      aria-label="Weekly task performance chart"
      data-testid="weekly-task-performance-view"
      className="rounded-xl border border-line bg-surface p-4 sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">
            7-Day Task Activity &amp; Completion
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Tasks added and completed per day over the past 7 days
          </p>
        </div>

        <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div>
            <dt className="text-ink-muted">Completion Rate</dt>
            <dd className="font-mono text-base font-semibold text-accent-text tabular-nums">
              {completionPct}%
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Added (7d)</dt>
            <dd className="font-mono text-base font-semibold text-ink tabular-nums">
              {added7d}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Open Tasks</dt>
            <dd className="font-mono text-base font-semibold text-ink tabular-nums">
              {stats.active}
            </dd>
          </div>
        </dl>
      </div>

      {tasks.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-center">
          <div>
            <p className="text-sm font-medium text-ink">No tasks tracked yet</p>
            <p className="mt-1 text-xs text-ink-muted">
              Add a task below to visualize your 7-day task activity and completion trend.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-end gap-4 text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-xs"
                style={{ backgroundColor: 'var(--border-strong)' }}
                aria-hidden="true"
              />
              <span>Added</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-xs"
                style={{ backgroundColor: 'var(--accent)' }}
                aria-hidden="true"
              />
              <span>Completed</span>
            </span>
          </div>

          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid
                  stroke="var(--border-subtle)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fill: 'var(--text-ink-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-subtle)' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--text-ink-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--bg-subtle)', opacity: 0.5 }}
                  content={<WeeklyTaskTooltip />}
                />
                <Bar
                  dataKey="addedCount"
                  name="Added"
                  fill="var(--border-strong)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="completedCount"
                  name="Completed"
                  fill="var(--accent)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
