import { useState, type FormEvent } from 'react';
import { AmountField } from '@/components/ui/AmountField';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import { todayISO } from '@/lib/dates';
import { recentCombos } from '@/lib/expenses';
import { amountToInput, parseAmountInput } from '@/lib/money';
import type { Expense } from '@/lib/types';
import { useToastStore } from '@/store/toastStore';
import { useAppData, useAppStore, useFormatMoney } from '@/store/useAppStore';
import { CategoryPicker } from './CategoryPicker';
import { DatePicker } from './DatePicker';
import { ItemPicker } from './ItemPicker';
import { QuickCombos } from './QuickCombos';

/** Saves and closes, or saves and stays open for the next entry. */
type AfterSave = 'close' | 'addAnother';

interface ExpenseFormProps {
  /** The entry to edit. Leave out to add a new one. */
  expense?: Expense;
  onDone: () => void;
}

export function ExpenseForm({ expense, onDone }: ExpenseFormProps) {
  const { settings, categories, items, expenses } = useAppData();
  const { currency } = settings;
  const addExpense = useAppStore((state) => state.addExpense);
  const updateExpense = useAppStore((state) => state.updateExpense);
  const deleteExpense = useAppStore((state) => state.deleteExpense);
  const showToast = useToastStore((state) => state.showToast);
  const formatMoney = useFormatMoney();

  const [amountText, setAmountText] = useState(expense ? amountToInput(expense.amount, currency) : '');
  const [categoryId, setCategoryId] = useState(expense?.categoryId);
  const [itemId, setItemId] = useState(expense?.itemId);
  const [date, setDate] = useState(expense?.date ?? todayISO());
  const [quantity, setQuantity] = useState(expense?.quantity ?? '');
  const [note, setNote] = useState(expense?.note ?? '');

  const [amountError, setAmountError] = useState<string>();
  const [categoryError, setCategoryError] = useState<string>();
  const [dateError, setDateError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fixed while the form is open, so a shortcut doesn't move just after you save with it.
  const [combos] = useState(() => (expense ? [] : recentCombos(expenses, categories, items)));

  const chooseCategory = (id: string) => {
    if (id !== categoryId) setItemId(undefined);
    setCategoryId(id);
    setCategoryError(undefined);
  };

  const undoSave = async (created: Expense) => {
    try {
      await deleteExpense(created.id);
    } catch (caught) {
      showToast(errorMessage(caught));
    }
  };

  const save = async (afterSave: AfterSave) => {
    const amount = parseAmountInput(amountText, currency);
    setAmountError(amount === null ? en.expense.amountRequired : undefined);
    setCategoryError(categoryId ? undefined : en.expense.categoryRequired);
    setDateError(date ? undefined : en.expense.dateRequired);
    setFormError(null);
    if (amount === null || !categoryId || !date) return;

    const fields = {
      amount,
      categoryId,
      itemId,
      date,
      quantity: quantity.trim() || undefined,
      note: note.trim() || undefined,
    };
    const categoryName = categories.find((category) => category.id === categoryId)?.name ?? '';
    const itemName = items.find((item) => item.id === itemId)?.name ?? en.expense.general;
    const message = en.expense.saved(formatMoney(amount), categoryName, itemName);

    setSaving(true);
    try {
      if (expense) {
        await updateExpense(expense.id, fields);
        showToast(message);
        onDone();
        return;
      }

      const created = await addExpense(fields);
      showToast(message, { label: en.common.undo, run: () => void undoSave(created) });

      if (afterSave === 'close') {
        onDone();
        return;
      }

      // Ready for the next entry: same category and date, everything else cleared.
      setAmountText('');
      setItemId(undefined);
      setQuantity('');
      setNote('');
      setSaving(false);
      document.querySelector<HTMLElement>('dialog[open] [data-autofocus]')?.focus();
    } catch (caught) {
      setFormError(errorMessage(caught));
      setSaving(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save('close');
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <AmountField
        label={en.expense.amount}
        value={amountText}
        currency={currency}
        error={amountError}
        onChange={(text) => {
          setAmountText(text);
          setAmountError(undefined);
        }}
      />

      <QuickCombos
        combos={combos}
        categoryId={categoryId}
        itemId={itemId}
        onSelect={(combo) => {
          setCategoryId(combo.categoryId);
          setItemId(combo.itemId);
          setCategoryError(undefined);
        }}
      />

      <CategoryPicker value={categoryId} error={categoryError} onChange={chooseCategory} />

      {categoryId && <ItemPicker categoryId={categoryId} value={itemId} onChange={setItemId} />}

      <DatePicker
        value={date}
        error={dateError}
        onChange={(value) => {
          setDate(value);
          setDateError(undefined);
        }}
      />

      <details open={Boolean(expense?.quantity || expense?.note)}>
        <summary className="flex min-h-tap cursor-pointer items-center text-accent underline-offset-4 hover:underline">
          {en.expense.more}
        </summary>
        <div className="flex flex-col gap-4 pt-2">
          <TextField
            label={en.expense.quantity}
            hint={en.expense.quantityHint}
            maxLength={100}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <TextField
            label={en.expense.note}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      </details>

      {formError && (
        <p role="alert" className="rounded-control border border-warning p-3">
          {formError}
        </p>
      )}

      {/* Stays in view while the form scrolls, so saving is always one tap away. */}
      <div className="sticky bottom-0 flex gap-2 bg-surface py-2">
        <Button type="submit" disabled={saving} className="flex-1 disabled:opacity-60">
          {en.common.save}
        </Button>
        {!expense && (
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => void save('addAnother')}
            className="shrink-0 whitespace-nowrap disabled:opacity-60"
          >
            {en.expense.saveAndAddAnother}
          </Button>
        )}
      </div>
    </form>
  );
}
