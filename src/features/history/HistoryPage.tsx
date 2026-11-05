import { History, Plus, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Sheet } from '@/components/ui/Sheet';
import { ExpenseForm } from '@/features/expenses/ExpenseForm';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import { filterExpenses, groupByDay } from '@/lib/history';
import type { Expense } from '@/lib/types';
import { useToastStore } from '@/store/toastStore';
import { useAppData, useAppStore, useFormatMoney, useSelectedPeriod } from '@/store/useAppStore';
import { ExpenseDayGroup } from './ExpenseDayGroup';
import { HistoryFilters, NO_FILTERS, type HistoryFilterValues } from './HistoryFilters';

export function HistoryPage() {
  const { expenses, categories, items } = useAppData();
  const period = useSelectedPeriod();
  const deleteExpense = useAppStore((state) => state.deleteExpense);
  const restoreExpense = useAppStore((state) => state.restoreExpense);
  const showToast = useToastStore((state) => state.showToast);
  const formatMoney = useFormatMoney();

  const [filters, setFilters] = useState<HistoryFilterValues>(NO_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | undefined>();

  const groups = useMemo(
    () =>
      groupByDay(
        filterExpenses(expenses, {
          period: filters.onlyPeriod ? period : undefined,
          categoryId: filters.categoryId,
          itemId: filters.itemId,
          search: filters.search,
        }),
      ),
    [expenses, filters, period],
  );

  const openAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setFormOpen(true);
  };

  const undoDelete = async (expense: Expense) => {
    try {
      await restoreExpense(expense);
    } catch (caught) {
      showToast(errorMessage(caught));
    }
  };

  const remove = async (expense: Expense) => {
    const categoryName = categories.find((entry) => entry.id === expense.categoryId)?.name ?? '';
    const itemName = items.find((entry) => entry.id === expense.itemId)?.name ?? en.expense.general;
    try {
      await deleteExpense(expense.id);
      showToast(en.history.deleted(formatMoney(expense.amount), categoryName, itemName), {
        label: en.common.undo,
        run: () => void undoDelete(expense),
      });
    } catch (caught) {
      showToast(errorMessage(caught));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {expenses.length === 0 ? (
        <EmptyState
          icon={History}
          title={en.history.emptyTitle}
          body={en.history.emptyBody}
          action={
            <Button onClick={openAdd}>
              <Plus aria-hidden className="size-5" />
              {en.expense.addTitle}
            </Button>
          }
        />
      ) : (
        <>
          <HistoryFilters values={filters} onChange={setFilters} />
          {groups.length === 0 ? (
            <EmptyState icon={SearchX} title={en.history.noMatchTitle} body={en.history.noMatchBody} />
          ) : (
            groups.map((group) => (
              <ExpenseDayGroup
                key={group.date}
                group={group}
                onEdit={openEdit}
                onDelete={(expense) => void remove(expense)}
              />
            ))
          )}
        </>
      )}

      <Sheet
        open={formOpen}
        title={editing ? en.expense.editTitle : en.expense.addTitle}
        onClose={() => setFormOpen(false)}
      >
        <ExpenseForm expense={editing} onDone={() => setFormOpen(false)} />
      </Sheet>
    </div>
  );
}
