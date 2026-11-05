import { X } from 'lucide-react';
import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { en } from '@/i18n/en';
import { ToastHost } from './ToastHost';

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet on mobile, centered modal from the md breakpoint up.
 * The native <dialog> provides the focus trap, Esc to close and the backdrop.
 * Children only exist while open, so a form always starts fresh. The element
 * marked data-autofocus gets focus when the sheet opens.
 */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // The browser fires this a frame after closing, so the sheet may already have reopened.
  const handleClose = () => {
    if (!ref.current?.open) onClose();
  };

  // A click whose target is the <dialog> itself landed on the backdrop.
  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === ref.current) onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={handleClose}
      onClick={closeOnBackdrop}
      className="sheet mx-0 mt-auto mb-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-card bg-surface text-ink md:m-auto md:max-w-lg md:rounded-card"
    >
      {open && (
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={en.common.close}
              className="flex size-tap items-center justify-center rounded-control text-muted hover:bg-primary-soft"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          {children}
          <ToastHost className="top-2" />
        </div>
      )}
    </dialog>
  );
}
