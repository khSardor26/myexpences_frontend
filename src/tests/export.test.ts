import { describe, expect, it } from 'vitest';
import { applyOrder } from '@/lib/expenses';
import { backupJson, BackupError, expensesCsv, incomeCsv, parseBackup, SCHEMA_VERSION } from '@/lib/export';
import type { AppData } from '@/lib/types';

const data: AppData = {
  incomes: [
    { id: 'i2', amount: 300, source: 'Gift', date: '2026-11-03', note: 'Birthday', createdAt: '2026-11-03T09:00:00Z' },
    { id: 'i1', amount: 5_000_000, source: 'Salary', date: '2026-11-01', createdAt: '2026-11-01T09:00:00Z' },
  ],
  expenses: [
    {
      id: 'e2',
      amount: 60_000,
      categoryId: 'groceries',
      itemId: 'chicken',
      date: '2026-11-05',
      quantity: '1 kg',
      note: 'He said "fresh", really',
      createdAt: '2026-11-05T10:00:00Z',
    },
    { id: 'e1', amount: 25_000, categoryId: 'other', date: '2026-11-04', createdAt: '2026-11-04T09:00:00Z' },
  ],
  categories: [
    { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#000000', order: 0, archived: false },
    { id: 'other', name: "Boshqa so'm", icon: '📦', color: '#000000', order: 1, archived: false },
  ],
  items: [{ id: 'chicken', categoryId: 'groceries', name: 'Chicken', order: 0, archived: false }],
  incomeSources: ['Salary'],
  settings: {
    currency: { code: 'UZS', symbol: "so'm", decimals: 0 },
    periodType: 'month',
    weekStartsOn: 1,
    monthStartDay: 1,
    theme: 'system',
  },
};

const lines = (csv: string) => csv.split('\r\n');

describe('expensesCsv', () => {
  const csv = expensesCsv(data);

  it('starts with a UTF-8 byte order mark, so Excel reads it correctly', () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(new TextEncoder().encode(csv).slice(0, 3)).toEqual(new Uint8Array([0xef, 0xbb, 0xbf]));
  });

  it('has the agreed columns', () => {
    expect(lines(csv.slice(1))[0]).toBe('date,category,item,amount,quantity,note');
  });

  it('lists the oldest first, with names rather than ids, and General for no item', () => {
    expect(lines(csv)[1]).toBe("2026-11-04,Boshqa so'm,General,25000,,");
  });

  it('quotes commas and doubles quotes', () => {
    expect(lines(csv)[2]).toBe('2026-11-05,Groceries,Chicken,60000,1 kg,"He said ""fresh"", really"');
  });

  it('ends each line with CRLF', () => {
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(lines(csv)).toHaveLength(4);
  });

  it('writes plain amounts with decimals, not smallest units or grouped text', () => {
    const usd = expensesCsv({
      ...data,
      settings: { ...data.settings, currency: { code: 'USD', symbol: '$', decimals: 2 } },
      expenses: [{ id: 'e', amount: 123_456, categoryId: 'other', date: '2026-11-04', createdAt: '' }],
    });
    expect(lines(usd)[1]).toBe("2026-11-04,Boshqa so'm,General,1234.56,,");
  });

  it('keeps line breaks inside a quoted note', () => {
    const multi = expensesCsv({
      ...data,
      expenses: [{ id: 'e', amount: 1, categoryId: 'other', date: '2026-11-04', note: 'a\nb', createdAt: '' }],
    });
    expect(multi).toContain('"a\nb"');
  });

  it('stops text being run as an Excel formula', () => {
    const risky = expensesCsv({
      ...data,
      expenses: [{ id: 'e', amount: 1, categoryId: 'other', date: '2026-11-04', note: '=HYPERLINK("x")', createdAt: '' }],
    });
    expect(lines(risky)[1]).toContain(`"'=HYPERLINK(""x"")"`);
  });
});

describe('incomeCsv', () => {
  const csv = incomeCsv(data);

  it('has a byte order mark and the agreed columns', () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(lines(csv.slice(1))[0]).toBe('date,source,amount,note');
  });

  it('lists the oldest first', () => {
    expect(lines(csv).slice(1, 3)).toEqual(['2026-11-01,Salary,5000000,', '2026-11-03,Gift,300,Birthday']);
  });
});

describe('backups', () => {
  it('round-trips everything and records the schema version', () => {
    const text = backupJson(data, '2026-11-05T12:00:00.000Z');
    expect(JSON.parse(text)).toMatchObject({ schemaVersion: SCHEMA_VERSION, exportedAt: '2026-11-05T12:00:00.000Z' });
    expect(parseBackup(text)).toEqual(data);
  });

  it.each([
    ['text that is not JSON', 'not json at all'],
    ['a JSON list', '[1, 2, 3]'],
    ['a different JSON file', '{"name": "package"}'],
    ['a newer version', JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1, data })],
    ['no version', JSON.stringify({ data })],
    ['missing lists', JSON.stringify({ schemaVersion: SCHEMA_VERSION, data: { incomes: [] } })],
    ['missing settings', JSON.stringify({ schemaVersion: SCHEMA_VERSION, data: { ...data, settings: null } })],
    ['a list that is not a list', JSON.stringify({ schemaVersion: SCHEMA_VERSION, data: { ...data, expenses: {} } })],
  ])('rejects %s', (_name, text) => {
    expect(() => parseBackup(text)).toThrow(BackupError);
  });
});

describe('applyOrder', () => {
  const entries = [
    { id: 'a', order: 0 },
    { id: 'b', order: 1 },
    { id: 'archived', order: 2 },
  ];

  it('sets the order from the ids, leaving others alone', () => {
    expect(applyOrder(entries, ['b', 'a'])).toEqual([
      { id: 'a', order: 1 },
      { id: 'b', order: 0 },
      { id: 'archived', order: 2 },
    ]);
  });
});
