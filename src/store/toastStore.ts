import { create } from 'zustand';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: number;
  message: string;
  action?: ToastAction;
}

interface ToastState {
  toast: Toast | null;
  showToast(message: string, action?: ToastAction): void;
  dismissToast(): void;
}

let nextId = 1;

/** One toast at a time: a new one replaces the last. */
export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  showToast: (message, action) => set({ toast: { id: nextId++, message, action } }),
  dismissToast: () => set({ toast: null }),
}));
