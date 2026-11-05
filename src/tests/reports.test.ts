import { describe, expect, it } from 'vitest';
import { getPeriod, shiftPeriod, type PeriodOptions } from '@/lib/dates';
import { averageDailyBudget, compareCategories, dailySpending, daysInPeriod, topItems } from '@/lib/reports';
import type { Expense } from '@/lib/types';

const options: PeriodOptions = { weekStartsOn: 1, monthStartDay: 1 };
const november = getPeriod('2026-11-05', 'month', options);
const october = shiftPeriod(november, -1, options);

let nextId = 0;
const expense = (amount: number, date: string, categoryId = 'groceries', itemId?: string): Expense => ({
  id: `e-${nextId++}`,
  amount,
  categoryId,
  itemId,
  date,
  createdAt: `${date}T09:00:00+00:00`,
});

describe('daysInPeriod', () => {
  it('counts every kind of period', () => {
    expect(daysInPeriod(november)).toBe(30);
    expect(daysInPeriod(getPeriod('2026-11-05', 'week', options))).toBe(7);
    expect(daysInPeriod(getPeriod('2028-02-10', 'month', options))).toBe(29);
    expect(daysInPeriod(getPeriod('2027-02-10', 'month', options))).toBe(28);
    expect(daysInPeriod(getPeriod('2026-11-15', 'month', { ...options, monthStartDay: 10 }))).toBe(30);
  });
});

describe('dailySpending', () => {
  it('has one entry for every day, in order, including empty days', () => {
    const days = dailySpending([], november);
    expect(days).toHaveLength(30);
    expect(days[0]).toEqual({ date: '2026-11-01', total: 0 });
    expect(days[29]).toEqual({ date: '2026-11-30', total: 0 });
  });

  it('adds up each day and ignores other periods', () => {
    const days = dailySpending(
      [expense(25_000, '2026-11-05'), expense(60_000, '2026-11-05'), expense(1, '2026-11-30'), expense(999, '2026-12-01')],
      november,
    );
    expect(days[4]).toEqual({ date: '2026-11-05', total: 85_000 });
    expect(days[29]?.total).toBe(1);
    expect(days.reduce((sum, day) => sum + day.total, 0)).toBe(85_001);
  });

  it('crosses a month boundary when the month starts on the 10th', () => {
    const period = getPeriod('2026-11-15', 'month', { ...options, monthStartDay: 10 });
    const days = dailySpending([], period);
    expect(days[0]?.date).toBe('2026-11-10');
    expect(days.at(-1)?.date).toBe('2026-12-09');
  });

  it('includes Feb 29 in a leap year', () => {
    const days = dailySpending([], getPeriod('2028-02-10', 'month', options));
    expect(days.map((day) => day.date)).toContain('2028-02-29');
  });
});

describe('averageDailyBudget', () => {
  it('divides income by the days in the period, rounding down', () => {
    expect(averageDailyBudget(5_000_000, november)).toBe(166_666);
    expect(averageDailyBudget(700, getPeriod('2026-11-05', 'week', options))).toBe(100);
  });

  it('is 0 with no income', () => {
    expect(averageDailyBudget(0, november)).toBe(0);
  });
});

describe('compareCategories', () => {
  it('shows increases, decreases and categories in only one period, biggest change first', () => {
    const expenses = [
      expense(100_000, '2026-11-05', 'groceries'),
      expense(60_000, '2026-10-05', 'groceries'),
      expense(10_000, '2026-11-05', 'transport'),
      expense(30_000, '2026-10-05', 'transport'),
      expense(5_000, '2026-11-05', 'gifts'),
      expense(50_000, '2026-10-05', 'health'),
    ];
    expect(compareCategories(expenses, november, october)).toEqual([
      { categoryId: 'health', current: 0, previous: 50_000, change: -50_000 },
      { categoryId: 'groceries', current: 100_000, previous: 60_000, change: 40_000 },
      { categoryId: 'transport', current: 10_000, previous: 30_000, change: -20_000 },
      { categoryId: 'gifts', current: 5_000, previous: 0, change: 5_000 },
    ]);
  });

  it('keeps categories with no change', () => {
    const expenses = [expense(100, '2026-11-05'), expense(100, '2026-10-05')];
    expect(compareCategories(expenses, november, october)).toEqual([
      { categoryId: 'groceries', current: 100, previous: 100, change: 0 },
    ]);
  });

  it('is empty with no spending in either period', () => {
    expect(compareCategories([expense(1, '2026-01-01')], november, october)).toEqual([]);
  });
});

describe('topItems', () => {
  it('adds up each item, largest first, for this period only', () => {
    const expenses = [
      expense(25_000, '2026-11-01', 'groceries', 'macaroni'),
      expense(60_000, '2026-11-02', 'groceries', 'chicken'),
      expense(40_000, '2026-11-03', 'groceries', 'macaroni'),
      expense(999_999, '2026-10-31', 'home', 'rent'),
    ];
    expect(topItems(expenses, november)).toEqual([
      { categoryId: 'groceries', itemId: 'macaroni', total: 65_000 },
      { categoryId: 'groceries', itemId: 'chicken', total: 60_000 },
    ]);
  });

  it('keeps General separate per category', () => {
    const expenses = [expense(10, '2026-11-01', 'a'), expense(20, '2026-11-01', 'b')];
    expect(topItems(expenses, november)).toEqual([
      { categoryId: 'b', itemId: null, total: 20 },
      { categoryId: 'a', itemId: null, total: 10 },
    ]);
  });

  it('stops at 5', () => {
    const expenses = ['a', 'b', 'c', 'd', 'e', 'f'].map((item, index) =>
      expense(index + 1, '2026-11-01', 'groceries', item),
    );
    expect(topItems(expenses, november).map((entry) => entry.itemId)).toEqual(['f', 'e', 'd', 'c', 'b']);
  });
});
