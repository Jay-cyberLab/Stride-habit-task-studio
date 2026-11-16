import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Habit } from '../types';
import { getWeeklyPerformanceData, WeeklyPerformancePoint } from '../utils/habits';

interface WeeklyPerformanceChartProps {
  habits: Habit[];
  todayStr: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WeeklyPerformancePoint }>;
}

function WeeklyChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-ink">{point.dayLabel}</p>
      <p className="mt-1 font-mono text-xs text-ink-secondary tabular-nums">
        {point.completedCount}/{point.totalHabits} habits ({point.completionRate}%)
      </p>
      {point.notesCount > 0 && (
        <p className="mt-0.5 text-[11px] text-accent-text tabular-nums">
          {point.notesCount} reflection{point.notesCount === 1 ? '' : 's'} logged
        </p>
      )}
    </div>
  );
}

export function WeeklyPerformanceChart({ habits, todayStr }: WeeklyPerformanceChartProps) {
  const data = getWeeklyPerformanceData(habits, todayStr, 7);

  const avgRate =
    data.length > 0
      ? Math.round(data.reduce((sum, d) => sum + d.completionRate, 0) / data.length)
      : 0;
  const totalCompletions = data.reduce((sum, d) => sum + d.completedCount, 0);
  const peakPoint = data.reduce(
    (best, curr) => (curr.completionRate >= best.completionRate ? curr : best),
    data[0]
  );

  return (
    <section
      aria-label="Weekly habit performance chart"
      data-testid="weekly-performance-view"
      className="rounded-xl border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">
            7-Day Habit Completion Trend
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Daily percentage of habit goals reached over the past 7 days
          </p>
        </div>

        <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div>
            <dt className="text-ink-muted">7-Day Avg</dt>
            <dd className="font-mono text-base font-semibold text-ink tabular-nums">
              {avgRate}%
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Total Met</dt>
            <dd className="font-mono text-base font-semibold text-ink tabular-nums">
              {totalCompletions}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Peak Day</dt>
            <dd className="font-mono text-base font-semibold text-accent-text tabular-nums">
              {peakPoint ? `${peakPoint.shortDay} · ${peakPoint.completionRate}%` : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {habits.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-center">
          <div>
            <p className="text-sm font-medium text-ink">No habits tracked yet</p>
            <p className="mt-1 text-xs text-ink-muted">
              Add a habit to generate your 7-day completion trend chart.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 h-60 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 24, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="strideWeeklyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--border-subtle)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="dayLabel"
                padding={{ left: 10, right: 12 }}
                tick={{ fill: 'var(--text-ink-muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-subtle)' }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: 'var(--text-ink-muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<WeeklyChartTooltip />} />
              <Area
                type="monotone"
                dataKey="completionRate"
                name="Completion Rate"
                stroke="var(--accent)"
                strokeWidth={2.5}
                fill="url(#strideWeeklyFill)"
                activeDot={{ r: 5, fill: 'var(--cta-bg)', stroke: 'var(--accent)', strokeWidth: 2 }}
                dot={{ r: 3.5, fill: 'var(--bg-surface)', stroke: 'var(--accent)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
