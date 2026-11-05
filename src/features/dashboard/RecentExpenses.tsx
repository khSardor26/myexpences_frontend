import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { en } from '@/i18n/en';
import { formatDayLabel } from '@/lib/dates';
import { recentExpenses } from '@/lib/expenses';
import type { Period } from '@/lib/types';
import { useAppData, useFormatMoney } from '@/store/useAppStore';

export function RecentExpenses({ period }: { period: Period }) {
  const { expenses, categories, items } = useAppData();
  const formatMoney = useFormatMoney();
  const recent = recentExpenses(expenses, period);

  if (recent.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="section-title">{en.dashboard.recent}</h2>
        <Link
          to="/history"
          className="flex min-h-tap items-center px-2 text-accent underline-offset-4 hover:underline"
        >
          {en.dashboard.seeAll}
        </Link>
      </div>
      <Card flush>
        <ul className="divide-y divide-line">
          {recent.map((expense) => {
            const category = categories.find((entry) => entry.id === expense.categoryId);
            const item = items.find((entry) => entry.id === expense.itemId);
            return (
              <li key={expense.id} className="flex min-h-14 items-center gap-2 px-4 py-2">
                <span aria-hidden className="w-6 shrink-0 text-center">
                  {category?.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium wrap-anywhere">
                    {category?.name} → {item?.name ?? en.expense.general}
                  </span>
                  <span className="block font-mono text-xs wrap-anywhere text-muted">
                    {formatDayLabel(expense.date)}
                    {expense.quantity && ` · ${expense.quantity}`}
                    {expense.note && ` · ${expense.note}`}
                  </span>
                </span>
                <span className="shrink-0 text-right font-semibold tabular-nums">
                  {formatMoney(expense.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}
