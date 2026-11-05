import { describe, expect, it } from 'vitest';
import {
  daysLeft,
  percentUsed,
  remaining,
  safeToSpendToday,
  spentToday,
  totalIncome,
  totalsByCategory,
  totalsByItem,
  totalSpent,
} from '@/lib/calc';
import { getPeriod, type PeriodOptions } from '@/lib/dates';
import type { Expense, Income } from '@/lib/types';

const defaults: PeriodOptions = { weekStartsOn: 1, monthStartDay: 1 };
const november = getPeriod('2026-11-05', 'month', defaults);
const TODAY = '2026-11-05';

let nextId = 0;
const income = (amount: number, date: string): Income => ({
  id: `income-${nextId++}`,
  amount,
  source: 'Salary',
  date,
  createdAt: `${date}T09:00:00.000Z`,
});
const expense = (amount: number, date: string, categoryId = 'groceries', itemId?: string): Expense => ({
  id: `expense-${nextId++}`,
  amount,
  categoryId,
  itemId,
  date,
  createdAt: `${date}T09:00:00.000Z`,
});

describe('totalIncome and totalSpent', () => {
  it('sums only entries inside the period, including both end days', () => {
    const incomes = [
      income(5_000_000, '2026-11-01'),
      income(300_000, '2026-11-30'),
      income(999, '2026-10-31'),
      income(999, '2026-12-01'),
    ];
    const expenses = [
      expense(25_000, '2026-11-01'),
      expense(60_000, '2026-11-30'),
      expense(999, '2026-10-31'),
      expense(999, '2026-12-01'),
    ];
    expect(totalIncome(incomes, november)).toBe(5_300_000);
    expect(totalSpent(expenses, november)).toBe(85_000);
  });

  it('is 0 with no entries', () => {
    expect(totalIncome([], november)).toBe(0);
    expect(totalSpent([], november)).toBe(0);
  });

  it('uses the month start day: the 9th and 10th land in different periods', () => {
    const options = { ...defaults, monthStartDay: 10 };
    const period = getPeriod('2026-11-15', 'month', options);
    const expenses = [expense(1_000, '2026-11-09'), expense(2_000, '2026-11-10'), expense(4_000, '2026-12-09')];
    expect(totalSpent(expenses, period)).toBe(6_000);
  });

  it('uses Monday as the week start: Sunday and Monday land in different weeks', () => {
    const week = getPeriod('2026-11-05', 'week', defaults);
    const expenses = [expense(1_000, '2026-11-01'), expense(2_000, '2026-11-02'), expense(4_000, '2026-11-08')];
    expect(totalSpent(expenses, week)).toBe(6_000);
  });

  it('counts Feb 29 in a leap year', () => {
    const february = getPeriod('2028-02-29', 'month', defaults);
    expect(totalSpent([expense(7_000, '2028-02-29'), expense(1, '2028-03-01')], february)).toBe(7_000);
  });
});

describe('remaining', () => {
  it('subtracts spending from income', () => {
    expect(remaining(5_000_000, 85_000)).toBe(4_915_000);
  });

  it('can be negative', () => {
    expect(remaining(100_000, 150_000)).toBe(-50_000);
  });

  it('is negative when there is spending but no income', () => {
    expect(remaining(0, 20_000)).toBe(-20_000);
  });
});

describe('percentUsed', () => {
  it('is spending divided by income', () => {
    expect(percentUsed(200_000, 50_000)).toBe(0.25);
  });

  it('is 0 with no income, even if there is spending', () => {
    expect(percentUsed(0, 0)).toBe(0);
    expect(percentUsed(0, 20_000)).toBe(0);
  });

  it('goes above 1 when over budget', () => {
    expect(percentUsed(100_000, 150_000)).toBe(1.5);
  });
});

