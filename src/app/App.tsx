import { CloudOff } from 'lucide-react';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuthPage } from '@/features/auth/AuthPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { HistoryPage } from '@/features/history/HistoryPage';
import { IncomePage } from '@/features/income/IncomePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { en } from '@/i18n/en';
import { useAppStore } from '@/store/useAppStore';
import { AppLayout } from './AppLayout';

// The chart library is large, so it only downloads when Reports is opened.
const ReportsPage = lazy(() =>
  import('@/features/reports/ReportsPage').then((module) => ({ default: module.ReportsPage })),
);

function LoadingScreen() {
  return (
    <main role="status" className="flex min-h-dvh items-center justify-center text-muted">
      {en.common.loading}
    </main>
  );
}

function LoadFailedScreen() {
  const retry = useAppStore((state) => state.start);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-4">
      <EmptyState
        icon={CloudOff}
        title={en.errors.loadTitle}
        body={en.errors.loadBody}
        action={<Button onClick={() => void retry()}>{en.common.retry}</Button>}
      />
    </main>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="income" element={<IncomePage />} />
          <Route
            path="reports"
            element={
              <Suspense fallback={<p role="status" className="py-8 text-center text-muted">{en.common.loading}</p>}>
                <ReportsPage />
              </Suspense>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

/** Applies the saved theme. "System" removes the override, so the stylesheet follows the device. */
function useTheme() {
  const theme = useAppStore((state) => state.data?.settings.theme);

  useEffect(() => {
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }, [theme]);
}

export function App() {
  const status = useAppStore((state) => state.status);
  useTheme();

  switch (status) {
    case 'loading':
      return <LoadingScreen />;
    case 'signedOut':
      return <AuthPage />;
    case 'error':
      return <LoadFailedScreen />;
    case 'ready':
      return <AppRoutes />;
  }
}
