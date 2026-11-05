import { describe, expect, it } from 'vitest';
import { budgetLevel, sharePercent, summarizePeriod } from '@/lib/calc';
import { getPeriod } from '@/lib/dates';
import { recentExpenses } from '@/lib/expenses';
import type { Expense, Income } from '@/lib/types';

const november = getPeriod('2026-11-05', 'month', { weekStartsOn: 1, monthStartDay: 1 });
const TODAY = '2026-11-05';

const income = (amount: number, date: string): Income => ({
  id: `income-${amount}`,
  amount,
  source: 'Salary',
  date,
  createdAt: `${date}T09:00:00+00:00`,
});

const expense = (id: string, amount: number, date: string, createdAt = `${date}T09:00:00+00:00`): Expense => ({
  id,
  amount,
  categoryId: 'groceries',
  date,
  createdAt,
});

describe('budgetLevel', () => {
  it.each([
    [0, 'ok'],
    [69, 'ok'],
    [70, 'warning'],
    [90, 'warning'],
    [91, 'danger'],
    [100, 'danger'],
    [150, 'danger'],
  ])('%i of 100 spent is %s', (spent, level) => {
    expect(budgetLevel(100, spent)).toBe(level);
  });

  it('handles the exact edge just above 90%', () => {
    expect(budgetLevel(1_000, 900)).toBe('warning');
    expect(budgetLevel(1_000, 901)).toBe('danger');
  });

  it('is ok with nothing in or out', () => {
    expect(budgetLevel(0, 0)).toBe('ok');
  });

  it('is danger with spending but no income', () => {
    expect(budgetLevel(0, 1)).toBe('danger');
  });
});

describe('sharePercent', () => {
  it('rounds to a whole number', () => {
    expect(sharePercent(1, 3)).toBe(33);
    expect(sharePercent(2, 3)).toBe(67);
    expect(sharePercent(85_000, 85_000)).toBe(100);
  });

  it('is 0 when the whole is 0', () => {
    expect(sharePercent(5, 0)).toBe(0);
  });

  it('can go above 100', () => {
    expect(sharePercent(150, 100)).toBe(150);
  });
});

describe('summarizePeriod', () => {
  const incomes = [income(5_000_000, '2026-11-01')];
  const expenses = [
    expense('macaroni', 25_000, TODAY),
    expense('chicken', 60_000, TODAY),
    expense('yesterday', 1_000, '2026-11-04'),
    expense('october', 999, '2026-10-31'),
  ];

  it('matches the acceptance scenario', () => {
    const summary = summarizePeriod(incomes, expenses.slice(0, 2), november, TODAY);
    expect(summary).toMatchObject({
      income: 5_000_000,
      spent: 85_000,
      remaining: 4_915_000,
      level: 'ok',
      safeToSpendToday: 189_038,
      spentToday: 85_000,
    });
  });

  it('counts only today in spentToday, and only this period in spent', () => {
    expect(summarizePeriod(incomes, expenses, november, TODAY)).toMatchObject({
      spent: 86_000,
      spentToday: 85_000,
    });
  });

  it('shows nothing for today when viewing another period', () => {
    const october = getPeriod('2026-10-15', 'month', { weekStartsOn: 1, monthStartDay: 1 });
    expect(summarizePeriod(incomes, expenses, october, TODAY)).toMatchObject({
      spent: 999,
      safeToSpendToday: null,
      spentToday: null,
    });
  });

  it('goes negative when over budget, with nothing safe to spend', () => {
    const summary = summarizePeriod([income(50_000, '2026-11-01')], expenses, november, TODAY);
    expect(summary).toMatchObject({ remaining: -36_000, level: 'danger', safeToSpendToday: 0 });
  });
});

describe('recentExpenses', () => {
  it('lists the newest date first, then the most recently added', () => {
    const list = [
      expense('old', 1, '2026-11-01'),
      expense('morning', 1, TODAY, '2026-11-05T08:00:00+00:00'),
      expense('evening', 1, TODAY, '2026-11-05T18:00:00+00:00'),
    ];
    expect(recentExpenses(list, november).map((entry) => entry.id)).toEqual(['evening', 'morning', 'old']);
  });

  it('stays inside the period and stops at 5', () => {
    const list = [
      ...[1, 2, 3, 4, 5, 6].map((day) => expense(`day-${day}`, 1, `2026-11-0${day}`)),
      expense('december', 1, '2026-12-01'),
    ];
    const ids = recentExpenses(list, november).map((entry) => entry.id);
    expect(ids).toEqual(['day-6', 'day-5', 'day-4', 'day-3', 'day-2']);
  });

  it('does not reorder the list it was given', () => {
    const list = [expense('a', 1, '2026-11-01'), expense('b', 1, '2026-11-02')];
    recentExpenses(list, november);
    expect(list.map((entry) => entry.id)).toEqual(['a', 'b']);
  });
});
