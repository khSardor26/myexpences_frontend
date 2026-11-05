import { useState, type ReactNode } from 'react';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import { Button } from './Button';
import { Sheet } from './Sheet';

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  children?: ReactNode;
}

/** Asks before something that can't be undone. Stays open and shows why if it fails. */
export function ConfirmSheet({ open, title, body, confirmLabel, onConfirm, onClose, children }: ConfirmSheetProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} title={title} onClose={close}>
      <div className="flex flex-col gap-4">
        <p>{body}</p>
        {children}
        {error && (
          <p role="alert" className="rounded-control border border-warning p-3">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            {en.common.cancel}
          </Button>
          <Button variant="danger" disabled={busy} onClick={() => void confirm()} className="disabled:opacity-60">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
