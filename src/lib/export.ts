import { en } from '@/i18n/en';
import { amountToInput, type Currency } from './money';
import type { AppData } from './types';

/** The version of the backup file format. Increase it when the format changes. */
export const SCHEMA_VERSION = 1;

/** Makes Excel read the file as UTF-8, so so'm and Cyrillic text display correctly. */
const BOM = '﻿';

/** Excel runs text starting with these as a formula, so it's stored with a leading quote. */
const FORMULA_START = /^[=+\-@\t\r]/;

function csvCell(value: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

function toCsv(rows: string[][]): string {
  return BOM + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** A plain number Excel can add up: 1250000 or 12.50, with no spaces or symbol. */
const plainAmount = (amount: number, currency: Currency) =>
  amountToInput(amount, currency).replace(/\s/g, '');

const byDate = <T extends { date: string; createdAt: string }>(entries: T[]): T[] =>
  [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

export function expensesCsv({ expenses, categories, items, settings }: AppData): string {
  const header = ['date', 'category', 'item', 'amount', 'quantity', 'note'];
  const rows = byDate(expenses).map((expense) => [
    expense.date,
    categories.find((category) => category.id === expense.categoryId)?.name ?? '',
    items.find((item) => item.id === expense.itemId)?.name ?? en.expense.general,
    plainAmount(expense.amount, settings.currency),
    expense.quantity ?? '',
    expense.note ?? '',
  ]);
  return toCsv([header, ...rows]);
}

export function incomeCsv({ incomes, settings }: AppData): string {
  const header = ['date', 'source', 'amount', 'note'];
  const rows = byDate(incomes).map((income) => [
    income.date,
    income.source,
    plainAmount(income.amount, settings.currency),
    income.note ?? '',
  ]);
  return toCsv([header, ...rows]);
}

export function backupJson(data: AppData, exportedAt: string): string {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, exportedAt, data }, null, 2);
}

export class BackupError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Reads a backup file's text. This only checks that it is a backup at all:
 * the server checks every entry, and rejects the whole import if one is wrong.
 */
export function parseBackup(text: string): AppData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError(en.settings.backupNotJson);
  }

  if (!isRecord(parsed) || !isRecord(parsed.data)) throw new BackupError(en.settings.backupNotBackup);
  if (parsed.schemaVersion !== SCHEMA_VERSION) throw new BackupError(en.settings.backupWrongVersion);

  const { incomes, expenses, categories, items, incomeSources, settings } = parsed.data;
  const lists = [incomes, expenses, categories, items, incomeSources];
  if (!lists.every(Array.isArray) || !isRecord(settings)) throw new BackupError(en.settings.backupNotBackup);

  return parsed.data as unknown as AppData;
}

/** Asks the browser to save text as a file. */
export function downloadFile(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  // Some browsers cancel the download if the URL is released straight away.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
