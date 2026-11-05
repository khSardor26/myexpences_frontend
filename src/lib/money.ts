export interface Currency {
  code: string;
  symbol: string;
  decimals: number;
}

export const DEFAULT_CURRENCY: Currency = { code: 'UZS', symbol: "so'm", decimals: 0 };

/** Non-breaking, so an amount never wraps onto two lines. */
const SPACE = ' ';
const MINUS = '−';

/**
 * The most one entry can be, in the smallest unit (same limit as the API). It leaves
 * room for totals to stay within what JavaScript can hold exactly.
 */
export const MAX_AMOUNT = 10_000_000_000_000;

const groupThousands =(digits: string) => digits.replace(/\B(?=(\d{3})+$)/g, SPACE);

/**
 * The only place money becomes text.
 * `amount` is an integer count of the currency's smallest unit, so with
 * decimals: 2, the value 12345 displays as 123.45.
 */
export function formatMoney(amount: number, currency: Currency = DEFAULT_CURRENCY): string {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`Money amounts must be integers, got ${amount}`);
  }

  const unit = 10 ** currency.decimals;
  const absolute = Math.abs(amount);
  const whole = groupThousands(String(Math.floor(absolute / unit)));
  const fraction =
    currency.decimals > 0 ? `.${String(absolute % unit).padStart(currency.decimals, '0')}` : '';
  const sign = amount < 0 ? MINUS : '';

  return `${sign}${whole}${fraction}${SPACE}${currency.symbol}`;
}

/** Splits typed or pasted text into whole and fraction digits, dropping anything else. */
function splitAmountText(text: string, currency: Currency): { whole: string; fraction: string | null } {
  const onlyDigits = (value: string) => value.replace(/\D/g, '');
  const separators = text.match(/[.,]/g) ?? [];

  // "1,250,000" repeats its separator, so that separator groups thousands.
  const decimalSeparator = separators.at(-1);
  const isGrouping = separators.filter((separator) => separator === decimalSeparator).length > 1;

  if (currency.decimals === 0 || !decimalSeparator || isGrouping) {
    return { whole: onlyDigits(text), fraction: null };
  }

  const position = text.lastIndexOf(decimalSeparator);
  return {
    whole: onlyDigits(text.slice(0, position)),
    fraction: onlyDigits(text.slice(position + 1)).slice(0, currency.decimals),
  };
}

/** Live formatting for an amount field: "1250000" becomes "1 250 000". */
export function formatAmountInput(text: string, currency: Currency): string {
  const { whole, fraction } = splitAmountText(text, currency);
  const grouped = groupThousands(whole.replace(/^0+(?=\d)/, ''));
  return fraction === null ? grouped : `${grouped || '0'}.${fraction}`;
}

/** Reads an amount field as an integer in the smallest unit. Null unless it's a valid positive amount. */
export function parseAmountInput(text: string, currency: Currency): number | null {
  const { whole, fraction } = splitAmountText(text, currency);
  if (!whole && !fraction) return null;

  // Built from digits rather than multiplied, so there is never a floating-point step.
  const amount = Number(`${whole}${(fraction ?? '').padEnd(currency.decimals, '0')}`);
  return amount > 0 && amount <= MAX_AMOUNT ? amount : null;
}

/** An existing amount as an amount field's text, for editing. */
export function amountToInput(amount: number, currency: Currency): string {
  const digits = String(amount).padStart(currency.decimals + 1, '0');
  if (currency.decimals === 0) return groupThousands(digits);
  const split = digits.length - currency.decimals;
  return `${groupThousands(digits.slice(0, split))}.${digits.slice(split)}`;
}
