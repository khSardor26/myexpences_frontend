import { TriangleAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { en } from '@/i18n/en';
import { sharePercent, type BudgetLevel, type PeriodSummary } from '@/lib/calc';
import { useFormatMoney } from '@/store/useAppStore';

const BAR_COLOR: Record<BudgetLevel, string> = {
  ok: 'bg-income',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

/** The most important thing on screen: how much is left. */
export function BalanceCard({ summary }: { summary: PeriodSummary }) {
  const formatMoney = useFormatMoney();
  const { income, spent, remaining, level } = summary;

  const isOverBudget = remaining < 0;
  const percent = sharePercent(spent, income);
  const barWidth = isOverBudget ? 100 : Math.min(percent, 100);

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="section-title">{en.dashboard.remaining}</h2>
        <p
          key={remaining}
          className={`number-updated mt-1 text-4xl font-medium tracking-[-0.02em] wrap-anywhere tabular-nums md:text-display ${
            isOverBudget ? 'text-danger' : ''
          }`}
        >
          {formatMoney(remaining)}
        </p>
      </div>

      {isOverBudget && (
        <p className="flex items-center gap-2 text-sm font-semibold text-danger">
          <TriangleAlert aria-hidden className="size-5 shrink-0" />
          {en.dashboard.overBudget(formatMoney(-remaining))}
        </p>
      )}

      <dl className="grid grid-cols-2 divide-x divide-line tabular-nums">
        <div className="min-w-0 pr-3">
          <dt className="text-sm text-muted">{en.dashboard.income}</dt>
          <dd className="font-semibold wrap-anywhere text-income">{formatMoney(income)}</dd>
        </div>
        <div className="min-w-0 pl-3">
          <dt className="text-sm text-muted">{en.dashboard.spent}</dt>
          <dd className="font-semibold wrap-anywhere">{formatMoney(spent)}</dd>
        </div>
      </dl>

      <div>
        <div
          role="progressbar"
          aria-label={en.dashboard.budgetUsed}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={barWidth}
          className="h-2 overflow-hidden rounded-xs bg-line"
        >
          <div
            className={`h-full transition-[width] duration-300 ${BAR_COLOR[level]}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        {income > 0 && (
          <p className="mt-1 text-sm text-muted tabular-nums">{en.dashboard.percentUsed(percent)}</p>
        )}
      </div>
    </Card>
  );
}
