'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  Tag,
  ShieldAlert,
  Users,
  Handshake,
  Sliders,
} from 'lucide-react';

const SETTINGS_TABS = [
  { label: 'Courts & Hours', href: '/admin/settings/courts', icon: Layers },
  { label: 'Price Rules', href: '/admin/settings/pricing', icon: Tag },
  { label: 'Blackouts', href: '/admin/settings/blackouts', icon: ShieldAlert },
  { label: 'Staff Accounts', href: '/admin/settings/staff', icon: Users },
  { label: 'Partners (Turf Town)', href: '/admin/settings/partners', icon: Handshake },
  { label: 'Venue Settings', href: '/admin/settings/venue', icon: Sliders },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border pb-1 overflow-x-auto">
      <nav className="flex items-center gap-2 min-w-max">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition ${
                isActive
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-ink-soft hover:text-ink hover:bg-surface-2'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gold' : 'text-ink-faint'}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
