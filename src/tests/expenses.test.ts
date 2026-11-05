import { describe, expect, it } from 'vitest';
import { previousDay } from '@/lib/dates';
import { activeCategories, activeItems, findItem, recentCombos } from '@/lib/expenses';
import type { Category, Expense, Item } from '@/lib/types';

const category = (id: string, order: number, archived = false): Category => ({
  id,
  name: id,
  icon: '📦',
  color: '#000000',
  order,
  archived,
});

const item = (id: string, categoryId: string, order: number, archived = false): Item => ({
  id,
  categoryId,
  name: id,
  order,
  archived,
});

let minute = 0;
/** Each expense is created one minute after the last. */
const expense = (categoryId: string, itemId?: string): Expense => ({
  id: `expense-${minute}`,
  amount: 100,
  categoryId,
  itemId,
  date: '2026-11-05',
  createdAt: new Date(Date.UTC(2026, 10, 5, 9, minute++)).toISOString(),
});

const categories = [category('groceries', 0), category('transport', 1), category('old', 2, true)];
const items = [
  item('chicken', 'groceries', 1),
  item('macaroni', 'groceries', 0),
  item('taxi', 'transport', 0),
  item('retired', 'groceries', 2, true),
];

describe('activeCategories and activeItems', () => {
  it('leaves out archived entries and follows the saved order', () => {
    expect(activeCategories([categories[1]!, categories[2]!, categories[0]!]).map((c) => c.id)).toEqual([
      'groceries',
      'transport',
    ]);
    expect(activeItems(items, 'groceries').map((i) => i.id)).toEqual(['macaroni', 'chicken']);
  });
});

describe('findItem', () => {
  it('matches ignoring case and spaces, within the category only', () => {
    expect(findItem(items, 'groceries', ' CHICKEN ')?.id).toBe('chicken');
    expect(findItem(items, 'transport', 'chicken')).toBeUndefined();
  });

  it('does not match an archived item', () => {
    expect(findItem(items, 'groceries', 'retired')).toBeUndefined();
  });
});

describe('recentCombos', () => {
  const combos = (expenses: Expense[], limit?: number) =>
    recentCombos(expenses, categories, items, limit).map((combo) => combo.key);

  it('is empty with no expenses', () => {
    expect(combos([])).toEqual([]);
  });

  it('lists the newest first, however the expenses are stored', () => {
    const first = expense('groceries', 'chicken');
    const second = expense('transport', 'taxi');
    expect(combos([first, second])).toEqual(['transport/taxi', 'groceries/chicken']);
    expect(combos([second, first])).toEqual(['transport/taxi', 'groceries/chicken']);
  });

  it('lists each pair once, at its most recent use', () => {
    const list = [
      expense('groceries', 'chicken'),
      expense('transport', 'taxi'),
      expense('groceries', 'chicken'),
    ];
    expect(combos(list)).toEqual(['groceries/chicken', 'transport/taxi']);
  });

  it('treats no item as its own pair', () => {
    const list = [expense('groceries', 'chicken'), expense('groceries')];
    const result = recentCombos(list, categories, items);
    expect(result.map((combo) => combo.key)).toEqual(['groceries/', 'groceries/chicken']);
    expect(result[0]?.itemId).toBeUndefined();
  });

  it('stops at the limit, 5 by default', () => {
    const list = [
      expense('groceries'),
      expense('groceries', 'chicken'),
      expense('groceries', 'macaroni'),
      expense('transport'),
      expense('transport', 'taxi'),
      expense('groceries', 'chicken'),
    ];
    expect(combos(list)).toHaveLength(5);
    expect(combos(list, 2)).toEqual(['groceries/chicken', 'transport/taxi']);
  });

  it('skips archived categories and items', () => {
    const list = [expense('old'), expense('groceries', 'retired'), expense('transport', 'taxi')];
    expect(combos(list)).toEqual(['transport/taxi']);
  });
});

describe('previousDay', () => {
  it('crosses month, year and leap-day boundaries', () => {
    expect(previousDay('2026-11-05')).toBe('2026-11-04');
    expect(previousDay('2026-11-01')).toBe('2026-10-31');
    expect(previousDay('2027-01-01')).toBe('2026-12-31');
    expect(previousDay('2028-03-01')).toBe('2028-02-29');
  });
});
