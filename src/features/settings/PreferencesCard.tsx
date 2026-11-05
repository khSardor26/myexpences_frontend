import { Card } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { SelectField } from '@/components/ui/SelectField';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import type { Settings } from '@/lib/types';
import { useToastStore } from '@/store/toastStore';
import { useAppData, useAppStore } from '@/store/useAppStore';

const THEMES: { value: Settings['theme']; label: string }[] = [
  { value: 'system', label: en.settings.themeSystem },
  { value: 'light', label: en.settings.themeLight },
  { value: 'dark', label: en.settings.themeDark },
];

const MONTH_DAYS = Array.from({ length: 28 }, (_, index) => index + 1);

export function PreferencesCard() {
  const { settings } = useAppData();
  const updateSettings = useAppStore((state) => state.updateSettings);
  const showToast = useToastStore((state) => state.showToast);

  const save = async (changes: Partial<Settings>) => {
    try {
      await updateSettings(changes);
    } catch (caught) {
      showToast(errorMessage(caught));
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="section-title">{en.settings.preferences}</h2>

      <div className="flex flex-col items-start gap-1">
        <p className="font-medium">{en.settings.periodType}</p>
        <Segmented
          label={en.settings.periodType}
          options={[
            { value: 'week', label: en.dashboard.week },
            { value: 'month', label: en.dashboard.month },
          ]}
          value={settings.periodType}
          onChange={(periodType) => void save({ periodType })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={en.settings.weekStart}
          value={settings.weekStartsOn}
          onChange={(event) => void save({ weekStartsOn: event.target.value === '0' ? 0 : 1 })}
        >
          <option value={1}>{en.settings.monday}</option>
          <option value={0}>{en.settings.sunday}</option>
        </SelectField>

        <SelectField
          label={en.settings.monthStart}
          value={settings.monthStartDay}
          onChange={(event) => void save({ monthStartDay: Number(event.target.value) })}
        >
          {MONTH_DAYS.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="flex flex-col items-start gap-1">
        <p className="font-medium">{en.settings.theme}</p>
        <Segmented
          label={en.settings.theme}
          options={THEMES}
          value={settings.theme}
          onChange={(theme) => void save({ theme })}
        />
      </div>
    </Card>
  );
}
