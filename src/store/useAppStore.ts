import { useCallback, useMemo } from 'react';
import { useStore } from 'zustand';
import { createApiClient } from '@/lib/api';
import { getPeriod } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { AppData, Period } from '@/lib/types';
import { createAppStore, type AppState } from './appStore';

const appStore = createAppStore(createApiClient());

void appStore.getState().start();

export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useStore(appStore, selector);
}

/** The user's data. Only for screens shown once the app is ready. */
export function useAppData(): AppData {
  const data = useAppStore((state) => state.data);
  if (!data) throw new Error('useAppData used before the data loaded');
  return data;
}

/** The budget period being viewed. */
export function useSelectedPeriod(): Period {
  const { settings } = useAppData();
  const selectedDate = useAppStore((state) => state.selectedDate);
  return useMemo(
    () => getPeriod(selectedDate, settings.periodType, settings),
    [selectedDate, settings],
  );
}

/** formatMoney using the user's currency. */
export function useFormatMoney(): (amount: number) => string {
  const { currency } = useAppData().settings;
  return useCallback((amount) => formatMoney(amount, currency), [currency]);
}
