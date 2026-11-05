import { useEffect } from 'react';
import { useToastStore } from '@/store/toastStore';

const VISIBLE_MS = 8000;

/**
 * Shows the current toast. The app has one host, and each open Sheet has its own,
 * because everything behind a modal dialog can't be clicked.
 */
export function ToastHost({ className }: { className: string }) {
  const toast = useToastStore((state) => state.toast);
  const dismiss = useToastStore((state) => state.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  return (
    // Always in the page, so screen readers announce a toast when it appears.
    <div
      role="status"
      className={`pointer-events-none fixed inset-x-4 z-20 flex justify-center ${className}`}
    >
      {toast && (
        <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-control bg-ink py-1 pr-1 pl-4 text-canvas shadow-lg">
          <p className="py-2">{toast.message}</p>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.run();
                dismiss();
              }}
              className="min-h-tap shrink-0 rounded-control px-3 font-bold uppercase underline underline-offset-2"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
