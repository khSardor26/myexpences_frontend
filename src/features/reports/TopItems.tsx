import { Card } from '@/components/ui/Card';
import { en } from '@/i18n/en';
import { topItems } from '@/lib/reports';
import type { Period } from '@/lib/types';
import { useAppData, useFormatMoney } from '@/store/useAppStore';

export function TopItems({ period }: { period: Period }) {
  const { expenses, categories, items } = useAppData();
  const formatMoney = useFormatMoney();

  return (
    <section className="flex flex-col gap-2">
      <h2 className="section-title">{en.reports.topItems}</h2>
      <Card flush>
        <ol className="divide-y divide-line">
          {topItems(expenses, period).map(({ categoryId, itemId, total }, index) => (
            <li key={`${categoryId}/${itemId ?? ''}`} className="flex min-h-tap items-center gap-3 px-4 py-2 text-sm">
              <span className="w-4 shrink-0 text-muted tabular-nums">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium wrap-anywhere">
                  {items.find((item) => item.id === itemId)?.name ?? en.expense.general}
                </span>
                <span className="block text-muted wrap-anywhere">
                  {categories.find((category) => category.id === categoryId)?.name}
                </span>
              </span>
              <span className="shrink-0 text-right font-semibold tabular-nums">{formatMoney(total)}</span>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
}
