import { beforeEach, describe, expect, it } from 'vitest';
import { remaining, totalIncome, totalSpent } from '@/lib/calc';
import { getPeriod, todayISO } from '@/lib/dates';
import { applyOrder } from '@/lib/expenses';
import { ApiError, type ApiClient, type User } from '@/lib/api';
import type { AppData, Expense, Income } from '@/lib/types';
import { createAppStore } from '@/store/appStore';

const USER: User = { email: 'me@example.com' };

const newServerData = (): AppData => ({
  incomes: [],
  expenses: [],
  categories: [],
  items: [],
  incomeSources: ['Salary'],
  settings: {
    currency: { code: 'UZS', symbol: "so'm", decimals: 0 },
    periodType: 'month',
    weekStartsOn: 1,
    monthStartDay: 1,
    theme: 'system',
  },
});

/** An in-memory stand-in for the server. `failWith` makes every call fail. */
function fakeServer(options: { signedIn: boolean } = { signedIn: true }) {
  const server = {
    signedIn: options.signedIn,
    telegramOn: false,
    failWith: null as ApiError | null,
    data: newServerData(),
    nextId: 1,
  };

  const guard = async () => {
    if (server.failWith) throw server.failWith;
  };
  const session = async () => {
    await guard();
    if (!server.signedIn) throw new ApiError(401, 'Unauthorized');
  };
  const entryFields = () => ({ id: `id-${server.nextId++}`, createdAt: '2026-11-05T09:00:00+00:00' });

  const api: ApiClient = {
    me: async () => (await session(), USER),
    register: async () => (await guard(), (server.signedIn = true), USER),
    login: async ({ password }) => {
      await guard();
      if (password !== 'right') throw new ApiError(401, 'Incorrect email or password.');
      if (server.telegramOn) return { requiresCode: true, challengeId: 'challenge-1', delivered: true };
      server.signedIn = true;
      return { requiresCode: false, email: USER.email };
    },
    verifyLogin: async (_challengeId, entry) => {
      await guard();
      if (entry.code !== '123456' && entry.recoveryCode !== 'RECOVERY') throw new ApiError(400, 'That code is not right.');
      server.signedIn = true;
      return USER;
    },
    resendLoginCode: async () => (await guard(), { delivered: true }),
    logout: async () => {
      await session();
      server.signedIn = false;
    },

    getSecurity: async () => (
      await session(),
      { telegramAvailable: true, telegram: server.telegramOn ? 'on' : 'off', recoveryCodesLeft: server.telegramOn ? 10 : 0 }
    ),
    connectTelegram: async () => (await session(), { url: 'https://t.me/test_bot?start=token' }),
    confirmTelegram: async () => (await session(), (server.telegramOn = true), { recoveryCodes: ['RECOVERY'] }),
    resendTelegramCode: async () => (await session(), { delivered: true }),
    cancelTelegram: async () => {
      await session();
    },
    sendDisableCode: async () => (await session(), { delivered: true }),
    disableTelegram: async () => {
      await session();
      server.telegramOn = false;
    },
    signOutEverywhere: async () => {
      await session();
      server.signedIn = false;
    },
    getData: async () => (await session(), structuredClone(server.data)),
    updateSettings: async (settings) => (await session(), (server.data.settings = settings)),
    updateIncomeSources: async (sources) => (await session(), (server.data.incomeSources = sources)),

    addIncome: async (income) => {
      await session();
      const created: Income = { ...income, ...entryFields() };
      server.data.incomes.push(created);
      return created;
    },
    updateIncome: async (id, income) => {
      await session();
      const updated = { ...server.data.incomes.find((entry) => entry.id === id)!, ...income };
      server.data.incomes = server.data.incomes.map((entry) => (entry.id === id ? updated : entry));
      return updated;
    },
    deleteIncome: async (id) => {
      await session();
      server.data.incomes = server.data.incomes.filter((entry) => entry.id !== id);
    },
    restoreIncome: async (income) => {
      await session();
      server.data.incomes.push(income);
      return income;
    },

    addExpense: async (expense) => {
      await session();
      const created: Expense = { ...expense, ...entryFields() };
      server.data.expenses.push(created);
      return created;
    },
    updateExpense: async (id, expense) => {
      await session();
      const updated = { ...server.data.expenses.find((entry) => entry.id === id)!, ...expense };
      server.data.expenses = server.data.expenses.map((entry) => (entry.id === id ? updated : entry));
      return updated;
    },
    deleteExpense: async (id) => {
      await session();
      server.data.expenses = server.data.expenses.filter((entry) => entry.id !== id);
    },
    restoreExpense: async (expense) => {
      await session();
      server.data.expenses.push(expense);
      return expense;
    },

    addItem: async (categoryId, name) => {
      await session();
      const created = { id: `id-${server.nextId++}`, categoryId, name, order: 0, archived: false };
      server.data.items.push(created);
      return created;
    },
    renameItem: async (id, name) => {
      await session();
      const item = server.data.items.find((entry) => entry.id === id)!;
      item.name = name;
      return { ...item };
    },
    reorderItems: async (ids) => {
      await session();
      server.data.items = applyOrder(server.data.items, ids);
    },
    archiveItem: async (id) => {
      await session();
      const item = server.data.items.find((entry) => entry.id === id)!;
      item.archived = true;
      return { ...item };
    },

    addCategory: async (category) => {
      await session();
      const created = { ...category, id: `id-${server.nextId++}`, order: 0, archived: false };
      server.data.categories.push(created);
      return { ...created };
    },
    updateCategory: async (id, category) => {
      await session();
      const entry = server.data.categories.find((candidate) => candidate.id === id)!;
      Object.assign(entry, category);
      return { ...entry };
    },
    reorderCategories: async (ids) => {
      await session();
      server.data.categories = applyOrder(server.data.categories, ids);
    },
    archiveCategory: async (id, moveExpensesTo) => {
      await session();
      const entry = server.data.categories.find((candidate) => candidate.id === id)!;
      entry.archived = true;
      server.data.expenses = server.data.expenses.map((expense) =>
        expense.categoryId === id ? { ...expense, categoryId: moveExpensesTo!, itemId: undefined } : expense,
      );
      return { ...entry };
    },

    importData: async (data) => {
      await session();
      server.data = structuredClone(data);
      return structuredClone(data);
    },
    resetData: async () => {
      await session();
      server.data = newServerData();
      return newServerData();
    },
  };

  return { server, api };
}

