import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card } from '@/components/ui/Card';
import { en } from '@/i18n/en';
import { formatAxisDay, formatDayLabel } from '@/lib/dates';
import { averageDailyBudget, dailySpending, type DayTotal } from '@/lib/reports';
import type { Period } from '@/lib/types';
import { useAppData, useFormatMoney } from '@/store/useAppStore';
import { ChartTooltip } from './ChartTooltip';

export function DailySpendingChart({ period, income }: { period: Period; income: number }) {
  const { expenses } = useAppData();
  const formatMoney = useFormatMoney();

  const days = dailySpending(expenses, period);
  const budget = averageDailyBudget(income, period);
  const daysWithSpending = days.filter((day) => day.total > 0);
  const highest = Math.max(...days.map((day) => day.total));

  return (
    <section className="flex flex-col gap-2">
      <h2 className="section-title">{en.reports.daily}</h2>
      <Card className="flex flex-col gap-3">
        <div role="img" aria-label={en.reports.dailySummary(formatMoney(highest), formatMoney(budget))} className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap="15%">
              <XAxis
                dataKey="date"
                tickFormatter={(date: string) => formatAxisDay(date, period.type)}
                tickLine={false}
                axisLine={{ stroke: 'var(--control)' }}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                interval="preserveStartEnd"
                minTickGap={12}
              />
              <Tooltip
                cursor={{ fill: 'var(--primary-soft)' }}
                content={({ active, payload }) => {
                  const day: DayTotal | undefined = payload?.[0]?.payload;
                  if (!active || !day) return null;
                  return <ChartTooltip title={formatDayLabel(day.date)} value={formatMoney(day.total)} />;
                }}
              />
              <Bar dataKey="total" fill="var(--chart-1)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              {budget > 0 && (
                <ReferenceLine
                  y={budget}
                  stroke="var(--muted)"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  ifOverflow="extendDomain"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {budget > 0 && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <span aria-hidden className="w-5 shrink-0 border-t-2 border-dashed border-muted" />
            <span>
              {en.reports.dailyBudget}{' '}
              <span className="font-semibold text-ink tabular-nums">{formatMoney(budget)}</span>
            </span>
          </p>
        )}

        <details className="text-sm">
          <summary className="flex min-h-tap cursor-pointer items-center text-accent underline-offset-4 hover:underline">
            {en.reports.showTable}
          </summary>
          <table className="w-full">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th scope="col" className="py-2 font-medium">
                  {en.reports.day}
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  {en.reports.spent}
                </th>
              </tr>
            </thead>
            <tbody>
              {daysWithSpending.map((day) => (
                <tr key={day.date} className="border-b border-line last:border-0">
                  <td className="py-2">{formatDayLabel(day.date)}</td>
                  <td className="py-2 text-right tabular-nums">{formatMoney(day.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Card>
    </section>
  );
}
