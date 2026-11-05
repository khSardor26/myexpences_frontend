import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { CategoriesCard } from './CategoriesCard';
import { CurrencyCard } from './CurrencyCard';
import { DataCard } from './DataCard';
import { PreferencesCard } from './PreferencesCard';
import { SecurityCard } from './SecurityCard';

function AccountCard() {
  const email = useAppStore((state) => state.user?.email);
  const logout = useAppStore((state) => state.logout);
  const [error, setError] = useState<string | null>(null);

  const signOut = async () => {
    setError(null);
    try {
      await logout();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="section-title">{en.auth.account}</h2>
          <p className="mt-1 text-sm break-all">{email}</p>
        </div>
        <Button variant="secondary" onClick={() => void signOut()}>
          {en.auth.signOut}
        </Button>
      </div>
      {error && (
        <p role="alert" className="rounded-control border border-warning p-3">
          {error}
        </p>
      )}
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PreferencesCard />
      <CurrencyCard />
      <CategoriesCard />
      <DataCard />
      <SecurityCard />
      <AccountCard />
    </div>
  );
}