const expense = { amount: 25_000, categoryId: 'groceries', date: '2026-11-05' };
const income = { amount: 5_000_000, source: 'Salary', date: '2026-11-01' };

describe('starting up', () => {
  it('loads the data when there is a session', async () => {
    const { api } = fakeServer();
    const store = createAppStore(api);
    expect(store.getState().status).toBe('loading');

    await store.getState().start();

    expect(store.getState()).toMatchObject({ status: 'ready', user: USER, data: newServerData() });
  });

  it('shows sign-in when there is no session', async () => {
    const { api } = fakeServer({ signedIn: false });
    const store = createAppStore(api);
    await store.getState().start();
    expect(store.getState()).toMatchObject({ status: 'signedOut', user: null, data: null });
  });

  it('shows an error rather than sign-in when the server is unreachable, and can retry', async () => {
    const { api, server } = fakeServer();
    const store = createAppStore(api);

    server.failWith = new ApiError(0, 'offline');
    await store.getState().start();
    expect(store.getState().status).toBe('error');

    server.failWith = null;
    await store.getState().start();
    expect(store.getState().status).toBe('ready');
  });
});

describe('selected period', () => {
  it('starts on today and can move', async () => {
    const { api } = fakeServer();
    const store = createAppStore(api);
    expect(store.getState().selectedDate).toBe(todayISO());

    store.getState().selectDate('2026-10-01');
    expect(store.getState().selectedDate).toBe('2026-10-01');
  });
});

