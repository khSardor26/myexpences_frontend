import { describe, expect, it } from 'vitest';
import { formatMoney, type Currency } from '@/lib/money';

/** Tests read as plain text; the output uses non-breaking spaces. */
const display = (text: string) => text.replaceAll(' ', ' ');

const usd: Currency = { code: 'USD', symbol: '$', decimals: 2 };

describe('formatMoney', () => {
  it('groups thousands with spaces in the default currency', () => {
    expect(display(formatMoney(1250000))).toBe("1 250 000 so'm");
    expect(display(formatMoney(25000))).toBe("25 000 so'm");
    expect(display(formatMoney(999))).toBe("999 so'm");
    expect(display(formatMoney(1000))).toBe("1 000 so'm");
    expect(display(formatMoney(0))).toBe("0 so'm");
  });

  it('shows a minus sign for negative amounts', () => {
    expect(display(formatMoney(-85000))).toBe("−85 000 so'm");
  });

  it('never breaks an amount across lines', () => {
    expect(formatMoney(1250000)).not.toContain(' ');
  });

  it('treats amounts as the smallest unit when the currency has decimals', () => {
    expect(display(formatMoney(123456, usd))).toBe('1 234.56 $');
    expect(display(formatMoney(5, usd))).toBe('0.05 $');
    expect(display(formatMoney(-100, usd))).toBe('−1.00 $');
  });

  it('rejects non-integer amounts', () => {
    expect(() => formatMoney(10.5)).toThrow(RangeError);
    expect(() => formatMoney(Number.NaN)).toThrow(RangeError);
  });
});
