import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  ApiError,
  type ApiClient,
  type CategoryFields,
  type CodeEntry,
  type Credentials,
  type SecurityStatus,
  type NewExpense,
  type NewIncome,
  type User,
} from '@/lib/api';
import { todayISO } from '@/lib/dates';
import { applyOrder } from '@/lib/expenses';
import { MAX_AMOUNT } from '@/lib/money';
import type { AppData, Expense, Income, Item, Settings } from '@/lib/types';

/**
 * loading: checking the session or fetching data.
 * signedOut: show the sign-in screen.
 * error: the server couldn't be reached or failed. `start` tries again.
 * ready: `user` and `data` are available.
 */
export type AppStatus = 'loading' | 'signedOut' | 'error' | 'ready';

export interface LoginChallenge {
  challengeId: string;
  /** False if Telegram couldn't be reached, so only a recovery code can work. */
  delivered: boolean;
}

/**
 * The server is the source of truth: each action waits for it, and only then
 * updates what's on screen. If it fails the action throws an ApiError, the
 * screen shows the message, and nothing on screen has changed.
 */
export interface AppState {
  status: AppStatus;
  user: User | null;
  data: AppData | null;
  /** Any date inside the period being viewed. Starts as today. */
  selectedDate: string;

  selectDate(date: string): void;
  start(): Promise<void>;
  register(credentials: Credentials): Promise<void>;
  /** Signs in, or returns the challenge to answer if a Telegram code is needed first. */
  login(credentials: Credentials): Promise<LoginChallenge | null>;
  verifyLogin(challengeId: string, entry: CodeEntry): Promise<void>;
  resendLoginCode(challengeId: string): Promise<{ delivered: boolean }>;
  logout(): Promise<void>;

  getSecurity(): Promise<SecurityStatus>;
  connectTelegram(): Promise<{ url: string }>;
  confirmTelegram(code: string): Promise<{ recoveryCodes: string[] }>;
  resendTelegramCode(): Promise<{ delivered: boolean }>;
  cancelTelegram(): Promise<void>;
  sendDisableCode(): Promise<{ delivered: boolean }>;
  disableTelegram(password: string, entry: CodeEntry): Promise<void>;
  /** Ends every session, including this one. */
  signOutEverywhere(): Promise<void>;

  addIncome(income: NewIncome): Promise<Income>;
  updateIncome(id: string, changes: Partial<NewIncome>): Promise<void>;
  /** Returns the removed entry, so it can be passed to restoreIncome for undo. */
  deleteIncome(id: string): Promise<Income | undefined>;
  restoreIncome(income: Income): Promise<void>;

  addExpense(expense: NewExpense): Promise<Expense>;
  updateExpense(id: string, changes: Partial<NewExpense>): Promise<void>;
  /** Returns the removed entry, so it can be passed to restoreExpense for undo. */
  deleteExpense(id: string): Promise<Expense | undefined>;
  restoreExpense(expense: Expense): Promise<void>;

  addItem(categoryId: string, name: string): Promise<Item>;
  renameItem(id: string, name: string): Promise<void>;
  reorderItems(ids: string[]): Promise<void>;
  archiveItem(id: string): Promise<void>;

  addCategory(category: CategoryFields): Promise<void>;
  updateCategory(id: string, category: CategoryFields): Promise<void>;
  reorderCategories(ids: string[]): Promise<void>;
  /** Expenses in the category move to `moveExpensesTo`, which the server requires if there are any. */
  archiveCategory(id: string, moveExpensesTo?: string): Promise<void>;

  importData(data: AppData): Promise<void>;
  resetData(): Promise<void>;

  updateSettings(changes: Partial<Settings>): Promise<void>;
  updateIncomeSources(sources: string[]): Promise<void>;
}

function assertValidAmount(amount: number | undefined) {
  if (amount !== undefined && (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_AMOUNT)) {
    throw new RangeError(`Amount must be a positive integer up to ${MAX_AMOUNT}, got ${amount}`);
  }
}

const SIGNED_OUT = { status: 'signedOut', user: null, data: null } as const;