describe('signing in and out', () => {
  it('loads the data after signing in', async () => {
    const { api } = fakeServer({ signedIn: false });
    const store = createAppStore(api);
    await store.getState().start();

    await store.getState().login({ email: USER.email, password: 'right' });

    expect(store.getState()).toMatchObject({ status: 'ready', user: USER });
    expect(store.getState().data).not.toBeNull();
  });

  it('throws on a wrong password and stays on sign-in', async () => {
    const { api } = fakeServer({ signedIn: false });
    const store = createAppStore(api);
    await store.getState().start();

    await expect(store.getState().login({ email: USER.email, password: 'wrong' })).rejects.toThrow(
      'Incorrect email or password.',
    );
    expect(store.getState().status).toBe('signedOut');
  });

  describe('with Telegram codes on', () => {
    const signingIn = async () => {
      const { api, server } = fakeServer({ signedIn: false });
      server.telegramOn = true;
      const store = createAppStore(api);
      await store.getState().start();
      return store;
    };

    it('asks for a code after the password, without signing in or loading data', async () => {
      const store = await signingIn();

      const challenge = await store.getState().login({ email: USER.email, password: 'right' });

      expect(challenge).toEqual({ challengeId: 'challenge-1', delivered: true });
      expect(store.getState()).toMatchObject({ status: 'signedOut', user: null, data: null });
    });

    it('stays signed out on a wrong code', async () => {
      const store = await signingIn();

      await expect(store.getState().verifyLogin('challenge-1', { code: '000000' })).rejects.toThrow(
        'That code is not right.',
      );
      expect(store.getState()).toMatchObject({ status: 'signedOut', data: null });
    });

    it.each([{ code: '123456' }, { recoveryCode: 'RECOVERY' }])('signs in and loads data with %o', async (entry) => {
      const store = await signingIn();

      await store.getState().verifyLogin('challenge-1', entry);

      expect(store.getState()).toMatchObject({ status: 'ready', user: USER });
      expect(store.getState().data).not.toBeNull();
    });
  });

  it('returns no challenge when Telegram is off', async () => {
    const { api } = fakeServer({ signedIn: false });
    const store = createAppStore(api);
    await store.getState().start();

    expect(await store.getState().login({ email: USER.email, password: 'right' })).toBeNull();
  });

  it('removes all data from memory after signing out everywhere', async () => {
    const { api } = fakeServer();
    const store = createAppStore(api);
    await store.getState().start();

    await store.getState().signOutEverywhere();

    expect(store.getState()).toMatchObject({ status: 'signedOut', user: null, data: null });
  });

  it('loads the data after registering', async () => {
    const { api } = fakeServer({ signedIn: false });
    const store = createAppStore(api);
    await store.getState().register({ email: USER.email, password: 'long enough' });
    expect(store.getState().status).toBe('ready');
  });

  it('removes all data from memory on sign-out', async () => {
    const { api } = fakeServer();
    const store = createAppStore(api);
    await store.getState().start();
    await store.getState().addExpense(expense);

    await store.getState().logout();

    expect(store.getState()).toMatchObject({ status: 'signedOut', user: null, data: null });
  });

  it('goes to sign-in and clears data when the session expires mid-use', async () => {
    const { api, server } = fakeServer();
    const store = createAppStore(api);
    await store.getState().start();

    server.signedIn = false;
    await expect(store.getState().addExpense(expense)).rejects.toBeInstanceOf(ApiError);

    expect(store.getState()).toMatchObject({ status: 'signedOut', user: null, data: null });
  });
});