describe('daysLeft', () => {
  it('counts today', () => {
    expect(daysLeft(november, TODAY)).toBe(26);
  });

  it('is 1 on the last day and the full length on the first', () => {
    expect(daysLeft(november, '2026-11-30')).toBe(1);
    expect(daysLeft(november, '2026-11-01')).toBe(30);
  });

  it('is 0 once the period is over', () => {
    expect(daysLeft(november, '2026-12-01')).toBe(0);
  });

  it('counts Feb 29 in a leap year', () => {
    expect(daysLeft(getPeriod('2028-02-01', 'month', defaults), '2028-02-01')).toBe(29);
    expect(daysLeft(getPeriod('2027-02-01', 'month', defaults), '2027-02-01')).toBe(28);
  });

  it('counts across a month boundary when the month starts on the 10th', () => {
    const period = getPeriod('2026-11-15', 'month', { ...defaults, monthStartDay: 10 });
    expect(daysLeft(period, '2026-11-30')).toBe(10); // Nov 30 + Dec 1-9
  });

  it('counts within a week', () => {
    expect(daysLeft(getPeriod(TODAY, 'week', defaults), TODAY)).toBe(4); // Thu to Sun
  });
});

describe('safeToSpendToday', () => {
  it('matches the acceptance scenario', () => {
    expect(safeToSpendToday(4_915_000, november, TODAY)).toBe(189_038);
  });

  it('rounds down', () => {
    expect(safeToSpendToday(100, november, '2026-11-28')).toBe(33);
  });

  it('is all of what remains on the last day', () => {
    expect(safeToSpendToday(50_000, november, '2026-11-30')).toBe(50_000);
  });

  it('is 0, not negative, when over budget', () => {
    expect(safeToSpendToday(-50_000, november, TODAY)).toBe(0);
  });

  it('is 0 with no income', () => {
    expect(safeToSpendToday(remaining(0, 0), november, TODAY)).toBe(0);
  });

  it('is null for a past or future period', () => {
    expect(safeToSpendToday(100_000, november, '2026-12-01')).toBeNull();
    expect(safeToSpendToday(100_000, november, '2026-10-31')).toBeNull();
  });
});

describe('spentToday', () => {
  it('counts only today', () => {
    const expenses = [expense(25_000, TODAY), expense(60_000, TODAY), expense(999, '2026-11-04')];
    expect(spentToday(expenses, TODAY)).toBe(85_000);
  });

  it('is 0 with nothing spent today', () => {
    expect(spentToday([expense(999, '2026-11-04')], TODAY)).toBe(0);
  });
});

describe('totalsByCategory', () => {
  it('groups by category, largest first, for this period only', () => {
    const expenses = [
      expense(10_000, TODAY, 'transport'),
      expense(25_000, TODAY, 'groceries'),
      expense(60_000, TODAY, 'groceries'),
      expense(999, '2026-10-31', 'health'),
    ];
    expect(totalsByCategory(expenses, november)).toEqual([
      { categoryId: 'groceries', total: 85_000 },
      { categoryId: 'transport', total: 10_000 },
    ]);
  });
});

describe('totalsByItem', () => {
  it('matches the acceptance scenario', () => {
    const expenses = [
      expense(25_000, TODAY, 'groceries', 'macaroni'),
      expense(60_000, TODAY, 'groceries', 'chicken'),
      expense(999, TODAY, 'transport', 'taxi'),
    ];
    expect(totalsByItem(expenses, november, 'groceries')).toEqual([
      { itemId: 'chicken', total: 60_000 },
      { itemId: 'macaroni', total: 25_000 },
    ]);
  });

  it('adds up repeat items and uses null for expenses with no item', () => {
    const expenses = [
      expense(1_000, TODAY, 'groceries', 'bread'),
      expense(2_000, TODAY, 'groceries', 'bread'),
      expense(5_000, TODAY, 'groceries'),
      expense(999, '2026-12-01', 'groceries'),
    ];
    expect(totalsByItem(expenses, november, 'groceries')).toEqual([
      { itemId: null, total: 5_000 },
      { itemId: 'bread', total: 3_000 },
    ]);
  });
});
