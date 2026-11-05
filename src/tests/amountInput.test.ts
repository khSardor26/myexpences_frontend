import { describe, expect, it } from 'vitest';
import {
  amountToInput,
  DEFAULT_CURRENCY as uzs,
  formatAmountInput,
  MAX_AMOUNT,
  parseAmountInput,
  type Currency,
} from '@/lib/money';

const usd: Currency = { code: 'USD', symbol: '$', decimals: 2 };

/** Tests read as plain text; the output uses non-breaking spaces. */
const format = (text: string, currency: Currency = uzs) =>
  formatAmountInput(text, currency).replaceAll(' ', ' ');

describe('formatAmountInput', () => {
  it('groups thousands as you type', () => {
    expect(format('2')).toBe('2');
    expect(format('250')).toBe('250');
    expect(format('2500')).toBe('2 500');
    expect(format('1250000')).toBe('1 250 000');
  });

  it('copes with text that is already formatted', () => {
    expect(format('1 250 0000')).toBe('12 500 000');
    expect(format('1 250 000')).toBe('1 250 000');
  });

  it('drops anything that is not a number', () => {
    expect(format('12abc3')).toBe('123');
    expect(format('-500')).toBe('500');
    expect(format('')).toBe('');
  });

  it('removes leading zeros but allows a lone zero', () => {
    expect(format('007')).toBe('7');
    expect(format('0')).toBe('0');
  });

  it('reads pasted separators as grouping when the currency has no decimals', () => {
    expect(format('1,250,000')).toBe('1 250 000');
    expect(format('1.250.000')).toBe('1 250 000');
  });

  it('allows a fraction when the currency has decimals, up to its length', () => {
    expect(format('1234.5', usd)).toBe('1 234.5');
    expect(format('1234.', usd)).toBe('1 234.');
    expect(format('1234,56', usd)).toBe('1 234.56');
    expect(format('1234.567', usd)).toBe('1 234.56');
    expect(format('.5', usd)).toBe('0.5');
  });

  it('reads pasted grouped amounts correctly when the currency has decimals', () => {
    expect(format('1,250,000', usd)).toBe('1 250 000');
    expect(format('1,250.50', usd)).toBe('1 250.50');
  });
});

describe('parseAmountInput', () => {
  it('reads formatted text as an integer', () => {
    expect(parseAmountInput('1 250 000', uzs)).toBe(1_250_000);
    expect(parseAmountInput('25000', uzs)).toBe(25_000);
  });

  it('returns the smallest unit when the currency has decimals', () => {
    expect(parseAmountInput('12.5', usd)).toBe(1_250);
    expect(parseAmountInput('12.50', usd)).toBe(1_250);
    expect(parseAmountInput('12', usd)).toBe(1_200);
    expect(parseAmountInput('0.05', usd)).toBe(5);
  });

  it('never has floating-point errors', () => {
    expect(parseAmountInput('19.99', usd)).toBe(1_999); // 19.99 * 100 is 1998.9999999999998
    expect(parseAmountInput('1.1', usd)).toBe(110);
    expect(parseAmountInput('4.35', usd)).toBe(435);
  });

  it('returns null for nothing, zero or too much', () => {
    expect(parseAmountInput('', uzs)).toBeNull();
    expect(parseAmountInput('0', uzs)).toBeNull();
    expect(parseAmountInput('0.00', usd)).toBeNull();
    expect(parseAmountInput('abc', uzs)).toBeNull();
    expect(parseAmountInput('99999999999999999', uzs)).toBeNull();
  });

  it('accepts up to the maximum and no more', () => {
    expect(parseAmountInput(String(MAX_AMOUNT), uzs)).toBe(MAX_AMOUNT);
    expect(parseAmountInput(String(MAX_AMOUNT + 1), uzs)).toBeNull();
  });
});

describe('amountToInput', () => {
  it('turns a stored amount back into field text', () => {
    expect(amountToInput(1_250_000, uzs).replaceAll(' ', ' ')).toBe('1 250 000');
    expect(amountToInput(123_456, usd).replaceAll(' ', ' ')).toBe('1 234.56');
    expect(amountToInput(5, usd)).toBe('0.05');
  });

  it('round-trips through parseAmountInput', () => {
    for (const amount of [1, 99, 100, 1_999, 1_250_000]) {
      expect(parseAmountInput(amountToInput(amount, usd), usd)).toBe(amount);
      expect(parseAmountInput(amountToInput(amount, uzs), uzs)).toBe(amount);
    }
  });
});
