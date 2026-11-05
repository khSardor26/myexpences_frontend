import { Wallet } from 'lucide-react';
import { PeriodNavigator } from '@/components/PeriodNavigator';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { en } from '@/i18n/en';
import { summarizePeriod } from '@/lib/calc';
import { todayISO } from '@/lib/dates';
import { useAppData, useSelectedPeriod } from '@/store/useAppStore';
import { BalanceCard } from './BalanceCard';
import { CategoryBreakdown } from './CategoryBreakdown';
import { PeriodTypeToggle } from './PeriodTypeToggle';
import { RecentExpenses } from './RecentExpenses';
import { StatCards } from './StatCards';

export function DashboardPage() {
  const { incomes, expenses } = useAppData();
  const period = useSelectedPeriod();
  const summary = summarizePeriod(incomes, expenses, period, todayISO());
  const isEmpty = summary.income === 0 && summary.spent === 0;

  return (
    <div className="flex flex-col gap-4">
      <PeriodTypeToggle />
      <PeriodNavigator />

      {isEmpty ? (
        <EmptyState
          icon={Wallet}
          title={en.dashboard.emptyTitle}
          body={en.dashboard.emptyBody}
          action={<LinkButton to="/income">{en.dashboard.emptyAction}</LinkButton>}
        />
      ) : (
        <>
          <BalanceCard summary={summary} />
          <StatCards summary={summary} />
          <CategoryBreakdown period={period} spent={summary.spent} />
          <RecentExpenses period={period} />
        </>
      )}
    </div>
  );
}
