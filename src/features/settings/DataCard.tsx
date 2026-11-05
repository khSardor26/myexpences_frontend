import { Download, RotateCcw, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { en } from '@/i18n/en';
import { todayISO } from '@/lib/dates';
import { backupJson, BackupError, downloadFile, expensesCsv, incomeCsv, parseBackup } from '@/lib/export';
import type { AppData } from '@/lib/types';
import { useToastStore } from '@/store/toastStore';
import { useAppData, useAppStore } from '@/store/useAppStore';

const CSV = 'text/csv;charset=utf-8';

export function DataCard() {
  const data = useAppData();
  const importData = useAppStore((state) => state.importData);
  const resetData = useAppStore((state) => state.resetData);
  const showToast = useToastStore((state) => state.showToast);

  const fileInput = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<AppData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // so choosing the same file again still fires this
    if (!file) return;

    setImportError(null);
    try {
      setBackup(parseBackup(await file.text()));
    } catch (caught) {
      setImportError(caught instanceof BackupError ? caught.message : en.settings.backupNotJson);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="section-title">{en.settings.data}</h2>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{en.settings.export}</h3>
        <div className="grid gap-2 lg:grid-cols-3">
          <Button
            variant="secondary"
            onClick={() => downloadFile(`myexpenses-backup-${todayISO()}.json`, backupJson(data, new Date().toISOString()), 'application/json')}
          >
            <Download aria-hidden className="size-4" />
            {en.settings.exportJson}
          </Button>
          <Button variant="secondary" onClick={() => downloadFile('expenses.csv', expensesCsv(data), CSV)}>
            <Download aria-hidden className="size-4" />
            {en.settings.exportExpenses}
          </Button>
          <Button variant="secondary" onClick={() => downloadFile('income.csv', incomeCsv(data), CSV)}>
            <Download aria-hidden className="size-4" />
            {en.settings.exportIncome}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{en.settings.import}</h3>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          aria-label={en.settings.importChoose}
          onChange={(event) => void chooseFile(event)}
          className="sr-only"
          tabIndex={-1}
        />
        <Button variant="secondary" onClick={() => fileInput.current?.click()}>
          <Upload aria-hidden className="size-4" />
          {en.settings.importChoose}
        </Button>
        {importError && (
          <p role="alert" className="rounded-control border border-warning p-3">
            {importError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{en.settings.reset}</h3>
        <Button variant="secondary" onClick={() => setResetStep(1)}>
          <RotateCcw aria-hidden className="size-4" />
          {en.settings.resetAction}
        </Button>
      </div>

      <ConfirmSheet
        open={backup !== null}
        title={en.settings.importConfirmTitle}
        body={en.settings.importConfirmBody(backup?.incomes.length ?? 0, backup?.expenses.length ?? 0)}
        confirmLabel={en.settings.importConfirmAction}
        onConfirm={async () => {
          if (backup) await importData(backup);
          setBackup(null);
          showToast(en.settings.imported);
        }}
        onClose={() => setBackup(null)}
      />

      <ConfirmSheet
        open={resetStep === 1}
        title={en.settings.resetFirstTitle}
        body={en.settings.resetFirstBody}
        confirmLabel={en.settings.resetContinue}
        onConfirm={() => setResetStep(2)}
        onClose={() => setResetStep(0)}
      />

      <ConfirmSheet
        open={resetStep === 2}
        title={en.settings.resetSecondTitle}
        body={en.settings.resetSecondBody}
        confirmLabel={en.settings.resetConfirmAction}
        onConfirm={async () => {
          await resetData();
          setResetStep(0);
          showToast(en.settings.resetDone);
        }}
        onClose={() => setResetStep(0)}
      />
    </Card>
  );
}
