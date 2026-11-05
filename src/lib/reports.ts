import { addDays } from 'date-fns';
import { daysLeft, totalsByCategory } from './calc';
import { parseISODate, toISODate } from './dates';
import type { Expense, Period } from './types';

export interface DayTotal {
  date: string;
  total: number;
}

export interface CategoryChange {
  categoryId: string;
  current: number;
  previous: number;
  /** current − previous. Positive means more was spent than last period. */
  change: number;
}

export interface TopItem {
  categoryId: string;
  /** null means the expense has no item, shown as "General". */
  itemId: string | null;
  total: number;
}

export function daysInPeriod(period: Period): number {
  return daysLeft(period, period.start);
}

/** Every day of the period in order, including days with nothing spent. */
export function dailySpending(expenses: Expense[], period: Period): DayTotal[] {
  const totals = new Map<string, number>();
  for (const { date, amount } of expenses) {
    if (date >= period.start && date <= period.end) totals.set(date, (totals.get(date) ?? 0) + amount);
  }

  const start = parseISODate(period.start);
  return Array.from({ length: daysInPeriod(period) }, (_, index) => {
    const date = toISODate(addDays(start, index));
    return { date, total: totals.get(date) ?? 0 };
  });
}

/** What could be spent per day for the income to last the whole period, rounded down. */
export function averageDailyBudget(income: number, period: Period): number {
  return Math.floor(income / daysInPeriod(period));
}

/** Change per category since another period, biggest change first. */
export function compareCategories(expenses: Expense[], period: Period, previous: Period): CategoryChange[] {
  const before = new Map(
    totalsByCategory(expenses, previous).map(({ categoryId, total }) => [categoryId, total]),
  );
  const now = new Map(totalsByCategory(expenses, period).map(({ categoryId, total }) => [categoryId, total]));

  return [...new Set([...now.keys(), ...before.keys()])]
    .map((categoryId) => {
      const current = now.get(categoryId) ?? 0;
      const earlier = before.get(categoryId) ?? 0;
      return { categoryId, current, previous: earlier, change: current - earlier };
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

/** The items with the most spent in the period, across all categories. */
export function topItems(expenses: Expense[], period: Period, limit = 5): TopItem[] {
  const totals = new Map<string, TopItem>();
  for (const { date, amount, categoryId, itemId } of expenses) {
    if (date < period.start || date > period.end) continue;
    const key = `${categoryId}/${itemId ?? ''}`;
    const entry = totals.get(key) ?? { categoryId, itemId: itemId ?? null, total: 0 };
    entry.total += amount;
    totals.set(key, entry);
  }
  return [...totals.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}
