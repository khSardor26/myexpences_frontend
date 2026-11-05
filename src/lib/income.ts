import type { Income, Period } from './types';

/** The period's income entries, newest first. */
export function incomesInPeriod(incomes: Income[], period: Period): Income[] {
  return incomes
    .filter((income) => income.date >= period.start && income.date <= period.end)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

/** The existing source with this name, ignoring case and surrounding spaces. */
export function findSource(sources: string[], name: string): string | undefined {
  const wanted = name.trim().toLowerCase();
  return sources.find((source) => source.toLowerCase() === wanted);
}
