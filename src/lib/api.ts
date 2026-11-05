import { en } from '@/i18n/en';
import type { AppData, Category, Expense, Income, Item, Settings } from './types';

/**
 * The only file that talks to the server. Everything else goes through
 * the ApiClient interface, which tests replace with an in-memory version.
 */

export interface User {
  email: string;
}

export interface Credentials {
  email: string;
  password: string;
}

/** With Telegram on, the password alone doesn't sign in: a code is needed next. */
export interface LoginResponse {
  email?: string;
  requiresCode: boolean;
  challengeId?: string;
  /** False if Telegram couldn't be reached, so only a recovery code can work. */
  delivered?: boolean;
}

/** A code from Telegram, or a recovery code. */
export interface CodeEntry {
  code?: string;
  recoveryCode?: string;
}

export interface SecurityStatus {
  /** False until a bot token is set up on the server. */
  telegramAvailable: boolean;
  /** linked means the bot has been started, but a code hasn't been confirmed yet. */
  telegram: 'off' | 'linked' | 'on';
  recoveryCodesLeft: number;
}

export type NewIncome =Omit<Income, 'id' | 'createdAt'>;
export type NewExpense = Omit<Expense, 'id' | 'createdAt'>;
export type CategoryFields = Pick<Category, 'name' | 'icon' | 'color'>;

export class ApiError extends Error {
  /** 0 means the server could not be reached. */
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** What to show the user for a failed action. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : en.errors.generic;
}

export interface ApiClient {
  me(): Promise<User>;
  register(credentials: Credentials): Promise<User>;
  login(credentials: Credentials): Promise<LoginResponse>;
  verifyLogin(challengeId: string, entry: CodeEntry): Promise<User>;
  resendLoginCode(challengeId: string): Promise<{ delivered: boolean }>;
  logout(): Promise<void>;

  getSecurity(): Promise<SecurityStatus>;
  connectTelegram(): Promise<{ url: string }>;
  confirmTelegram(code: string): Promise<{ recoveryCodes: string[] }>;
  resendTelegramCode(): Promise<{ delivered: boolean }>;
  cancelTelegram(): Promise<void>;
  sendDisableCode(): Promise<{ delivered: boolean }>;
  disableTelegram(password: string, entry: CodeEntry): Promise<void>;
  signOutEverywhere(): Promise<void>;

  getData(): Promise<AppData>;
  updateSettings(settings: Settings): Promise<Settings>;
  updateIncomeSources(sources: string[]): Promise<string[]>;

  addIncome(income: NewIncome): Promise<Income>;
  updateIncome(id: string, income: NewIncome): Promise<Income>;
  deleteIncome(id: string): Promise<void>;
  restoreIncome(income: Income): Promise<Income>;

  addExpense(expense: NewExpense): Promise<Expense>;
  updateExpense(id: string, expense: NewExpense): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
  restoreExpense(expense: Expense): Promise<Expense>;

  addItem(categoryId: string, name: string): Promise<Item>;
  renameItem(id: string, name: string): Promise<Item>;
  reorderItems(ids: string[]): Promise<void>;
  archiveItem(id: string): Promise<Item>;

  addCategory(category: CategoryFields): Promise<Category>;
  updateCategory(id: string, category: CategoryFields): Promise<Category>;
  reorderCategories(ids: string[]): Promise<void>;
  archiveCategory(id: string, moveExpensesTo?: string): Promise<Category>;

  importData(data: AppData): Promise<AppData>;
  resetData(): Promise<AppData>;
}

interface ProblemBody {
  detail?: string;
  title?: string;
  errors?: Record<string, string[]>;
}

/** Validation errors list what to fix. Anything else uses the server's message. */
function problemMessage(problem: ProblemBody): string {
  const fieldErrors = Object.values(problem.errors ?? {}).flat();
  if (fieldErrors.length > 0) return fieldErrors.join(' ');
  return problem.detail ?? problem.title ?? en.errors.generic;
}

async function readProblem(response: Response): Promise<string> {
  try {
    return problemMessage((await response.json()) as ProblemBody);
  } catch {
    return en.errors.generic;
  }
}

const apiOrigin = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiOrigin}/api${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, en.errors.network);
  }

  if (!response.ok) throw new ApiError(response.status, await readProblem(response));
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function createApiClient(): ApiClient {
  return {
    me: () => request('GET', '/auth/me'),
    register: (credentials) => request('POST', '/auth/register', credentials),
    login: (credentials) => request('POST', '/auth/login', credentials),
    verifyLogin: (challengeId, entry) => request('POST', '/auth/login/verify', { challengeId, ...entry }),
    resendLoginCode: (challengeId) => request('POST', '/auth/login/resend', { challengeId }),
    logout: () => request('POST', '/auth/logout'),

    getSecurity: () => request('GET', '/security'),
    connectTelegram: () => request('POST', '/security/telegram/connect'),
    confirmTelegram: (code) => request('POST', '/security/telegram/confirm', { code }),
    resendTelegramCode: () => request('POST', '/security/telegram/resend'),
    cancelTelegram: () => request('POST', '/security/telegram/cancel'),
    sendDisableCode: () => request('POST', '/security/telegram/disable/code'),
    disableTelegram: (password, entry) => request('POST', '/security/telegram/disable', { password, ...entry }),
    signOutEverywhere: () => request('POST', '/security/sign-out-everywhere'),

    getData: () => request('GET', '/data'),
    updateSettings: (settings) => request('PUT', '/settings', settings),
    updateIncomeSources: (sources) => request('PUT', '/income-sources', { sources }),

    addIncome: (income) => request('POST', '/incomes', income),
    updateIncome: (id, income) => request('PUT', `/incomes/${encodeURIComponent(id)}`, income),
    deleteIncome: (id) => request('DELETE', `/incomes/${encodeURIComponent(id)}`),
    restoreIncome: (income) => request('POST', '/incomes/restore', income),

    addExpense: (expense) => request('POST', '/expenses', expense),
    updateExpense: (id, expense) => request('PUT', `/expenses/${encodeURIComponent(id)}`, expense),
    deleteExpense: (id) => request('DELETE', `/expenses/${encodeURIComponent(id)}`),
    restoreExpense: (expense) => request('POST', '/expenses/restore', expense),

    addItem: (categoryId, name) => request('POST', '/items', { categoryId, name }),
    renameItem: (id, name) => request('PUT', `/items/${encodeURIComponent(id)}`, { name }),
    reorderItems: (ids) => request('PUT', '/items/order', { ids }),
    archiveItem: (id) => request('POST', `/items/${encodeURIComponent(id)}/archive`),

    addCategory: (category) => request('POST', '/categories', category),
    updateCategory: (id, category) => request('PUT', `/categories/${encodeURIComponent(id)}`, category),
    reorderCategories: (ids) => request('PUT', '/categories/order', { ids }),
    archiveCategory: (id, moveExpensesTo) =>
      request('POST', `/categories/${encodeURIComponent(id)}/archive`, {
        moveExpensesTo: moveExpensesTo ?? null,
      }),

    importData: (data) => request('POST', '/data/import', data),
    resetData: () => request('DELETE', '/data'),
  };
}
