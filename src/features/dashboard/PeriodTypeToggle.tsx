import { useState } from 'react';
import { Segmented } from '@/components/ui/Segmented';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import type { PeriodType } from '@/lib/types';
import { useToastStore } from '@/store/toastStore';
import { useAppData, useAppStore } from '@/store/useAppStore';

const OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'week', label: en.dashboard.week },
  { value: 'month', label: en.dashboard.month },
];

/** Changes the one saved period type, so it is the same value Settings will show. */
export function PeriodTypeToggle() {
  const { periodType } = useAppData().settings;
  const updateSettings = useAppStore((state) => state.updateSettings);
  const showToast = useToastStore((state) => state.showToast);
  const [saving, setSaving] = useState(false);

  const choose = async (type: PeriodType) => {
    if (type === periodType) return;
    setSaving(true);
    try {
      await updateSettings({ periodType: type });
    } catch (caught) {
      showToast(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex justify-center">
      <Segmented
        label={en.dashboard.periodType}
        options={OPTIONS}
        value={periodType}
        disabled={saving}
        onChange={(type) => void choose(type)}
      />
    </div>
  );
}
