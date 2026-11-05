import { WalletCards } from 'lucide-react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { en } from '@/i18n/en';
import { allNavItems, settingsItem, type NavItem } from './navigation';

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <RouterNavLink
      to={item.to}
      end={item.to === '/'}
      aria-label={item.label}
      className={({ isActive }) =>
        `group relative flex min-h-tap w-full items-center justify-center px-0 ${
          isActive
            ? 'bg-primary-soft font-medium text-ink shadow-[inset_2px_0_0_var(--accent)]'
            : 'text-muted hover:bg-primary-soft hover:text-ink'
        }`
      }
    >
      <Icon aria-hidden strokeWidth={1.5} className="size-6" />
      <span className="pointer-events-none absolute left-[calc(100%+0.5rem)] top-1/2 z-30 -translate-y-1/2 whitespace-nowrap border border-line bg-surface px-3 py-2 text-sm text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
        {item.label}
      </span>
    </RouterNavLink>
  );
}

export function Sidebar() {
  const mainItems = allNavItems.filter((item) => item !== settingsItem);

  return (
    <nav
      aria-label={en.nav.label}
      className="fixed inset-y-0 left-0 z-20 hidden w-tap flex-col border-r border-line bg-sidebar md:flex"
    >
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-line">
        <WalletCards aria-label={en.appName} className="size-6 text-ink" strokeWidth={1.5} />
      </div>
      <div className="flex flex-1 flex-col gap-px p-0">
        {mainItems.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
        <div className="mt-auto">
          <SidebarLink item={settingsItem} />
        </div>
      </div>
    </nav>
  );
}
