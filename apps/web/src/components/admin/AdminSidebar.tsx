'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  CalendarDays,
  Users,
  Lock,
  Settings,
  BarChart3,
  Palette,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Book a slot', href: '/admin/book', icon: PlusCircle },
  { label: 'Calendar', href: '/admin/calendar', icon: CalendarDays },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Daily Close', href: '/admin/close', icon: Lock },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings/courts', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col justify-between w-60 bg-navy text-white min-h-screen p-5 border-r border-border-dark select-none shrink-0">
      <div>
        {/* Luxury Brand Lockup */}
        <div className="mb-8 pt-2">
          <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-0.5">
            The
          </p>
          <h1 className="text-xl font-bold tracking-widest uppercase text-white leading-none">
            PAVILION
          </h1>
          <p className="text-xs italic text-ink-on-dark/70 mt-1 font-medium">
            Club · Front Desk
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded transition ${
                  isActive
                    ? 'bg-gold text-navy font-semibold shadow-sm'
                    : 'text-ink-on-dark/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-navy' : 'text-gold'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Theme Preview Shortcut */}
      <div className="pt-4 border-t border-border-dark space-y-2 text-xs">
        <Link
          href="/admin/theme"
          className={`flex items-center gap-2 px-2.5 py-2 rounded transition ${
            pathname === '/admin/theme'
              ? 'bg-white/15 text-gold font-semibold'
              : 'text-ink-on-dark/60 hover:text-gold hover:bg-white/5'
          }`}
        >
          <Palette className="w-4 h-4 text-gold" />
          <span>Brand Design Tokens</span>
        </Link>
      </div>
    </aside>
  );
}
