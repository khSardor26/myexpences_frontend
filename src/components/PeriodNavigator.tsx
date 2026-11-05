import { ChevronLeft, ChevronRight } from 'lucide-react';
import { en } from '@/i18n/en';
import { dateToSelect, formatPeriodLabel, shiftPeriod, todayISO } from '@/lib/dates';
import { useAppData, useAppStore, useSelectedPeriod } from '@/store/useAppStore';

const arrowClass =
  'flex size-tap shrink-0 items-center justify-center rounded-control text-muted hover:bg-primary-soft';

/** The ‹ › arrows and label for the budget period being viewed. */
export function PeriodNavigator() {
  const period = useSelectedPeriod();
  const { settings } = useAppData();
  const selectDate = useAppStore((state) => state.selectDate);

  const go = (offset: number) =>
    selectDate(dateToSelect(shiftPeriod(period, offset, settings), todayISO()));

  return (
    <div className="flex items-center justify-between gap-1">
      <button type="button" onClick={() => go(-1)} aria-label={en.period.previous} className={arrowClass}>
        <ChevronLeft aria-hidden className="size-5" />
      </button>
      <p aria-live="polite" className="text-center font-medium text-balance tabular-nums">
        {formatPeriodLabel(period)}
      </p>
      <button type="button" onClick={() => go(1)} aria-label={en.period.next} className={arrowClass}>
        <ChevronRight aria-hidden className="size-5" />
      </button>
    </div>
  );
}