describe('income and expenses', () => {
  let setup: ReturnType<typeof fakeServer>;
  let store: ReturnType<typeof createAppStore>;
  const data = () => store.getState().data!;

  beforeEach(async () => {
    setup = fakeServer();
    store = createAppStore(setup.api);
    await store.getState().start();
  });

  it('adds an entry using what the server returns', async () => {
    const created = await store.getState().addExpense(expense);
    expect(created.id).toBe('id-1');
    expect(data().expenses).toEqual([created]);
    expect(setup.server.data.expenses).toEqual([created]);
  });

  it('updates only the matching entry, sending the whole entry', async () => {
    const first = await store.getState().addIncome(income);
    const second = await store.getState().addIncome({ ...income, amount: 100 });
    await store.getState().updateIncome(first.id, { amount: 200 });
    expect(data().incomes).toEqual([{ ...first, amount: 200 }, second]);
    expect(setup.server.data.incomes[0]).toEqual({ ...first, amount: 200 });
  });

  it('deletes an expense and restores it on undo', async () => {
    const created = await store.getState().addExpense(expense);
    expect(await store.getState().deleteExpense(created.id)).toEqual(created);
    expect(data().expenses).toEqual([]);
    expect(setup.server.data.expenses).toEqual([]);

    await store.getState().restoreExpense(created);
    expect(data().expenses).toEqual([created]);
    expect(setup.server.data.expenses).toEqual([created]);
  });

  it('deletes income and restores it on undo', async () => {
    const created = await store.getState().addIncome(income);
    expect(await store.getState().deleteIncome(created.id)).toEqual(created);
    expect(data().incomes).toEqual([]);

    await store.getState().restoreIncome(created);
    expect(data().incomes).toEqual([created]);
  });

  it('returns undefined when deleting an unknown id', async () => {
    expect(await store.getState().deleteExpense('missing')).toBeUndefined();
  });

  it.each([0, -5, 10.5, Number.NaN, 10_000_000_000_001])('rejects an amount of %s before calling the server', async (amount) => {
    await expect(store.getState().addExpense({ ...expense, amount })).rejects.toThrow(RangeError);
    await expect(store.getState().addIncome({ ...income, amount })).rejects.toThrow(RangeError);
    expect(setup.server.data.expenses).toEqual([]);
    expect(setup.server.data.incomes).toEqual([]);
  });

  it('leaves the screen unchanged when the server refuses a change', async () => {
    const created = await store.getState().addExpense(expense);
    setup.server.failWith = new ApiError(0, 'offline');

    await expect(store.getState().addExpense(expense)).rejects.toThrow('offline');
    await expect(store.getState().updateExpense(created.id, { amount: 1 })).rejects.toThrow('offline');
    await expect(store.getState().deleteExpense(created.id)).rejects.toThrow('offline');

    expect(data().expenses).toEqual([created]);
    expect(store.getState().status).toBe('ready');
  });

  it('clears optional fields when editing', async () => {
    const created = await store.getState().addExpense({ ...expense, itemId: 'a', note: 'old', quantity: '1 kg' });
    await store.getState().updateExpense(created.id, {
      amount: 500,
      itemId: undefined,
      note: undefined,
      quantity: undefined,
    });
    expect(data().expenses[0]).toMatchObject({ amount: 500, categoryId: 'groceries' });
    expect(data().expenses[0]?.itemId).toBeUndefined();
    expect(data().expenses[0]?.note).toBeUndefined();
    expect(data().expenses[0]?.quantity).toBeUndefined();
    expect(data().expenses[0]?.id).toBe(created.id);
  });

  it('adds an item using what the server returns', async () => {
    const created = await store.getState().addItem('groceries', 'Pasta');
    expect(created.name).toBe('Pasta');
    expect(data().items).toEqual([created]);
    expect(setup.server.data.items).toEqual([created]);
  });

  it('removes a just-saved expense when its save is undone', async () => {
    const created = await store.getState().addExpense(expense);
    await store.getState().deleteExpense(created.id);
    expect(data().expenses).toEqual([]);
    expect(setup.server.data.expenses).toEqual([]);
  });

  describe('categories and items', () => {
    const fields = { name: 'Pets', icon: '🐈', color: '#123456' };

    it('adds and updates a category', async () => {
      await store.getState().addCategory(fields);
      const id = data().categories[0]!.id;
      await store.getState().updateCategory(id, { ...fields, name: 'Cats' });
      expect(data().categories[0]).toMatchObject({ id, name: 'Cats' });
    });

    it('renames and archives an item', async () => {
      const item = await store.getState().addItem('groceries', 'Pasta');
      await store.getState().renameItem(item.id, 'Macaroni');
      expect(data().items[0]?.name).toBe('Macaroni');
      await store.getState().archiveItem(item.id);
      expect(data().items[0]?.archived).toBe(true);
    });

    it('moves expenses when archiving a category', async () => {
      await store.getState().addCategory(fields);
      const id = data().categories[0]!.id;
      await store.getState().addExpense({ ...expense, categoryId: id, itemId: 'x' });
      await store.getState().archiveCategory(id, 'other');

      expect(data().categories[0]?.archived).toBe(true);
      expect(data().expenses).toHaveLength(1);
      expect(data().expenses[0]).toMatchObject({ categoryId: 'other' });
      expect(data().expenses[0]?.itemId).toBeUndefined();
    });

    it('shows a new order at once, and restores the old one if saving fails', async () => {
      await store.getState().addCategory(fields);
      await store.getState().addCategory({ ...fields, name: 'Second' });
      const [first, second] = data().categories;

      const saving = store.getState().reorderCategories([second!.id, first!.id]);
      expect(data().categories.find((entry) => entry.id === second!.id)?.order).toBe(0);
      await saving;
      expect(setup.server.data.categories.find((entry) => entry.id === first!.id)?.order).toBe(1);

      const before = data().categories;
      setup.server.failWith = new ApiError(0, 'offline');
      await expect(store.getState().reorderCategories([first!.id, second!.id])).rejects.toThrow('offline');
      expect(data().categories).toEqual(before);
    });

    it('restores the old item order if saving fails', async () => {
      const a = await store.getState().addItem('groceries', 'A');
      const b = await store.getState().addItem('groceries', 'B');
      const before = data().items;
      setup.server.failWith = new ApiError(0, 'offline');
      await expect(store.getState().reorderItems([b.id, a.id])).rejects.toThrow('offline');
      expect(data().items).toEqual(before);
    });
  });

  describe('import and reset', () => {
    it('replaces everything on import', async () => {
      await store.getState().addExpense(expense);
      await store.getState().importData({ ...newServerData(), incomeSources: ['Imported'] });
      expect(data().expenses).toEqual([]);
      expect(data().incomeSources).toEqual(['Imported']);
    });

    it('changes nothing when an import fails', async () => {
      const created = await store.getState().addExpense(expense);
      setup.server.failWith = new ApiError(400, 'Bad backup');
      await expect(store.getState().importData(newServerData())).rejects.toThrow('Bad backup');
      expect(data().expenses).toEqual([created]);
    });

    it('returns to the defaults on reset', async () => {
      await store.getState().addExpense(expense);
      await store.getState().resetData();
      expect(data()).toEqual(newServerData());
      expect(store.getState().status).toBe('ready');
    });
  });

  it('saves settings and income sources', async () => {
    await store.getState().updateSettings({ monthStartDay: 10 });
    await store.getState().updateIncomeSources(['Salary', 'Rent']);

    expect(data().settings.monthStartDay).toBe(10);
    expect(data().settings.currency.code).toBe('UZS');
    expect(data().incomeSources).toEqual(['Salary', 'Rent']);
    expect(setup.server.data.settings.monthStartDay).toBe(10);
  });

  it('brings everything back after a reload', async () => {
    const savedIncome = await store.getState().addIncome(income);
    const savedExpense = await store.getState().addExpense(expense);

    const reloaded = createAppStore(setup.api);
    await reloaded.getState().start();

    expect(reloaded.getState().data?.incomes).toEqual([savedIncome]);
    expect(reloaded.getState().data?.expenses).toEqual([savedExpense]);
  });

  it('follows the first steps of the acceptance scenario', async () => {
    const { addIncome, addExpense, deleteExpense, restoreExpense } = store.getState();
    const period = getPeriod('2026-11-05', 'month', data().settings);
    const left = () => remaining(totalIncome(data().incomes, period), totalSpent(data().expenses, period));

    await addIncome(income);
    expect(left()).toBe(5_000_000);

    const macaroni = await addExpense({ ...expense, itemId: 'groceries-macaroni-pasta' });
    expect(left()).toBe(4_975_000);

    await addExpense({ ...expense, amount: 60_000, itemId: 'groceries-chicken' });
    expect(left()).toBe(4_915_000);

    await deleteExpense(macaroni.id);
    expect(left()).toBe(4_940_000);

    await restoreExpense(macaroni);
    expect(left()).toBe(4_915_000);
  });
});
