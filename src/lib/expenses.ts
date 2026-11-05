import type { Category, Expense, Item, Period } from './types';

/** A category and item used together. No itemId means "General". */
export interface Combo {
  key: string;
  categoryId: string;
  itemId?: string;
}

export function activeCategories(categories: Category[]): Category[] {
  return categories.filter((category) => !category.archived).sort((a, b) => a.order - b.order);
}

export function activeItems(items: Item[], categoryId: string): Item[] {
  return items
    .filter((item) => item.categoryId === categoryId && !item.archived)
    .sort((a, b) => a.order - b.order);
}

/**
 * Adds an archived entry to a list of choices, if that's what is currently chosen.
 * When editing an old expense, its own category or item must still show as selected.
 */
export function includingChosen<T extends { id: string }>(active: T[], all: T[], chosenId?: string): T[] {
  if (!chosenId || active.some((entry) => entry.id === chosenId)) return active;
  const chosen = all.find((entry) => entry.id === chosenId);
  return chosen ? [...active, chosen] : active;
}

/** Sets `order` to match the list of ids. Entries not in the list stay as they are. */
export function applyOrder<T extends { id: string; order: number }>(entries: T[], ids: string[]): T[] {
  return entries.map((entry) => {
    const position = ids.indexOf(entry.id);
    return position === -1 ? entry : { ...entry, order: position };
  });
}

/** The active item with this name, ignoring case and surrounding spaces. */
export function findItem(items: Item[], categoryId: string, name: string): Item | undefined {
  const wanted = name.trim().toLowerCase();
  return activeItems(items, categoryId).find((item) => item.name.toLowerCase() === wanted);
}

/** The period's latest expenses: newest date first, then the most recently added. */
export function recentExpenses(expenses: Expense[], period: Period, limit = 5): Expense[] {
  return expenses
    .filter((expense) => expense.date >= period.start && expense.date <= period.end)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || Date.parse(b.createdAt) - Date.parse(a.createdAt),
    )
    .slice(0, limit);
}

/** The most recently used category and item pairs, skipping anything archived. */
export function recentCombos(
  expenses: Expense[],
  categories: Category[],
  items: Item[],
  limit = 5,
): Combo[] {
  const activeCategoryIds = new Set(activeCategories(categories).map((category) => category.id));
  const activeItemIds = new Set(items.filter((item) => !item.archived).map((item) => item.id));

  const newestFirst = [...expenses].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const combos = new Map<string, Combo>();
  for (const { categoryId, itemId } of newestFirst) {
    if (combos.size === limit) break;
    if (!activeCategoryIds.has(categoryId)) continue;
    if (itemId && !activeItemIds.has(itemId)) continue;

    const key = `${categoryId}/${itemId ?? ''}`;
    if (!combos.has(key)) combos.set(key, { key, categoryId, itemId });
  }
  return [...combos.values()];
}
