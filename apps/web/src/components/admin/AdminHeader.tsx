'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LogOut, ShieldCheck } from 'lucide-react';

interface AdminHeaderProps {
  user?: {
    name: string;
    role: string;
    phone: string;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  // Global '/' keyboard listener to auto-focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  }

  return (
    <header className="h-16 bg-surface border-b border-border px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
      {/* Global Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
            }
          }}
          placeholder="Search by customer phone, name, or booking ref... (Press '/' to focus)"
          className="w-full h-9 pl-9 pr-8 text-xs bg-surface-2/60 border border-border rounded text-ink placeholder:text-ink-faint focus:outline-none focus:border-navy focus:bg-surface transition"
        />
        <kbd className="hidden sm:inline-flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[10px] font-mono text-ink-faint bg-surface border border-border rounded pointer-events-none">
          /
        </kbd>
      </div>

      {/* Right Controls: Engine Status + User Profile + Logout */}
      <div className="flex items-center gap-3">
        {/* Live Engine Status */}
        <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-ok-soft text-ok border border-ok/20">
          <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
          Engine Online · 3 Courts
        </span>

        {/* Staff Identity */}
        <div className="flex items-center gap-2 text-right">
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-navy leading-tight">
              {user?.name || 'Suresh Kumar'}
            </p>
            <p className="text-[10px] uppercase font-bold text-accent tracking-wider">
              {user?.role || 'desk'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-navy text-gold flex items-center justify-center font-bold text-xs border border-gold/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          title="Sign out of counter terminal"
          className="p-2 rounded border border-border hover:bg-danger-soft hover:text-danger hover:border-danger/30 text-ink-soft transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
