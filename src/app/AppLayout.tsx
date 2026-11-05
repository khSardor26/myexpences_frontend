import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sheet } from '@/components/ui/Sheet';
import { ToastHost } from '@/components/ui/ToastHost';
import { ExpenseForm } from '@/features/expenses/ExpenseForm';
import { en } from '@/i18n/en';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const [addOpen, setAddOpen] = useState(false);
  const openAdd = () => setAddOpen(true);
  const closeAdd = () => setAddOpen(false);

  return (
    <div className="min-h-dvh md:pl-tap">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:rounded-control focus:bg-surface focus:p-3"
      >
        {en.skipToContent}
      </a>
      <Sidebar />
      <AppHeader onAdd={openAdd} />
      <main id="main" className="mx-auto max-w-3xl px-4 pt-4 pb-28 md:px-8 md:pb-8">
        <Outlet />
      </main>
      <BottomNav onAdd={openAdd} />
      <ToastHost className="app-toast bottom-24 md:bottom-6 md:left-tap" />
      <Sheet open={addOpen} title={en.expense.addTitle} onClose={closeAdd}>
        <ExpenseForm onDone={closeAdd} />
      </Sheet>
    </div>
  );
}
