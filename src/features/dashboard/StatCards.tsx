import { Card } from '@/components/ui/Card';
import { en } from '@/i18n/en';
import type { PeriodSummary } from '@/lib/calc';
import { useFormatMoney } from '@/store/useAppStore';

function StatCard({ label, amount }: { label: string; amount: number | null }) {
  const formatMoney = useFormatMoney();

  return (
    <Card flush className="flex flex-col justify-between gap-1 p-3">
      <h2 className="section-title">{label}</h2>
      {amount === null ? (
        <p>
          <span aria-hidden className="font-bold">
            —
          </span>
          <span className="sr-only">{en.dashboard.notThisPeriod}</span>
        </p>
      ) : (
        <p key={amount} className="number-updated font-semibold wrap-anywhere tabular-nums md:text-lg">
          {formatMoney(amount)}
        </p>
      )}
    </Card>
  );
}

export function StatCards({ summary }: { summary: PeriodSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label={en.dashboard.safeToSpend} amount={summary.safeToSpendToday} />
      <StatCard label={en.dashboard.spentToday} amount={summary.spentToday} />
    </div>
  );
}
