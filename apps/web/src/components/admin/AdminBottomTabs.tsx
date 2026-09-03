'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  CalendarDays,
  Users,
  Lock,
} from 'lucide-react';

const MOBILE_TABS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Book', href: '/admin/book', icon: PlusCircle },
  { label: 'Calendar', href: '/admin/calendar', icon: CalendarDays },
  { label: 'Players', href: '/admin/customers', icon: Users },
  { label: 'Close', href: '/admin/close', icon: Lock },
];

export function AdminBottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center justify-around px-2 z-50 shadow-lg">
      {MOBILE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition ${
              isActive
                ? 'text-navy'
                : 'text-ink-faint hover:text-ink-soft'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 mb-0.5 ${
                  isActive ? 'text-accent' : 'text-ink-faint'
                }`}
              />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
              )}
            </div>
            <span className={isActive ? 'font-bold' : 'font-medium'}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
