import type { Expense, Period } from './types';

/** The item filter value for expenses with no item, shown as "General". */
export const GENERAL_ITEM = 'general';

export interface ExpenseFilters {
  /** Leave out for all time. */
  period?: Period;
  categoryId?: string;
  /** An item id, or GENERAL_ITEM. */
  itemId?: string;
  /** Text to find in notes, ignoring case. */
  search?: string;
}

export interface DayGroup {
  date: string;
  total: number;
  expenses: Expense[];
}

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const { period, categoryId, itemId } = filters;
  const search = filters.search?.trim().toLowerCase();

  return expenses.filter((expense) => {
    if (period && (expense.date < period.start || expense.date > period.end)) return false;
    if (categoryId && expense.categoryId !== categoryId) return false;
    if (itemId === GENERAL_ITEM && expense.itemId) return false;
    if (itemId && itemId !== GENERAL_ITEM && expense.itemId !== itemId) return false;
    if (search && !expense.note?.toLowerCase().includes(search)) return false;
    return true;
  });
}

/** Newest day first. Within a day, the most recently added comes first. */
export function groupByDay(expenses: Expense[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  for (const expense of expenses) {
    const group = groups.get(expense.date) ?? { date: expense.date, total: 0, expenses: [] };
    group.total += expense.amount;
    group.expenses.push(expense);
    groups.set(expense.date, group);
  }

  for (const group of groups.values()) {
    group.expenses.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  return [...groups.values()].sort((a, b) => b.date.localeCompare(a.date));
}
