'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Phone,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Loader2,
  X,
} from 'lucide-react';
import type { CustomerListItem } from '@pavilion/db';

interface CustomersListViewProps {
  initialCustomers?: CustomerListItem[];
}

export function CustomersListView({
  initialCustomers = [],
}: CustomersListViewProps) {
  const [customers, setCustomers] = useState<CustomerListItem[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/customers?q=${encodeURIComponent(search)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok) setCustomers(json.customers || []);
        }
      } catch (err) {
        console.error('Failed to search customers:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            Customers Directory
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Player match history, lifetime spend, and attendance tracking
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full h-9 pl-9 pr-8 text-xs bg-surface border border-border rounded text-ink placeholder:text-ink-faint focus:outline-hidden focus:border-navy focus:ring-1 focus:ring-navy/20 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Customer List Table */}
      <div className="border border-border rounded-lg bg-surface shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-ink-faint flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading players...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-soft space-y-1">
            <p className="font-semibold text-navy text-sm">No customers found</p>
            <p className="text-ink-faint">Try searching with a different name or phone number.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {customers.map((c) => (
              <Link
                key={c.id}
                href={`/admin/customers/${c.id}`}
                className="p-4 hover:bg-surface-2/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left: Identity */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-navy text-sm group-hover:text-gold transition">
                      {c.name}
                    </span>
                    {c.isBlocked && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-danger-soft text-danger uppercase">
                        <ShieldAlert className="w-3 h-3" />
                        BLOCKED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-soft">
                    <span className="font-mono text-ink-faint">{c.phone}</span>
                    {c.email && (
                      <>
                        <span>·</span>
                        <span>{c.email}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Metrics & Arrow */}
                <div className="flex items-center gap-6 text-xs text-right">
                  <div className="hidden sm:block">
                    <span className="text-ink font-semibold">
                      {c.bookingCount} booking{c.bookingCount === 1 ? '' : 's'}
                    </span>
                    <p className="text-[11px] text-ink-faint">Lifetime bookings</p>
                  </div>

                  <div>
                    <span className="font-bold text-navy text-sm tabular-nums">
                      ₹{(c.totalSpentPaise / 100).toLocaleString('en-IN')}
                    </span>
                    <p className="text-[11px] text-ink-faint">Total spent</p>
                  </div>

                  <div className="hidden sm:block min-w-[70px]">
                    {c.noShowCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-warn-soft text-warn">
                        <AlertTriangle className="w-3 h-3" />
                        {c.noShowCount} no-show{c.noShowCount === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-ink-faint font-medium">
                        0 no-shows
                      </span>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-ink-faint group-hover:text-navy transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
