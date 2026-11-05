import { differenceInCalendarDays } from 'date-fns';
import { parseISODate } from './dates';
import type { Expense, Income, Period } from './types';

export interface CategoryTotal {
  categoryId: string;
  total: number;
}

export interface ItemTotal {
  /** null means the expense has no item, shown as "General". */
  itemId: string | null;
  total: number;
}

// "YYYY-MM-DD" strings sort chronologically, so plain comparison is safe.
const inPeriod = (date: string, period: Period) => date >= period.start && date <= period.end;

const sumAmounts = (entries: { amount: number }[]) =>
  entries.reduce((sum, entry) => sum + entry.amount, 0);

const expensesIn = (expenses: Expense[], period: Period) =>
  expenses.filter((expense) => inPeriod(expense.date, period));

/** Adds up amounts per key, largest total first. */
function groupTotals<K>(expenses: Expense[], keyOf: (expense: Expense) => K): [K, number][] {
  const totals = new Map<K, number>();
  for (const expense of expenses) {
    const key = keyOf(expense);
    totals.set(key, (totals.get(key) ?? 0) + expense.amount);
  }
  return [...totals].sort((a, b) => b[1] - a[1]);
}

export function totalIncome(incomes: Income[], period: Period): number {
  return sumAmounts(incomes.filter((income) => inPeriod(income.date, period)));
}

export function totalSpent(expenses: Expense[], period: Period): number {
  return sumAmounts(expensesIn(expenses, period));
}

/** Can be negative. */
export function remaining(income: number, spent: number): number {
  return income - spent;
}

/** A ratio, not money: 0.5 means 50% used. It is 0 if there is no income. */
export function percentUsed(income: number, spent: number): number {
  return income === 0 ? 0 : spent / income;
}

/** Days from today to the end of the period, counting today. It is 0 once the period is over. */
export function daysLeft(period: Period, today: string): number {
  const days = differenceInCalendarDays(parseISODate(period.end), parseISODate(today)) + 1;
  return Math.max(days, 0);
}

/** Only means something for the current period, so it is null for any other period. */
export function safeToSpendToday(remainingAmount: number, period: Period, today: string): number | null {
  if (!inPeriod(today, period)) return null;
  return Math.floor(Math.max(remainingAmount, 0) / daysLeft(period, today));
}

export function spentToday(expenses: Expense[], today: string): number {
  return sumAmounts(expenses.filter((expense) => expense.date === today));
}

/** How worried the balance should look: under 70% used is ok, up to 90% is a warning. */
export type BudgetLevel = 'ok' | 'warning' | 'danger';

export function budgetLevel(income: number, spent: number): BudgetLevel {
  if (spent > income) return 'danger';
  const used = percentUsed(income, spent);
  if (used > 0.9) return 'danger';
  return used >= 0.7 ? 'warning' : 'ok';
}

/** A part of a whole as a whole-number percentage. It is 0 if the whole is 0. */
export function sharePercent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

export interface PeriodSummary {
  income: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  level: BudgetLevel;
  /** Null when today isn't in the period being viewed. */
  safeToSpendToday: number | null;
  /** Null when today isn't in the period being viewed. */
  spentToday: number | null;
}

/** Everything the Dashboard shows about a period. */
export function summarizePeriod(
  incomes: Income[],
  expenses: Expense[],
  period: Period,
  today: string,
): PeriodSummary {
  const income = totalIncome(incomes, period);
  const spent = totalSpent(expenses, period);
  const left = remaining(income, spent);

  return {
    income,
    spent,
    remaining: left,
    percentUsed: percentUsed(income, spent),
    level: budgetLevel(income, spent),
    safeToSpendToday: safeToSpendToday(left, period, today),
    spentToday: inPeriod(today, period) ? spentToday(expenses, today) : null,
  };
}

export function totalsByCategory(expenses: Expense[], period: Period): CategoryTotal[] {
  return groupTotals(expensesIn(expenses, period), (expense) => expense.categoryId).map(
    ([categoryId, total]) => ({ categoryId, total }),
  );
}

export function totalsByItem(expenses: Expense[], period: Period, categoryId: string): ItemTotal[] {
  const inCategory = expensesIn(expenses, period).filter((expense) => expense.categoryId === categoryId);
  return groupTotals(inCategory, (expense) => expense.itemId ?? null).map(([itemId, total]) => ({
    itemId,
    total,
  }));
}
