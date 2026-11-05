import { ChartPie } from 'lucide-react';
import { PeriodNavigator } from '@/components/PeriodNavigator';
import { EmptyState } from '@/components/ui/EmptyState';
import { en } from '@/i18n/en';
import { totalIncome, totalSpent } from '@/lib/calc';
import { useAppData, useSelectedPeriod } from '@/store/useAppStore';
import { CategoryDonut } from './CategoryDonut';
import { DailySpendingChart } from './DailySpendingChart';
import { PeriodComparison } from './PeriodComparison';
import { TopItems } from './TopItems';

export function ReportsPage() {
  const { incomes, expenses } = useAppData();
  const period = useSelectedPeriod();
  const spent = totalSpent(expenses, period);

  return (
    <div className="flex flex-col gap-4">
      <PeriodNavigator />

      {spent === 0 ? (
        <EmptyState icon={ChartPie} title={en.reports.emptyTitle} body={en.reports.emptyBody} />
      ) : (
        <>
          <CategoryDonut period={period} spent={spent} />
          <DailySpendingChart period={period} income={totalIncome(incomes, period)} />
          <PeriodComparison period={period} />
          <TopItems period={period} />
        </>
      )}
    </div>
  );
}