export function createAppStore(api: ApiClient): StoreApi<AppState> {
  return createStore<AppState>((set, get) => {
    const patchData = (change: (data: AppData) => Partial<AppData>) => {
      set((state) => (state.data ? { data: { ...state.data, ...change(state.data) } } : state));
    };

    /** An expired session can surface on any call, and always means "sign in again". */
    const call = async <T>(action: () => Promise<T>): Promise<T> => {
      try {
        return await action();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) set(SIGNED_OUT);
        throw error;
      }
    };

    const loadDataFor = async (user: User) => {
      set({ status: 'loading', user });
      try {
        const data = await call(api.getData);
        set({ status: 'ready', data });
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) set({ status: 'error' });
      }
    };

    return {
      status: 'loading',
      user: null,
      data: null,
      selectedDate: todayISO(),

      selectDate(date) {
        set({ selectedDate: date });
      },
      async start() {
        set({ status: 'loading' });
        let user: User;
        try {
          user = await call(api.me);
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 401)) set({ status: 'error' });
          return;
        }
        await loadDataFor(user);
      },
      async register(credentials) {
        await loadDataFor(await api.register(credentials));
      },
      async login(credentials) {
        const response = await api.login(credentials);
        if (response.requiresCode && response.challengeId) {
          return { challengeId: response.challengeId, delivered: response.delivered ?? false };
        }
        await loadDataFor({ email: response.email ?? credentials.email });
        return null;
      },
      async verifyLogin(challengeId, entry) {
        await loadDataFor(await api.verifyLogin(challengeId, entry));
      },
      resendLoginCode: (challengeId) => api.resendLoginCode(challengeId),
      async logout() {
        await call(api.logout);
        set(SIGNED_OUT);
      },

      getSecurity: () => call(api.getSecurity),
      connectTelegram: () => call(api.connectTelegram),
      confirmTelegram: (code) => call(() => api.confirmTelegram(code)),
      resendTelegramCode: () => call(api.resendTelegramCode),
      cancelTelegram: () => call(api.cancelTelegram),
      sendDisableCode: () => call(api.sendDisableCode),
      disableTelegram: (password, entry) => call(() => api.disableTelegram(password, entry)),
      async signOutEverywhere() {
        await call(api.signOutEverywhere);
        set(SIGNED_OUT);
      },

      async addIncome(income) {
        assertValidAmount(income.amount);
        const created = await call(() => api.addIncome(income));
        patchData((data) => ({ incomes: [...data.incomes, created] }));
        return created;
      },
      async updateIncome(id, changes) {
        assertValidAmount(changes.amount);
        const current = get().data?.incomes.find((income) => income.id === id);
        if (!current) return;
        const updated = await call(() => api.updateIncome(id, { ...current, ...changes }));
        patchData((data) => ({
          incomes: data.incomes.map((income) => (income.id === id ? updated : income)),
        }));
      },
      async deleteIncome(id) {
        const removed = get().data?.incomes.find((income) => income.id === id);
        if (!removed) return undefined;
        await call(() => api.deleteIncome(id));
        patchData((data) => ({ incomes: data.incomes.filter((income) => income.id !== id) }));
        return removed;
      },
      async restoreIncome(income) {
        const restored = await call(() => api.restoreIncome(income));
        patchData((data) => ({
          incomes: [...data.incomes.filter((existing) => existing.id !== income.id), restored],
        }));
      },

      async addExpense(expense) {
        assertValidAmount(expense.amount);
        const created = await call(() => api.addExpense(expense));
        patchData((data) => ({ expenses: [...data.expenses, created] }));
        return created;
      },
      async updateExpense(id, changes) {
        assertValidAmount(changes.amount);
        const current = get().data?.expenses.find((expense) => expense.id === id);
        if (!current) return;
        const updated = await call(() => api.updateExpense(id, { ...current, ...changes }));
        patchData((data) => ({
          expenses: data.expenses.map((expense) => (expense.id === id ? updated : expense)),
        }));
      },
      async deleteExpense(id) {
        const removed = get().data?.expenses.find((expense) => expense.id === id);
        if (!removed) return undefined;
        await call(() => api.deleteExpense(id));
        patchData((data) => ({ expenses: data.expenses.filter((expense) => expense.id !== id) }));
        return removed;
      },
      async restoreExpense(expense) {
        const restored = await call(() => api.restoreExpense(expense));
        patchData((data) => ({
          expenses: [...data.expenses.filter((existing) => existing.id !== expense.id), restored],
        }));
      },

      async addItem(categoryId, name) {
        const created = await call(() => api.addItem(categoryId, name));
        patchData((data) => ({ items: [...data.items, created] }));
        return created;
      },
      async renameItem(id, name) {
        const updated = await call(() => api.renameItem(id, name));
        patchData((data) => ({ items: data.items.map((item) => (item.id === id ? updated : item)) }));
      },
      async reorderItems(ids) {
        const previous = get().data?.items;
        patchData((data) => ({ items: applyOrder(data.items, ids) }));
        try {
          await call(() => api.reorderItems(ids));
        } catch (error) {
          if (previous) patchData(() => ({ items: previous }));
          throw error;
        }
      },
      async archiveItem(id) {
        const updated = await call(() => api.archiveItem(id));
        patchData((data) => ({ items: data.items.map((item) => (item.id === id ? updated : item)) }));
      },

      async addCategory(category) {
        const created = await call(() => api.addCategory(category));
        patchData((data) => ({ categories: [...data.categories, created] }));
      },
      async updateCategory(id, category) {
        const updated = await call(() => api.updateCategory(id, category));
        patchData((data) => ({
          categories: data.categories.map((entry) => (entry.id === id ? updated : entry)),
        }));
      },
      async reorderCategories(ids) {
        const previous = get().data?.categories;
        patchData((data) => ({ categories: applyOrder(data.categories, ids) }));
        try {
          await call(() => api.reorderCategories(ids));
        } catch (error) {
          if (previous) patchData(() => ({ categories: previous }));
          throw error;
        }
      },
      async archiveCategory(id, moveExpensesTo) {
        await call(() => api.archiveCategory(id, moveExpensesTo));
        // Expenses may have moved too, so take the server's whole picture.
        const data = await call(api.getData);
        set({ data });
      },

      async importData(backup) {
        const data = await call(() => api.importData(backup));
        set({ data });
      },
      async resetData() {
        const data = await call(api.resetData);
        set({ data });
      },

      async updateSettings(changes) {
        const current = get().data?.settings;
        if (!current) return;
        const settings = await call(() => api.updateSettings({ ...current, ...changes }));
        patchData(() => ({ settings }));
      },
      async updateIncomeSources(sources) {
        const incomeSources = await call(() => api.updateIncomeSources(sources));
        patchData(() => ({ incomeSources }));
      },
    };
  });
}
