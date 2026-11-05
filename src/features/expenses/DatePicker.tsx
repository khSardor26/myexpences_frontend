import { useState } from 'react';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { en } from '@/i18n/en';
import { formatShortDate, previousDay, todayISO } from '@/lib/dates';

interface DatePickerProps {
  value: string;
  error?: string;
  onChange: (date: string) => void;
}

/** Today and Yesterday are one tap. Pick opens the calendar field for any other day. */
export function DatePicker({ value, error, onChange }: DatePickerProps) {
  const today = todayISO();
  const yesterday = previousDay(today);
  const isQuickDate = value === today || value === yesterday;

  const [picking, setPicking] = useState(false);

  const chooseQuick = (date: string) => {
    setPicking(false);
    onChange(date);
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-medium">{en.expense.date}</legend>
      <div className="flex flex-wrap gap-2">
        <Chip selected={!picking && value === today} onClick={() => chooseQuick(today)}>
          {en.common.today}
        </Chip>
        <Chip selected={!picking && value === yesterday} onClick={() => chooseQuick(yesterday)}>
          {en.common.yesterday}
        </Chip>
        <Chip selected={picking || !isQuickDate} onClick={() => setPicking(true)}>
          <span aria-hidden>📅</span>
          {!isQuickDate && value ? formatShortDate(value) : en.expense.pickDate}
        </Chip>
      </div>

      {picking && (
        <TextField
          label={en.expense.pickDateLabel}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
