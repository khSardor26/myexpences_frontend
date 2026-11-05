import { Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { en } from '@/i18n/en';
import { formatShortDate } from '@/lib/dates';
import type { Income } from '@/lib/types';
import { useFormatMoney } from '@/store/useAppStore';

interface IncomeListProps {
  incomes: Income[];
  onEdit: (income: Income) => void;
  onDelete: (income: Income) => void;
}

export function IncomeList({ incomes, onEdit, onDelete }: IncomeListProps) {
  const formatMoney = useFormatMoney();

  return (
    <Card flush>
      <ul className="divide-y divide-line">
        {incomes.map((income) => (
          <li key={income.id} className="flex items-center">
            <button
              type="button"
              onClick={() => onEdit(income)}
              className="flex min-h-14 min-w-0 flex-1 flex-col justify-center gap-0.5 py-2 pl-4 text-left hover:bg-primary-soft"
            >
              <span className="sr-only">{en.common.edit} </span>
              <span className="flex flex-wrap justify-between gap-x-3">
                <span className="min-w-0 font-medium wrap-anywhere">{income.source}</span>
                <span className="ml-auto text-right font-semibold wrap-anywhere text-income tabular-nums">
                  {formatMoney(income.amount)}
                </span>
              </span>
              <span className="font-mono text-xs wrap-anywhere text-muted">
                {formatShortDate(income.date)}
                {income.note && ` · ${income.note}`}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(income)}
              aria-label={en.income.deleteEntry(income.source, formatMoney(income.amount))}
              className="mx-1 flex size-tap shrink-0 items-center justify-center rounded-control text-muted hover:bg-primary-soft"
            >
              <Trash2 aria-hidden className="size-5" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
