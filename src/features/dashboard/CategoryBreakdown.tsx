import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { en } from '@/i18n/en';
import { sharePercent, totalsByCategory, totalsByItem, type CategoryTotal } from '@/lib/calc';
import type { Period } from '@/lib/types';
import { useAppData, useFormatMoney } from '@/store/useAppStore';

function CategoryItems({ categoryId, period }: { categoryId: string; period: Period }) {
  const { expenses, items } = useAppData();
  const formatMoney = useFormatMoney();

  return (
    <ul className="flex flex-col gap-2 px-4 pb-3 pl-12">
      {totalsByItem(expenses, period, categoryId).map(({ itemId, total }) => (
        <li key={itemId ?? 'general'} className="flex justify-between gap-3 text-sm">
          <span className="min-w-0 wrap-anywhere text-muted">
            {items.find((item) => item.id === itemId)?.name ?? en.expense.general}
          </span>
          <span className="shrink-0 font-medium tabular-nums">{formatMoney(total)}</span>
        </li>
      ))}
    </ul>
  );
}

interface CategoryRowProps {
  entry: CategoryTotal;
  spent: number;
  expanded: boolean;
  onToggle: () => void;
}

function CategoryRow({ entry, spent, expanded, onToggle }: CategoryRowProps) {
  const { categories } = useAppData();
  const formatMoney = useFormatMoney();
  const category = categories.find((candidate) => candidate.id === entry.categoryId);
  const percent = sharePercent(entry.total, spent);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex min-h-14 w-full flex-col justify-center gap-1.5 px-4 py-2 text-left hover:bg-primary-soft"
    >
      <span className="flex w-full items-center gap-2">
        <span aria-hidden className="w-6 shrink-0 text-center">
          {category?.icon}
        </span>
        <span className="min-w-0 flex-1 font-medium wrap-anywhere">{category?.name}</span>
        <span className="shrink-0 text-right font-semibold tabular-nums">{formatMoney(entry.total)}</span>
        <ChevronDown
          aria-hidden
          className={`size-4 shrink-0 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </span>
      <span className="flex w-full items-center gap-2 pl-8">
        <span className="h-1 flex-1 overflow-hidden rounded-xs bg-line">
          <span className="block h-full bg-primary" style={{ width: `${percent}%` }} />
        </span>
        <span className="w-10 shrink-0 text-right text-sm text-muted tabular-nums">{percent}%</span>
      </span>
    </button>
  );
}

export function CategoryBreakdown({ period, spent }: { period: Period; spent: number }) {
  const { expenses } = useAppData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const totals = totalsByCategory(expenses, period);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="section-title">{en.dashboard.byCategory}</h2>
      {totals.length === 0 ? (
        <Card>
          <p className="text-muted">{en.dashboard.noSpending}</p>
        </Card>
      ) : (
        <Card flush>
          <ul className="divide-y divide-line">
            {totals.map((entry) => {
              const expanded = entry.categoryId === expandedId;
              return (
                <li key={entry.categoryId}>
                  <CategoryRow
                    entry={entry}
                    spent={spent}
                    expanded={expanded}
                    onToggle={() => setExpandedId(expanded ? null : entry.categoryId)}
                  />
                  {expanded && <CategoryItems categoryId={entry.categoryId} period={period} />}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </section>
  );
}
