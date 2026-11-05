import { Plus, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PeriodNavigator } from '@/components/PeriodNavigator';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Sheet } from '@/components/ui/Sheet';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import { totalIncome } from '@/lib/calc';
import { incomesInPeriod } from '@/lib/income';
import type { Income } from '@/lib/types';
import { useToastStore } from '@/store/toastStore';
import { useAppData, useAppStore, useFormatMoney, useSelectedPeriod } from '@/store/useAppStore';
import { IncomeForm } from './IncomeForm';
import { IncomeList } from './IncomeList';

export function IncomePage() {
  const { incomes } = useAppData();
  const period = useSelectedPeriod();
  const deleteIncome = useAppStore((state) => state.deleteIncome);
  const restoreIncome = useAppStore((state) => state.restoreIncome);
  const showToast = useToastStore((state) => state.showToast);
  const formatMoney = useFormatMoney();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Income | undefined>();

  const entries = useMemo(() => incomesInPeriod(incomes, period), [incomes, period]);

  const openAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (income: Income) => {
    setEditing(income);
    setFormOpen(true);
  };

  const undoDelete = async (income: Income) => {
    try {
      await restoreIncome(income);
    } catch (caught) {
      showToast(errorMessage(caught));
    }
  };

  const remove = async (income: Income) => {
    try {
      await deleteIncome(income.id);
      showToast(en.income.deleted(formatMoney(income.amount), income.source), {
        label: en.common.undo,
        run: () => void undoDelete(income),
      });
    } catch (caught) {
      showToast(errorMessage(caught));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PeriodNavigator />

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 className="section-title">{en.income.total}</h2>
          <p className="ml-auto min-w-0 text-right text-2xl font-medium tracking-[-0.01em] wrap-anywhere text-income tabular-nums">
            {formatMoney(totalIncome(incomes, period))}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus aria-hidden className="size-5" />
          {en.income.add}
        </Button>
      </Card>

      {entries.length > 0 ? (
        <IncomeList incomes={entries} onEdit={openEdit} onDelete={(income) => void remove(income)} />
      ) : (
        <EmptyState icon={Wallet} title={en.income.emptyTitle} body={en.income.emptyBody} />
      )}

      <Sheet
        open={formOpen}
        title={editing ? en.income.editTitle : en.income.add}
        onClose={() => setFormOpen(false)}
      >
        <IncomeForm income={editing} onDone={() => setFormOpen(false)} />
      </Sheet>
    </div>
  );
}
