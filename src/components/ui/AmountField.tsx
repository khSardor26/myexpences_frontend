import { useId, useLayoutEffect, useRef, type ChangeEvent } from 'react';
import { formatAmountInput, type Currency } from '@/lib/money';

interface AmountFieldProps {
  label: string;
  value: string;
  currency: Currency;
  error?: string;
  onChange: (value: string) => void;
}

/** Number of characters that aren't grouping spaces. */
const countTyped = (text: string) => text.replace(/\s/g, '').length;

/** Formatting adds and removes spaces, so put the caret back after the same character. */
function placeCaret(input: HTMLInputElement, typedBeforeCaret: number) {
  const { value } = input;
  let position = 0;
  for (let typed = 0; position < value.length && typed < typedBeforeCaret; position++) {
    if (!/\s/.test(value.charAt(position))) typed++;
  }
  input.setSelectionRange(position, position);
}

/** A large amount input, formatted as you type: 1250000 shows as 1 250 000. */
export function AmountField({ label, value, currency, error, onChange }: AmountFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const input = useRef<HTMLInputElement>(null);
  const typedBeforeCaret = useRef<number | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const element = event.target;
    const typed = countTyped(element.value.slice(0, element.selectionStart ?? element.value.length));
    const formatted = formatAmountInput(element.value, currency);

    // Nothing changes (say, only a grouping space was deleted), so no re-render will place the caret.
    if (formatted === value) {
      element.value = formatted;
      placeCaret(element, typed);
      return;
    }

    typedBeforeCaret.current = typed;
    onChange(formatted);
  };

  useLayoutEffect(() => {
    if (typedBeforeCaret.current === null || !input.current) return;
    placeCaret(input.current, typedBeforeCaret.current);
    typedBeforeCaret.current = null;
  }, [value]);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <div className="flex min-h-14 items-center gap-2 rounded-control border border-control bg-surface px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus)]">
        <input
          ref={input}
          id={id}
          data-autofocus
          type="text"
          inputMode={currency.decimals > 0 ? 'decimal' : 'numeric'}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={value}
          onChange={handleChange}
          className="w-full min-w-0 bg-transparent text-right text-2xl font-medium tabular-nums outline-none"
        />
        <span className="text-muted">{currency.symbol}</span>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
