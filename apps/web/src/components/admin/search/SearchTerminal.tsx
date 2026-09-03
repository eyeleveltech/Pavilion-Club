'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Globe,
  PhoneCall,
  Flame,
  X,
} from 'lucide-react';
import type { SearchBookingResult, DaySlotBooking } from '@pavilion/db';
import { BookingDetailSheet } from '../calendar/BookingDetailSheet';

interface SearchTerminalProps {
  initialQuery?: string;
  initialResults?: SearchBookingResult[];
}

export function SearchTerminal({
  initialQuery = '',
  initialResults = [],
}: SearchTerminalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQuery || searchParams.get('q') || '');
  const [results, setResults] = useState<SearchBookingResult[]>(initialResults);
  const [isSearching, setIsSearching] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'unpaid' | 'partner'>('all');

  // Slide-over detail sheet state
  const [activeBooking, setActiveBooking] = useState<{
    booking: DaySlotBooking;
    courtName: string;
    timeLabel: string;
    dateFormatted: string;
  } | null>(null);

  // Focus search box on mount and on '/' key
  useEffect(() => {
    inputRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Perform search with debounce
  const performSearch = useCallback(async (searchTerm: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.ok) {
          setResults(json.results || []);
        }
      }
    } catch (err) {
      console.error('Search query failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Filtered results
  const filteredResults = results.filter((r) => {
    if (filterMode === 'today') return r.isToday;
    if (filterMode === 'unpaid') return !r.isPaid;
    if (filterMode === 'partner') return r.isPartner;
    return true;
  });

  const getChannelBadge = (code: string, isPartner: boolean) => {
    if (isPartner || code === 'turftown') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-navy text-gold">
          <Flame className="w-3 h-3 text-gold" />
          TURF TOWN
        </span>
      );
    }
    if (code === 'website') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-info-soft text-info">
          <Globe className="w-3 h-3" />
          WEBSITE
        </span>
      );
    }
    if (code === 'phone') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-surface-2 text-ink">
          <PhoneCall className="w-3 h-3" />
          PHONE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-surface-2 text-ink">
        <MapPin className="w-3 h-3" />
        WALK-IN
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          Find a booking
        </h1>
        <p className="text-xs text-ink-soft mt-0.5">
          Instant lookup across our reference, Turf Town ref, phone number, and player name
        </p>
      </div>

      {/* Main Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-ink-faint absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type our reference (PC-...), Turf Town ref (TT-...), phone digits, or customer name..."
          className="w-full h-14 pl-12 pr-12 text-sm md:text-base font-medium bg-surface border border-border rounded-lg text-ink placeholder:text-ink-faint shadow-xs focus:outline-hidden focus:border-navy focus:ring-2 focus:ring-navy/10 transition"
        />

        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-surface-2 text-ink-soft"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center justify-center absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-xs font-mono text-ink-faint bg-surface-2 border border-border rounded pointer-events-none">
            /
          </kbd>
        )}
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="inline-flex p-1 rounded-lg bg-surface-2 border border-border text-xs font-semibold">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-md transition ${
              filterMode === 'all'
                ? 'bg-surface text-navy shadow-xs border border-border/60'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            All Results ({results.length})
          </button>

          <button
            onClick={() => setFilterMode('today')}
            className={`px-3 py-1.5 rounded-md transition ${
              filterMode === 'today'
                ? 'bg-surface text-navy shadow-xs border border-border/60'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Today Only
          </button>

          <button
            onClick={() => setFilterMode('unpaid')}
            className={`px-3 py-1.5 rounded-md transition ${
              filterMode === 'unpaid'
                ? 'bg-surface text-navy shadow-xs border border-border/60'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Unpaid ⚠️
          </button>

          <button
            onClick={() => setFilterMode('partner')}
            className={`px-3 py-1.5 rounded-md transition ${
              filterMode === 'partner'
                ? 'bg-surface text-navy shadow-xs border border-border/60'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Turf Town
          </button>
        </div>

        {isSearching && (
          <span className="text-xs text-ink-faint flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Searching...
          </span>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-2.5">
        {filteredResults.length === 0 ? (
          <div className="p-12 text-center border border-border rounded-lg bg-surface space-y-2">
            <p className="text-sm font-semibold text-navy">No bookings found</p>
            <p className="text-xs text-ink-soft">
              {query
                ? `No booking matching "${query}". Try searching by phone digits or partner ID.`
                : 'Type above to search across all bookings.'}
            </p>
          </div>
        ) : (
          filteredResults.map((b) => (
            <div
              key={b.id}
              onClick={() =>
                setActiveBooking({
                  booking: {
                    id: b.id,
                    reference: b.reference,
                    customerName: b.customerName,
                    customerPhone: b.customerPhone,
                    channelCode: b.channelCode,
                    channelName: b.channelName,
                    isOnline: b.isOnline,
                    isPartner: b.isPartner,
                    partnerReference: b.partnerReference,
                    amountPaise: b.amountPaise,
                    paidPaise: b.paidPaise,
                    isPaid: b.isPaid,
                    status: b.status,
                  },
                  courtName: b.courtName,
                  timeLabel: b.timeLabel,
                  dateFormatted: b.dateFormatted,
                })
              }
              className={`p-4 rounded-lg border bg-surface hover:bg-surface-2 transition cursor-pointer shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                b.isToday
                  ? 'border-navy/40 ring-1 ring-navy/10'
                  : 'border-border'
              }`}
            >
              {/* Left Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono font-bold text-navy text-sm">
                    {b.reference}
                  </span>

                  {b.partnerReference && (
                    <span className="font-mono text-xs text-gold bg-navy px-1.5 py-0.2 rounded font-semibold">
                      {b.partnerReference}
                    </span>
                  )}

                  {getChannelBadge(b.channelCode, b.isPartner)}

                  {b.isToday && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-navy text-white">
                      Today
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-ink-soft flex-wrap">
                  <span className="font-semibold text-ink">{b.customerName}</span>
                  <span className="text-ink-faint font-mono">{b.customerPhone}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-ink-faint" />
                    {b.courtName}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-medium text-navy">
                    <Clock className="w-3 h-3 text-ink-faint" />
                    {b.dateFormatted} {b.timeLabel}
                  </span>
                </div>
              </div>

              {/* Right Price & Status */}
              <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1">
                <span className="font-bold text-navy text-sm tabular-nums">
                  ₹{(b.amountPaise / 100).toLocaleString('en-IN')}
                </span>

                <div>
                  {b.isPaid ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ok">
                      <CheckCircle2 className="w-3 h-3" />
                      PAID
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-warn">
                      <AlertTriangle className="w-3 h-3" />
                      UNPAID ⚠️
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Slide-over Detail Sheet */}
      {activeBooking && (
        <BookingDetailSheet
          booking={activeBooking.booking}
          courtName={activeBooking.courtName}
          timeLabel={activeBooking.timeLabel}
          dateFormatted={activeBooking.dateFormatted}
          onClose={() => setActiveBooking(null)}
          onActionComplete={() => {
            setActiveBooking(null);
            performSearch(query);
          }}
        />
      )}
    </div>
  );
}
