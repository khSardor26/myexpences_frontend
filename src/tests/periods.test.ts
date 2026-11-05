import { describe, expect, it } from 'vitest';
import { dateToSelect, formatPeriodLabel, getPeriod, shiftPeriod, type PeriodOptions } from '@/lib/dates';

const defaults: PeriodOptions = { weekStartsOn: 1, monthStartDay: 1 };
const startsOn10th: PeriodOptions = { weekStartsOn: 1, monthStartDay: 10 };

const range = (date: string, type: 'week' | 'month', options: PeriodOptions) => {
  const { start, end } = getPeriod(date, type, options);
  return [start, end];
};

describe('getPeriod: month starting on the 1st', () => {
  it('covers the whole calendar month', () => {
    expect(range('2026-11-05', 'month', defaults)).toEqual(['2026-11-01', '2026-11-30']);
  });

  it('keeps the first and last day of a month in that month', () => {
    expect(range('2026-11-01', 'month', defaults)).toEqual(['2026-11-01', '2026-11-30']);
    expect(range('2026-11-30', 'month', defaults)).toEqual(['2026-11-01', '2026-11-30']);
    expect(range('2026-12-01', 'month', defaults)).toEqual(['2026-12-01', '2026-12-31']);
  });
});

describe('getPeriod: month starting on the 10th', () => {
  it('runs from the 10th to the 9th', () => {
    expect(range('2026-11-15', 'month', startsOn10th)).toEqual(['2026-11-10', '2026-12-09']);
  });

  it('puts the 10th in the new period and the 9th in the old one', () => {
    expect(range('2026-11-10', 'month', startsOn10th)).toEqual(['2026-11-10', '2026-12-09']);
    expect(range('2026-11-09', 'month', startsOn10th)).toEqual(['2026-10-10', '2026-11-09']);
  });

  it('crosses New Year', () => {
    expect(range('2027-01-05', 'month', startsOn10th)).toEqual(['2026-12-10', '2027-01-09']);
  });

  it('handles the 31st when the previous month is shorter', () => {
    expect(range('2026-03-05', 'month', startsOn10th)).toEqual(['2026-02-10', '2026-03-09']);
    expect(range('2026-03-31', 'month', { ...defaults, monthStartDay: 28 })).toEqual([
      '2026-03-28',
      '2026-04-27',
    ]);
  });
});

describe('getPeriod: leap years', () => {
  it('includes Feb 29 in a leap year', () => {
    expect(range('2028-02-29', 'month', defaults)).toEqual(['2028-02-01', '2028-02-29']);
  });

  it('ends February on the 28th otherwise', () => {
    expect(range('2027-02-15', 'month', defaults)).toEqual(['2027-02-01', '2027-02-28']);
  });

  it('keeps Feb 29 inside a period that starts on the 10th', () => {
    expect(range('2028-02-29', 'month', startsOn10th)).toEqual(['2028-02-10', '2028-03-09']);
  });

  it('finds the period containing Feb 29 from a week', () => {
    expect(range('2028-02-29', 'week', defaults)).toEqual(['2028-02-28', '2028-03-05']);
  });
});

describe('getPeriod: weeks', () => {
  it('starts on Monday', () => {
    expect(range('2026-11-05', 'week', defaults)).toEqual(['2026-11-02', '2026-11-08']);
  });

  it('keeps Monday and Sunday in the same week', () => {
    expect(range('2026-11-02', 'week', defaults)).toEqual(['2026-11-02', '2026-11-08']);
    expect(range('2026-11-08', 'week', defaults)).toEqual(['2026-11-02', '2026-11-08']);
  });

  it('can start on Sunday instead', () => {
    expect(range('2026-11-05', 'week', { ...defaults, weekStartsOn: 0 })).toEqual([
      '2026-11-01',
      '2026-11-07',
    ]);
  });

  it('crosses New Year', () => {
    expect(range('2027-01-01', 'week', defaults)).toEqual(['2026-12-28', '2027-01-03']);
  });
});

describe('shiftPeriod', () => {
  it('moves between months', () => {
    const november = getPeriod('2026-11-05', 'month', defaults);
    expect(shiftPeriod(november, -1, defaults)).toMatchObject({ start: '2026-10-01', end: '2026-10-31' });
    expect(shiftPeriod(november, 1, defaults)).toMatchObject({ start: '2026-12-01', end: '2026-12-31' });
  });

  it('keeps the start day and crosses New Year', () => {
    const period = getPeriod('2026-12-15', 'month', startsOn10th);
    expect(shiftPeriod(period, 1, startsOn10th)).toMatchObject({ start: '2027-01-10', end: '2027-02-09' });
  });

  it('moves between weeks', () => {
    const week = getPeriod('2026-11-05', 'week', defaults);
    expect(shiftPeriod(week, -1, defaults)).toMatchObject({ start: '2026-10-26', end: '2026-11-01' });
  });
});

describe('dateToSelect', () => {
  const today = '2026-11-05';

  it('is today for the period containing today', () => {
    expect(dateToSelect(getPeriod(today, 'month', defaults), today)).toBe(today);
    expect(dateToSelect(getPeriod(today, 'week', defaults), today)).toBe(today);
  });

  it('is the first day for any other period', () => {
    expect(dateToSelect(getPeriod('2026-10-15', 'month', defaults), today)).toBe('2026-10-01');
    expect(dateToSelect(getPeriod('2026-12-15', 'month', defaults), today)).toBe('2026-12-01');
  });

  it('stays on the current period when going away, back, and switching to Week and Month', () => {
    let selected = today;
    const go = (type: 'week' | 'month', offset: number) => {
      selected = dateToSelect(shiftPeriod(getPeriod(selected, type, defaults), offset, defaults), today);
    };

    go('month', 1);
    go('month', -1);
    expect(getPeriod(selected, 'week', defaults)).toMatchObject({ start: '2026-11-02', end: '2026-11-08' });

    go('week', -1);
    go('week', 1);
    expect(getPeriod(selected, 'month', defaults)).toMatchObject({ start: '2026-11-01', end: '2026-11-30' });
  });
});

describe('formatPeriodLabel', () => {
  it('labels a month', () => {
    expect(formatPeriodLabel(getPeriod('2026-11-05', 'month', defaults))).toBe(
      'November 2026 (Nov 1 – Nov 30)',
    );
  });

  it('names a shifted month after the month it starts in', () => {
    expect(formatPeriodLabel(getPeriod('2026-12-05', 'month', startsOn10th))).toBe(
      'November 2026 (Nov 10 – Dec 9)',
    );
  });

  it('labels a week', () => {
    expect(formatPeriodLabel(getPeriod('2026-11-05', 'week', defaults))).toBe('Nov 2 – Nov 8, 2026');
  });

  it('shows both years for a week that crosses New Year', () => {
    expect(formatPeriodLabel(getPeriod('2027-01-01', 'week', defaults))).toBe(
      'Dec 28, 2026 – Jan 3, 2027',
    );
  });
});
