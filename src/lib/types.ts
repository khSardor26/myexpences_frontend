import type { Currency } from './money';

export type PeriodType = 'week' | 'month';

/** A budget period. Both dates are inclusive, as "YYYY-MM-DD". */
export interface Period {
  type: PeriodType;
  start: string;
  end: string;
}

export interface Income {
  id: string;
  amount: number; // integer
  source: string; // "Salary", "Freelance", "Gift", "Other"
  date: string; // "YYYY-MM-DD"
  note?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // emoji
  color: string;
  order: number;
  archived: boolean;
}

export interface Item {
  id: string;
  categoryId: string;
  name: string; // "Macaroni", "Chicken"
  order: number;
  archived: boolean;
}

export interface Expense {
  id: string;
  amount: number; // integer
  categoryId: string; // required
  itemId?: string; // optional, shown as "General" if empty
  date: string; // "YYYY-MM-DD"
  quantity?: string; // optional, e.g. "1 kg", "2 packs"
  note?: string;
  createdAt: string;
}

export interface Settings {
  currency: Currency;
  periodType: PeriodType;
  weekStartsOn: 0 | 1; // 1 = Monday
  monthStartDay: number; // 1-28
  theme: 'light' | 'dark' | 'system';
}

/** Everything the app saves. */
export interface AppData {
  incomes: Income[];
  expenses: Expense[];
  categories: Category[];
  items: Item[];
  incomeSources: string[];
  settings: Settings;
}
