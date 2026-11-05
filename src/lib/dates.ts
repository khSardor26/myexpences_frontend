import {
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  setDate,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import { en } from '@/i18n/en';
import type { Period, PeriodType, Settings } from './types';

/** Dates are stored as local calendar days ("YYYY-MM-DD"), never as UTC instants. */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(iso: string): Date {
  return parseISO(iso);
}

export function previousDay(iso: string): string {
  return toISODate(subDays(parseISODate(iso), 1));
}

/** "Nov 5" */
export function formatShortDate(iso: string): string {
  return format(parseISODate(iso), 'MMM d');
}

/** "Today", "Yesterday", "Tue, Nov 3", or "Wed, Nov 5, 2025" for another year. */
export function formatDayLabel(iso: string, today: Date = new Date()): string {
  const date = parseISODate(iso);
  if (isSameDay(date, today)) return en.common.today;
  if (isSameDay(date, subDays(today, 1))) return en.common.yesterday;
  return format(date, date.getFullYear() === today.getFullYear() ? 'EEE, MMM d' : 'EEE, MMM d, yyyy');
}

/** A short chart axis label: "Mon" in a week, "5" in a month. */
export function formatAxisDay(iso: string, type: PeriodType): string {
  return format(parseISODate(iso), type === 'week' ? 'EEE' : 'd');
}

export type PeriodOptions =Pick<Settings, 'weekStartsOn' | 'monthStartDay'>;

/** The period of the given type that contains `date`. */
export function getPeriod(date: string, type: PeriodType, options: PeriodOptions): Period {
  const day = parseISODate(date);

  if (type === 'week') {
    const weekOptions = { weekStartsOn: options.weekStartsOn };
    return {
      type,
      start: toISODate(startOfWeek(day, weekOptions)),
      end: toISODate(endOfWeek(day, weekOptions)),
    };
  }

  // Before the start day, the date still belongs to the period that began last month.
  const firstOfMonth = startOfMonth(day);
  const startMonth = day.getDate() < options.monthStartDay ? subMonths(firstOfMonth, 1) : firstOfMonth;
  const start = setDate(startMonth, options.monthStartDay);

  return {
    type,
    start: toISODate(start),
    end: toISODate(subDays(addMonths(start, 1), 1)),
  };
}

/** The period `offset` steps away: -1 is the previous period, 1 is the next. */
export function shiftPeriod(period: Period, offset: number, options: PeriodOptions): Period {
  const start = parseISODate(period.start);
  const shifted = period.type === 'week' ? addWeeks(start, offset) : addMonths(start, offset);
  return getPeriod(toISODate(shifted), period.type, options);
}

/**
 * The date to remember for a period being moved to. It's today if the period contains
 * today, so that switching between Week and Month stays on the current period.
 */
export function dateToSelect(period: Period, today: string): string {
  return today >= period.start && today <= period.end ? today : period.start;
}

/**
 * Month: "November 2026 (Nov 1 – Nov 30)", named after the month it starts in.
 * Week: "Nov 2 – Nov 8, 2026", with both years if it crosses New Year.
 */
export function formatPeriodLabel(period: Period): string {
  const start = parseISODate(period.start);
  const end = parseISODate(period.end);

  if (period.type === 'month') {
    return `${format(start, 'MMMM yyyy')} (${format(start, 'MMM d')} – ${format(end, 'MMM d')})`;
  }

  const startFormat = start.getFullYear() === end.getFullYear() ? 'MMM d' : 'MMM d, yyyy';
  return `${format(start, startFormat)} – ${format(end, 'MMM d, yyyy')}`;
}
