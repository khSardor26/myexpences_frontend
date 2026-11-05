import { describe, expect, it } from 'vitest';
import { formatDayLabel, getPeriod } from '@/lib/dates';
import { includingChosen } from '@/lib/expenses';
import { filterExpenses, GENERAL_ITEM, groupByDay } from '@/lib/history';
import type { Expense } from '@/lib/types';

const november = getPeriod('2026-11-05', 'month', { weekStartsOn: 1, monthStartDay: 1 });

const expense = (id: string, fields: Partial<Expense> = {}): Expense => ({
  id,
  amount: 100,
  categoryId: 'groceries',
  date: '2026-11-05',
  createdAt: '2026-11-05T09:00:00+00:00',
  ...fields,
});

const list = [
  expense('chicken', { itemId: 'chicken', note: 'From the Market' }),
  expense('general', { note: 'corner shop' }),
  expense('taxi', { categoryId: 'transport', itemId: 'taxi' }),
  expense('first-day', { date: '2026-11-01' }),
  expense('last-day', { date: '2026-11-30' }),
  expense('october', { date: '2026-10-31' }),
  expense('december', { date: '2026-12-01' }),
];

const ids = (filters: Parameters<typeof filterExpenses>[1]) =>
  filterExpenses(list, filters).map((entry) => entry.id);

describe('filterExpenses', () => {
  it('returns everything with no filters', () => {
    expect(ids({})).toHaveLength(list.length);
  });

  it('treats empty filter values as no filter', () => {
    expect(ids({ categoryId: '', itemId: '', search: '   ' })).toHaveLength(list.length);
  });

  it('filters by period, including both end days', () => {
    expect(ids({ period: november })).toEqual(['chicken', 'general', 'taxi', 'first-day', 'last-day']);
  });

  it('filters by category', () => {
    expect(ids({ categoryId: 'transport' })).toEqual(['taxi']);
  });

  it('filters by item', () => {
    expect(ids({ itemId: 'chicken' })).toEqual(['chicken']);
  });

  it('finds expenses with no item using General', () => {
    expect(ids({ categoryId: 'groceries', itemId: GENERAL_ITEM })).toEqual([
      'general',
      'first-day',
      'last-day',
      'october',
      'december',
    ]);
  });

  it('searches notes ignoring case and surrounding spaces', () => {
    expect(ids({ search: ' MARKET ' })).toEqual(['chicken']);
    expect(ids({ search: 'shop' })).toEqual(['general']);
  });

  it('leaves out expenses with no note when searching', () => {
    expect(ids({ search: 'taxi' })).toEqual([]);
  });

  it('combines filters', () => {
    expect(ids({ period: november, categoryId: 'groceries', search: 'market' })).toEqual(['chicken']);
    expect(ids({ period: november, categoryId: 'transport', search: 'market' })).toEqual([]);
  });
});

describe('groupByDay', () => {
  it('is empty with no expenses', () => {
    expect(groupByDay([])).toEqual([]);
  });

  it('puts the newest day first and totals each day', () => {
    const groups = groupByDay([
      expense('a', { date: '2026-11-03', amount: 1_000 }),
      expense('b', { date: '2026-11-05', amount: 25_000 }),
      expense('c', { date: '2026-11-05', amount: 60_000 }),
      expense('d', { date: '2025-12-31', amount: 5 }),
    ]);
    expect(groups.map((group) => [group.date, group.total])).toEqual([
      ['2026-11-05', 85_000],
      ['2026-11-03', 1_000],
      ['2025-12-31', 5],
    ]);
  });

  it('puts the most recently added first within a day', () => {
    const [group] = groupByDay([
      expense('morning', { createdAt: '2026-11-05T08:00:00+00:00' }),
      expense('evening', { createdAt: '2026-11-05T18:00:00+00:00' }),
      expense('noon', { createdAt: '2026-11-05T12:00:00+00:00' }),
    ]);
    expect(group?.expenses.map((entry) => entry.id)).toEqual(['evening', 'noon', 'morning']);
  });

  it('does not reorder the list it was given', () => {
    const original = [expense('a', { date: '2026-11-01' }), expense('b', { date: '2026-11-02' })];
    groupByDay(original);
    expect(original.map((entry) => entry.id)).toEqual(['a', 'b']);
  });
});

describe('includingChosen', () => {
  const all = [{ id: 'active' }, { id: 'archived' }];
  const active = [{ id: 'active' }];

  it('adds the chosen entry if it is archived', () => {
    expect(includingChosen(active, all, 'archived').map((entry) => entry.id)).toEqual(['active', 'archived']);
  });

  it('changes nothing otherwise', () => {
    expect(includingChosen(active, all, 'active')).toBe(active);
    expect(includingChosen(active, all, undefined)).toBe(active);
    expect(includingChosen(active, all, 'missing')).toBe(active);
  });
});

describe('formatDayLabel', () => {
  const today = new Date(2026, 10, 5);

  it('shows the year only for another year', () => {
    expect(formatDayLabel('2026-03-02', today)).toBe('Mon, Mar 2');
    expect(formatDayLabel('2025-11-05', today)).toBe('Wed, Nov 5, 2025');
  });
});
