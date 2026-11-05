import { useState } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/Card';
import { en } from '@/i18n/en';
import { sharePercent, totalsByCategory, totalsByItem } from '@/lib/calc';
import type { Period } from '@/lib/types';
import { useAppData, useFormatMoney } from '@/store/useAppStore';
import { ChartTooltip } from './ChartTooltip';

/** Darkest for the biggest. A shade shows size rank: the list beside the chart gives identity. */
const shade = (rank: number) => `var(--chart-${Math.min(rank + 1, 4)})`;

interface Slice {
  categoryId: string;
  name: string;
  total: number;
  fill: string;
}

function CategoryItemBars({ categoryId, name, period }: { categoryId: string; name: string; period: Period }) {
  const { expenses, items } = useAppData();
  const formatMoney = useFormatMoney();
  const totals = totalsByItem(expenses, period, categoryId);
  const largest = totals[0]?.total ?? 0;

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <h3 className="text-sm font-semibold">{en.reports.itemsIn(name)}</h3>
      <ul className="flex flex-col gap-3">
        {totals.map(({ itemId, total }) => (
          <li key={itemId ?? 'general'} className="flex flex-col gap-1 text-sm">
            <span className="flex justify-between gap-3">
              <span className="min-w-0 wrap-anywhere">
                {items.find((item) => item.id === itemId)?.name ?? en.expense.general}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{formatMoney(total)}</span>
            </span>
            <span className="h-2 overflow-hidden rounded-xs bg-line">
              <span className="block h-full bg-primary" style={{ width: `${sharePercent(total, largest)}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategoryDonut({ period, spent }: { period: Period; spent: number }) {
  const { expenses, categories } = useAppData();
  const formatMoney = useFormatMoney();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totals = totalsByCategory(expenses, period);
  // A category picked in another period may have nothing in this one.
  const selected = totals.some((entry) => entry.categoryId === selectedId) ? selectedId : null;

  const slices: Slice[] = totals.map(({ categoryId, total }, rank) => {
    const isFaded = selected !== null && categoryId !== selected;
    return {
      categoryId,
      total,
      name: categories.find((category) => category.id === categoryId)?.name ?? '',
      fill: isFaded ? 'var(--line)' : selected ? 'var(--accent)' : shade(rank),
    };
  });

  const toggle = (categoryId: string) => setSelectedId(categoryId === selected ? null : categoryId);
  const selectedName = slices.find((slice) => slice.categoryId === selected)?.name;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="section-title">{en.reports.byCategory}</h2>
      <Card className="flex flex-col gap-4">
        <div className="grid items-center gap-4 lg:grid-cols-2">
          <div
            role="img"
            aria-label={en.reports.donutSummary(formatMoney(spent), slices.length)}
            className="relative mx-auto h-56 w-full max-w-56"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="total"
                  nameKey="name"
                  innerRadius="68%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  isAnimationActive={false}
                  rootTabIndex={-1}
                  className="cursor-pointer"
                  onClick={(_, index) => {
                    const slice = slices[index];
                    if (slice) toggle(slice.categoryId);
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    const slice: Slice | undefined = payload?.[0]?.payload;
                    if (!active || !slice) return null;
                    return (
                      <ChartTooltip
                        title={slice.name}
                        value={`${formatMoney(slice.total)} · ${sharePercent(slice.total, spent)}%`}
                      />
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
              <span className="text-muted">{en.reports.spent}</span>
              <span className="font-semibold wrap-anywhere tabular-nums">{formatMoney(spent)}</span>
            </div>
          </div>

          <ul className="flex flex-col">
            {slices.map((slice, rank) => (
              <li key={slice.categoryId}>
                <button
                  type="button"
                  aria-pressed={slice.categoryId === selected}
                  onClick={() => toggle(slice.categoryId)}
                  className={`flex min-h-tap w-full items-center gap-2 rounded-control px-2 text-left text-sm hover:bg-primary-soft ${
                    slice.categoryId === selected ? 'bg-primary-soft font-semibold' : ''
                  }`}
                >
                  <span aria-hidden className="size-3 shrink-0 rounded-xs" style={{ backgroundColor: shade(rank) }} />
                  <span aria-hidden className="w-5 shrink-0 text-center">
                    {categories.find((category) => category.id === slice.categoryId)?.icon}
                  </span>
                  <span className="min-w-0 flex-1 wrap-break-word">{slice.name}</span>
                  <span className="shrink-0 text-right font-medium tabular-nums">{formatMoney(slice.total)}</span>
                  <span className="w-9 shrink-0 text-right text-muted tabular-nums">
                    {sharePercent(slice.total, spent)}%
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {selected && selectedName !== undefined && (
          <CategoryItemBars categoryId={selected} name={selectedName} period={period} />
        )}
      </Card>
    </section>
  );
}
