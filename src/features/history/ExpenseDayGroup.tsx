import { Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { en } from '@/i18n/en';
import { formatDayLabel } from '@/lib/dates';
import type { DayGroup } from '@/lib/history';
import type { Expense } from '@/lib/types';
import { useAppData, useFormatMoney } from '@/store/useAppStore';

interface ExpenseRowProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

function ExpenseRow({ expense, onEdit, onDelete }: ExpenseRowProps) {
  const { categories, items } = useAppData();
  const formatMoney = useFormatMoney();

  const category = categories.find((entry) => entry.id === expense.categoryId);
  const itemName = items.find((entry) => entry.id === expense.itemId)?.name ?? en.expense.general;
  const name = `${category?.name ?? ''} → ${itemName}`;
  const details = [expense.quantity, expense.note].filter(Boolean).join(' · ');

  return (
    <li className="flex items-center">
      <button
        type="button"
        onClick={() => onEdit(expense)}
        className="flex min-h-14 min-w-0 flex-1 items-center gap-2 py-2 pl-4 text-left hover:bg-primary-soft"
      >
        <span className="sr-only">{en.common.edit} </span>
        <span aria-hidden className="w-6 shrink-0 text-center">
          {category?.icon}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap justify-between gap-x-3">
            <span className="min-w-0 font-medium wrap-anywhere">{name}</span>
            <span className="ml-auto text-right font-semibold wrap-anywhere tabular-nums">
              {formatMoney(expense.amount)}
            </span>
          </span>
          {details && <span className="text-sm wrap-anywhere text-muted">{details}</span>}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onDelete(expense)}
        aria-label={en.history.deleteEntry(name, formatMoney(expense.amount))}
        className="mx-1 flex size-tap shrink-0 items-center justify-center rounded-control text-muted hover:bg-primary-soft"
      >
        <Trash2 aria-hidden className="size-5" />
      </button>
    </li>
  );
}

interface ExpenseDayGroupProps {
  group: DayGroup;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseDayGroup({ group, onEdit, onDelete }: ExpenseDayGroupProps) {
  const formatMoney = useFormatMoney();

  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-mono text-xs font-normal text-muted">{formatDayLabel(group.date)}</span>
        <span className="ml-auto text-right font-medium wrap-anywhere tabular-nums">
          {formatMoney(group.total)}
        </span>
      </h2>
      <Card flush>
        <ul className="divide-y divide-line">
          {group.expenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      </Card>
    </section>
  );
}
