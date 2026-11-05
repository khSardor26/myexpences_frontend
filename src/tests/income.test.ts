import { describe, expect, it } from 'vitest';
import { getPeriod } from '@/lib/dates';
import { findSource, incomesInPeriod } from '@/lib/income';
import type { Income } from '@/lib/types';

const november = getPeriod('2026-11-05', 'month', { weekStartsOn: 1, monthStartDay: 1 });

const income = (id: string, date: string, createdAt = `${date}T09:00:00+00:00`): Income => ({
  id,
  amount: 100,
  source: 'Salary',
  date,
  createdAt,
});

describe('incomesInPeriod', () => {
  it('keeps entries inside the period, including both end days', () => {
    const entries = [
      income('before', '2026-10-31'),
      income('first', '2026-11-01'),
      income('last', '2026-11-30'),
      income('after', '2026-12-01'),
    ];
    expect(incomesInPeriod(entries, november).map((entry) => entry.id)).toEqual(['last', 'first']);
  });

  it('puts the newest date first, then the most recently added', () => {
    const entries = [
      income('older', '2026-11-01'),
      income('morning', '2026-11-05', '2026-11-05T09:00:00+00:00'),
      income('evening', '2026-11-05', '2026-11-05T18:00:00+00:00'),
    ];
    expect(incomesInPeriod(entries, november).map((entry) => entry.id)).toEqual([
      'evening',
      'morning',
      'older',
    ]);
  });

  it('does not reorder the list it was given', () => {
    const entries = [income('a', '2026-11-01'), income('b', '2026-11-05')];
    incomesInPeriod(entries, november);
    expect(entries.map((entry) => entry.id)).toEqual(['a', 'b']);
  });
});

describe('findSource', () => {
  const sources = ['Salary', 'Freelance'];

  it('matches ignoring case and surrounding spaces', () => {
    expect(findSource(sources, '  salary ')).toBe('Salary');
  });

  it('returns undefined when there is no match', () => {
    expect(findSource(sources, 'Rent')).toBeUndefined();
  });
});
