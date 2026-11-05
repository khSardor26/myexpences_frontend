import { ChartPie, History, House, Settings, Wallet, type LucideIcon } from 'lucide-react';
import { en } from '@/i18n/en';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const homeItem: NavItem = { to: '/', label: en.nav.home, icon: House };
export const historyItem: NavItem = { to: '/history', label: en.nav.history, icon: History };
export const incomeItem: NavItem = { to: '/income', label: en.nav.income, icon: Wallet };
export const reportsItem: NavItem = { to: '/reports', label: en.nav.reports, icon: ChartPie };
export const settingsItem: NavItem = { to: '/settings', label: en.nav.settings, icon: Settings };

export const allNavItems = [homeItem, historyItem, incomeItem, reportsItem, settingsItem];
