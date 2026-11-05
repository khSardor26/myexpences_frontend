import { describe, expect, it } from 'vitest';
import { formatDayLabel, formatShortDate, parseISODate, toISODate } from '@/lib/dates';

describe('date helpers', () => {
  it('round-trips a calendar day without shifting it', () => {
    for (const iso of ['2026-11-05', '2026-01-01', '2026-12-31', '2028-02-29']) {
      expect(toISODate(parseISODate(iso))).toBe(iso);
    }
  });

  it('formats a short date', () => {
    expect(formatShortDate('2026-11-05')).toBe('Nov 5');
  });

  it('labels today and yesterday, and other days by name', () => {
    const today = new Date(2026, 10, 5, 23, 30);
    expect(formatDayLabel('2026-11-05', today)).toBe('Today');
    expect(formatDayLabel('2026-11-04', today)).toBe('Yesterday');
    expect(formatDayLabel('2026-11-03', today)).toBe('Tue, Nov 3');
  });

  it('finds yesterday across a month boundary', () => {
    expect(formatDayLabel('2026-10-31', new Date(2026, 10, 1))).toBe('Yesterday');
  });
});
