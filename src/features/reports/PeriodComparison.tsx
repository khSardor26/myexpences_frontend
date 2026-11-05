import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { en } from '@/i18n/en';
import { formatPeriodLabel, shiftPeriod } from '@/lib/dates';
import { compareCategories, type CategoryChange } from '@/lib/reports';
import type { Period } from '@/lib/types';
import { useAppData, useFormatMoney } from '@/store/useAppStore';

function ChangeRow({ entry }: { entry: CategoryChange }) {
  const { categories } = useAppData();
  const formatMoney = useFormatMoney();
  const category = categories.find((candidate) => candidate.id === entry.categoryId);
  const Icon = entry.change > 0 ? ArrowUp : entry.change < 0 ? ArrowDown : Minus;

  return (
    <li className="flex min-h-14 items-center gap-2 px-4 py-2 text-sm">
      <span aria-hidden className="w-5 shrink-0 text-center">
        {category?.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium wrap-anywhere">{category?.name}</span>
        <span className="flex flex-wrap gap-x-2 text-muted tabular-nums">
          <span>{formatMoney(entry.current)}</span>
          <span>{en.reports.was(formatMoney(entry.previous))}</span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-right font-semibold tabular-nums">
        <Icon aria-hidden className="size-4 text-muted" />
        {entry.change > 0 && '+'}
        {formatMoney(entry.change)}
      </span>
    </li>
  );
}

export function PeriodComparison({ period }: { period: Period }) {
  const { expenses, settings } = useAppData();
  const previous = shiftPeriod(period, -1, settings);
  const changes = compareCategories(expenses, period, previous);

  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="section-title">{en.reports.comparison}</h2>
        <p className="text-sm text-muted">{en.reports.comparedWith(formatPeriodLabel(previous))}</p>
      </div>
      <Card flush>
        <ul className="divide-y divide-line">
          {changes.map((entry) => (
            <ChangeRow key={entry.categoryId} entry={entry} />
          ))}
        </ul>
      </Card>
    </section>
  );
}
