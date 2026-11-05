import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { useToastStore } from '@/store/toastStore';
import { useAppData, useAppStore } from '@/store/useAppStore';

const DECIMALS = [0, 1, 2, 3, 4];

export function CurrencyCard() {
  const { settings, incomes, expenses } = useAppData();
  const updateSettings = useAppStore((state) => state.updateSettings);
  const showToast = useToastStore((state) => state.showToast);

  const [code, setCode] = useState(settings.currency.code);
  const [symbol, setSymbol] = useState(settings.currency.symbol);
  const [decimals, setDecimals] = useState(settings.currency.decimals);
  const [error, setError] = useState<string | null>(null);

  const draft = { code: code.trim(), symbol: symbol.trim(), decimals };
  const current = settings.currency;
  const changed = draft.code !== current.code || draft.symbol !== current.symbol || decimals !== current.decimals;

  // Amounts are stored as whole numbers of the smallest unit, so they don't convert.
  const sample = expenses[0]?.amount ?? incomes[0]?.amount;
  const showDecimalsWarning = decimals !== current.decimals && sample !== undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.code || !draft.symbol) {
      setError(en.settings.currencyRequired);
      return;
    }

    setError(null);
    try {
      await updateSettings({ currency: draft });
      showToast(en.settings.currencySaved);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  return (
    <Card>
      <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        <h2 className="section-title">{en.settings.currency}</h2>

        <div className="grid grid-cols-3 gap-3">
          <TextField label={en.settings.currencyCode} maxLength={8} value={code} onChange={(event) => setCode(event.target.value)} />
          <TextField label={en.settings.currencySymbol} maxLength={8} value={symbol} onChange={(event) => setSymbol(event.target.value)} />
          <SelectField
            label={en.settings.currencyDecimals}
            value={decimals}
            onChange={(event) => setDecimals(Number(event.target.value))}
          >
            {DECIMALS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SelectField>
        </div>

        {showDecimalsWarning && (
          <p role="status" className="rounded-control border border-warning p-3 text-sm">
            {en.settings.decimalsWarning(formatMoney(sample, current), formatMoney(sample, draft))}
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-control border border-warning p-3">
            {error}
          </p>
        )}

        <Button type="submit" variant="secondary" disabled={!changed} className="disabled:opacity-60">
          {en.settings.saveCurrency}
        </Button>
      </form>
    </Card>
  );
}
