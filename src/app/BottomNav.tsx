import { Plus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { en } from '@/i18n/en';
import { historyItem, homeItem, incomeItem, reportsItem, type NavItem } from './navigation';

function Tab({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        `relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
          isActive
            ? 'font-medium text-ink before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-accent'
            : 'text-muted'
        }`
      }
    >
      <Icon aria-hidden strokeWidth={1.5} className="size-5" />
      {item.label}
    </NavLink>
  );
}

export function BottomNav({ onAdd }: { onAdd: () => void }) {
  return (
    <nav
      aria-label={en.nav.label}
      className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <Tab item={homeItem} />
      <Tab item={historyItem} />
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={onAdd}
          aria-label={en.nav.add}
          className="-mt-5 flex size-14 items-center justify-center bg-primary text-on-primary transition-colors hover:bg-accent-hover hover:text-white"
        >
          <Plus aria-hidden className="size-7" />
        </button>
      </div>
      <Tab item={incomeItem} />
      <Tab item={reportsItem} />
    </nav>
  );
}
