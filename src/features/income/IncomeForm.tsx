import { useState, type FormEvent } from 'react';
import { AmountField } from '@/components/ui/AmountField';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import { formatShortDate, todayISO } from '@/lib/dates';
import { amountToInput, parseAmountInput } from '@/lib/money';
import type { Income } from '@/lib/types';
import { useToastStore } from '@/store/toastStore';
import { useAppData, useAppStore, useFormatMoney } from '@/store/useAppStore';
import { SourcePicker } from './SourcePicker';

interface IncomeFormProps {
  /** The entry to edit. Leave out to add a new one. */
  income?: Income;
  onDone: () => void;
}

export function IncomeForm({ income, onDone }: IncomeFormProps) {
  const { settings, incomeSources } = useAppData();
  const { currency } = settings;
  const addIncome = useAppStore((state) => state.addIncome);
  const updateIncome = useAppStore((state) => state.updateIncome);
  const showToast = useToastStore((state) => state.showToast);
  const formatMoney = useFormatMoney();

  const [amountText, setAmountText] = useState(income ? amountToInput(income.amount, currency) : '');
  const [source, setSource] = useState(income?.source ?? incomeSources[0] ?? '');
  const [date, setDate] = useState(income?.date ?? todayISO());
  const [note, setNote] = useState(income?.note ?? '');

  const [amountError, setAmountError] = useState<string>();
  const [dateError, setDateError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const amount = parseAmountInput(amountText, currency);
    setAmountError(amount === null ? en.income.amountRequired : undefined);
    setDateError(date ? undefined : en.income.dateRequired);
    setFormError(source ? null : en.income.sourceRequired);
    if (amount === null || !date || !source) return;

    const fields = { amount, source, date, note: note.trim() || undefined };

    setSaving(true);
    try {
      if (income) await updateIncome(income.id, fields);
      else await addIncome(fields);
      showToast(en.income.saved(formatMoney(amount), source, formatShortDate(date)));
      onDone();
    } catch (caught) {
      setFormError(errorMessage(caught));
      setSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <AmountField
        label={en.income.amount}
        value={amountText}
        currency={currency}
        error={amountError}
        onChange={(text) => {
          setAmountText(text);
          setAmountError(undefined);
        }}
      />
      <SourcePicker value={source} onChange={setSource} />
      <TextField
        label={en.income.date}
        type="date"
        value={date}
        error={dateError}
        onChange={(event) => {
          setDate(event.target.value);
          setDateError(undefined);
        }}
      />
      <TextField
        label={en.income.note}
        maxLength={1000}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />

      {formError && (
        <p role="alert" className="rounded-control border border-warning p-3">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={saving} className="disabled:opacity-60">
        {en.common.save}
      </Button>
    </form>
  );
}
