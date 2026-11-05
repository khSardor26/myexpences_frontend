import { Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { en } from '@/i18n/en';
import { allNavItems, homeItem, settingsItem } from './navigation';

export function AppHeader({ onAdd }: { onAdd: () => void }) {
  const { pathname } = useLocation();
  const current = allNavItems.find((item) => item.to === pathname) ?? homeItem;
  const SettingsIcon = settingsItem.icon;

  const heading = useRef<HTMLHeadingElement>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    document.title = `${current.label} · ${en.appName}`;
  }, [current]);

  // A new page starts at the top, and screen readers and keyboards start at its heading.
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    window.scrollTo(0, 0);
    heading.current?.focus();
  }, [pathname]);

  return (
    <header className="h-16 border-b border-line">
      <div className="mx-auto flex h-full max-w-3xl items-center justify-between gap-2 px-4 md:px-8">
        <div className="min-w-0">
          <h1
            ref={heading}
            tabIndex={-1}
            className="truncate text-[1.75rem] leading-8 font-medium tracking-[-0.01em] outline-none"
          >
            {current.label}
          </h1>
        </div>
        {current !== settingsItem && (
          <Link
            to={settingsItem.to}
            aria-label={settingsItem.label}
            className="flex size-tap items-center justify-center text-muted hover:bg-primary-soft md:hidden"
          >
            <SettingsIcon aria-hidden className="size-5" />
          </Link>
        )}
        <div className="hidden md:block">
          <Button onClick={onAdd}>
            <Plus aria-hidden className="size-4" />
            {en.nav.add}
          </Button>
        </div>
      </div>
    </header>
  );
}
