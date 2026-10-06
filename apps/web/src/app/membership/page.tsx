'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Trophy,
  Dumbbell,
  CheckCircle2,
  Clock,
  CreditCard,
  Search,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Zap,
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

interface PackProduct {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  pricePaise: number;
  priceRupees: number;
  validityDays: number | null;
  sportType: string | null;
}

interface PurchasedPass {
  id: string;
  reference: string;
  name: string;
  sport: string;
  creditsTotal: number;
  creditsRemaining: number;
  priceRupees: number;
  purchasedAt: string;
  expiresAt: string | null;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  payment: {
    method: string;
    reference: string;
    status: string;
  };
}

interface CustomerPassItem {
  id: string;
  reference: string;
  name: string;
  sport: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  expiresAt: string | null;
  purchasedAt: string;
}

type TabType = 'gym' | 'pickleball' | 'studio' | 'lookup';

export default function MembershipPage() {
  const [activeTab, setActiveTab] = useState<TabType>('gym');
  const [packs, setPacks] = useState<PackProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [selectedPack, setSelectedPack] = useState<PackProduct | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [purchasedPass, setPurchasedPass] = useState<PurchasedPass | null>(null);

  // Phone Lookup State
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState<{
    found: boolean;
    customer: { name: string; phone: string } | null;
    packs: CustomerPassItem[];
  } | null>(null);

  useEffect(() => {
    async function loadPacks() {
      try {
        setLoading(true);
        const res = await fetch('/api/public/packs');
        if (!res.ok) throw new Error('Failed to load membership packages');
        const data = await res.json();
        setPacks(data.packs || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading packages');
      } finally {
        setLoading(false);
      }
    }
    loadPacks();
  }, []);

  const gymPacks = packs.filter((p) => p.sportType === 'Gym');
  const pickleballPacks = packs.filter((p) => p.sportType === 'Pickleball');
  const studioPacks = packs.filter((p) => p.sportType === 'Studio');

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPack || !phone || phone.length < 10) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/public/packs/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack_id: selectedPack.id,
          customer_name: name || 'Valued Member',
          customer_phone: phone,
          customer_email: email || undefined,
          payment_method: 'gateway',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to complete membership purchase');
      }

      setPurchasedPass(data.pass);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Purchase failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPhone || lookupPhone.length < 10) return;

    try {
      setLookupLoading(true);
      const res = await fetch(`/api/public/packs/customer?phone=${encodeURIComponent(lookupPhone)}`);
      const data = await res.json();
      setLookupResults(data);
    } catch {
      alert('Failed to lookup member pass.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B141B] text-[#F9F6ED] flex flex-col justify-between selection:bg-[#C7A26A] selection:text-[#0B141B]">
      <PublicHeader />

      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-20 space-y-16 flex-1 w-full">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C7A26A]/30 bg-[#C7A26A]/10 text-[#C7A26A] text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Pavilion Club Memberships &amp; Packs
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-[#F9F6ED] leading-tight">
            Elevate Your Game at <br />
            <span className="italic text-[#C7A26A]">Chennai&apos;s Premier Sporting Club</span>
          </h1>
          <p className="text-[#F9F6ED]/70 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-sans font-light">
            Flexible gym unlimited memberships, prepaid court hour bundles, and dedicated studio rentals. Powered natively by TurfOS.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#142330] border border-[#F9F6ED]/10 gap-1 sm:gap-2 flex-wrap justify-center">
            <button
              onClick={() => setActiveTab('gym')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'gym'
                  ? 'bg-[#C7A26A] text-[#0B141B] shadow-lg font-bold'
                  : 'text-[#F9F6ED]/70 hover:text-[#F9F6ED] hover:bg-white/5'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              Gym Unlimited Passes
            </button>
            <button
              onClick={() => setActiveTab('pickleball')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'pickleball'
                  ? 'bg-[#C7A26A] text-[#0B141B] shadow-lg font-bold'
                  : 'text-[#F9F6ED]/70 hover:text-[#F9F6ED] hover:bg-white/5'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Pickleball Hour Packs
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'studio'
                  ? 'bg-[#C7A26A] text-[#0B141B] shadow-lg font-bold'
                  : 'text-[#F9F6ED]/70 hover:text-[#F9F6ED] hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Studio Instructor Batches
            </button>
            <button
              onClick={() => setActiveTab('lookup')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'lookup'
                  ? 'bg-[#C7A26A] text-[#0B141B] shadow-lg font-bold'
                  : 'text-[#F9F6ED]/70 hover:text-[#F9F6ED] hover:bg-white/5'
              }`}
            >
              <Search className="w-4 h-4" />
              Check Balance &amp; Pass
            </button>
          </div>
        </div>

        {/* Content based on Active Tab */}
        {loading ? (
          <div className="text-center py-20 text-[#F9F6ED]/50 text-sm">Loading packages from TurfOS engine...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-400 text-sm">{error}</div>
        ) : activeTab === 'gym' ? (
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-serif text-[#F9F6ED]">Unlimited Fitness &amp; Gym Passes</h2>
              <p className="text-xs sm:text-sm text-[#F9F6ED]/60 mt-1">Full access to strength equipment, cardio studio, lockers and showers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {gymPacks.map((pack, idx) => {
                const isHighlight = idx === 1; // 3 months
                return (
                  <div
                    key={pack.id}
                    className={`relative rounded-2xl p-6 flex flex-col justify-between transition border ${
                      isHighlight
                        ? 'bg-gradient-to-b from-[#182C3D] to-[#101E2B] border-[#C7A26A] shadow-xl ring-1 ring-[#C7A26A]/50'
                        : 'bg-[#121F2B]/70 border-[#F9F6ED]/10 hover:border-[#C7A26A]/40'
                    }`}
                  >
                    {isHighlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#C7A26A] text-[#0B141B] text-[10px] font-bold uppercase tracking-wider shadow">
                        Most Popular
                      </span>
                    )}
                    <div className="space-y-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C7A26A]">
                          {pack.validityDays} Days Pass
                        </span>
                        <h3 className="text-lg font-serif font-medium mt-1 text-[#F9F6ED]">{pack.name}</h3>
                        <p className="text-xs text-[#F9F6ED]/60 mt-2 line-clamp-2">{pack.description}</p>
                      </div>

                      <div className="pt-3 border-t border-[#F9F6ED]/10">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-3xl font-serif font-bold text-[#F9F6ED]">
                            ₹{pack.priceRupees.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] text-[#F9F6ED]/50 uppercase">/ {pack.validityDays}d</span>
                        </div>
                      </div>

                      <ul className="space-y-2 text-xs text-[#F9F6ED]/70 pt-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C7A26A] shrink-0" />
                          Unlimited daily workout sessions
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C7A26A] shrink-0" />
                          Premium shower &amp; locker access
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C7A26A] shrink-0" />
                          Floor trainer assistance included
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPack(pack);
                        setPurchasedPass(null);
                      }}
                      className={`mt-6 w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                        isHighlight
                          ? 'bg-[#C7A26A] text-[#0B141B] hover:bg-[#F9F6ED]'
                          : 'bg-white/10 hover:bg-[#C7A26A] hover:text-[#0B141B] text-[#F9F6ED]'
                      }`}
                    >
                      Join Now <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'pickleball' ? (
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-serif text-[#F9F6ED]">Prepaid Pickleball Hour Packs</h2>
              <p className="text-xs sm:text-sm text-[#F9F6ED]/60 mt-1">
                Buy hours in bulk at a steep discount. Hours are automatically debited when you book slots.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {pickleballPacks.map((pack) => (
                <div
                  key={pack.id}
                  className="rounded-2xl p-8 bg-gradient-to-b from-[#142533] to-[#0E1A25] border-2 border-[#C7A26A]/60 flex flex-col justify-between shadow-2xl relative"
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-[#C7A26A]/20 text-[#C7A26A] text-[11px] font-bold uppercase tracking-wider">
                        {pack.credits} Hours Pack
                      </span>
                      <span className="text-xs text-[#F9F6ED]/50 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#C7A26A]" /> Valid {pack.validityDays} Days
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-serif text-[#F9F6ED]">{pack.name}</h3>
                      <p className="text-xs text-[#F9F6ED]/60 mt-2">{pack.description}</p>
                    </div>

                    <div className="pt-4 border-t border-[#F9F6ED]/10">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-serif font-bold text-[#F9F6ED]">
                          ₹{pack.priceRupees.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-[#C7A26A] font-semibold">
                          (₹{Math.round(pack.priceRupees / pack.credits)}/hr)
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-[#F9F6ED]/70 pt-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#C7A26A] shrink-0" />
                        Valid across Court 1, 2, and 3
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#C7A26A] shrink-0" />
                        Zero platform fee on hourly redemptions
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#C7A26A] shrink-0" />
                        Automated balance deduction with mobile number
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPack(pack);
                      setPurchasedPass(null);
                    }}
                    className="mt-8 w-full py-3 rounded-xl bg-[#C7A26A] text-[#0B141B] font-bold text-xs uppercase tracking-wider hover:bg-[#F9F6ED] transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    Buy {pack.credits}h Pack <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'studio' ? (
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-serif text-[#F9F6ED]">Yoga &amp; Aerobics Studio Rental Packs</h2>
              <p className="text-xs sm:text-sm text-[#F9F6ED]/60 mt-1">
                For certified trainers, instructors, and wellness coaches booking bulk seasonal batch hours.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {studioPacks.map((pack) => (
                <div
                  key={pack.id}
                  className="rounded-2xl p-8 bg-[#121F2B]/90 border border-[#F9F6ED]/15 flex flex-col justify-between hover:border-[#C7A26A]/50 transition shadow-lg"
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-white/10 text-[#C7A26A] text-[11px] font-bold uppercase tracking-wider">
                        {pack.credits} Studio Sessions
                      </span>
                      <span className="text-xs text-[#F9F6ED]/50 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#C7A26A]" /> Valid {pack.validityDays} Days
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-serif text-[#F9F6ED]">{pack.name}</h3>
                      <p className="text-xs text-[#F9F6ED]/60 mt-2">{pack.description}</p>
                    </div>

                    <div className="pt-4 border-t border-[#F9F6ED]/10">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-serif font-bold text-[#F9F6ED]">
                          ₹{pack.priceRupees.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-[#C7A26A] font-semibold">
                          (₹{Math.round(pack.priceRupees / pack.credits)}/session)
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-[#F9F6ED]/70 pt-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#C7A26A] shrink-0" />
                        Acoustic sound system &amp; full mirrors
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#C7A26A] shrink-0" />
                        Dedicated instructor batch scheduling
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#C7A26A] shrink-0" />
                        Front-desk check-in assistance for students
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPack(pack);
                      setPurchasedPass(null);
                    }}
                    className="mt-8 w-full py-3 rounded-xl bg-white/10 hover:bg-[#C7A26A] hover:text-[#0B141B] text-[#F9F6ED] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                  >
                    Reserve Batch Pack <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Tab: Lookup Member Pass & Balance */
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-serif text-[#F9F6ED]">Check Active Passes &amp; Remaining Hours</h2>
              <p className="text-xs sm:text-sm text-[#F9F6ED]/60 mt-1">
                Enter your 10-digit mobile number to view active memberships and remaining credits in TurfOS.
              </p>
            </div>

            <form onSubmit={handleLookup} className="flex gap-3">
              <input
                type="tel"
                placeholder="Enter 10-digit mobile (e.g. 9840199999)"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                maxLength={10}
                required
                className="flex-1 px-4 py-3 rounded-xl bg-[#142330] border border-[#F9F6ED]/15 text-[#F9F6ED] text-sm focus:border-[#C7A26A] outline-none"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-6 py-3 rounded-xl bg-[#C7A26A] text-[#0B141B] font-bold text-xs uppercase tracking-wider hover:bg-[#F9F6ED] transition flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                {lookupLoading ? 'Checking...' : 'Check Balance'}
              </button>
            </form>

            {lookupResults && (
              <div className="space-y-4">
                {lookupResults.found && lookupResults.packs.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#142330] border border-[#C7A26A]/30 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-[#C7A26A] uppercase font-bold">Active Member</span>
                        <h4 className="text-base font-serif text-[#F9F6ED]">{lookupResults.customer?.name}</h4>
                        <p className="text-xs text-[#F9F6ED]/50">{lookupResults.customer?.phone}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                        {lookupResults.packs.length} Active Pass(es)
                      </span>
                    </div>

                    <div className="space-y-3">
                      {lookupResults.packs.map((p) => (
                        <div key={p.id} className="p-5 rounded-xl bg-[#101E2B] border border-[#F9F6ED]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-mono text-[#C7A26A] uppercase tracking-wider">{p.reference}</span>
                            <h5 className="text-sm font-bold text-[#F9F6ED]">{p.name}</h5>
                            <p className="text-xs text-[#F9F6ED]/50 mt-0.5">
                              Sport: {p.sport} · Valid until: {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('en-IN') : 'No expiry'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-serif font-bold text-[#C7A26A]">{p.creditsRemaining}</span>
                            <span className="text-xs text-[#F9F6ED]/50 ml-1">/ {p.creditsTotal} hours left</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-center pt-4">
                      <Link
                        href="/book"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#C7A26A] text-[#0B141B] text-xs font-bold uppercase tracking-wider hover:bg-[#F9F6ED] transition"
                      >
                        Book Court Using Credits <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-[#142330]/50 border border-[#F9F6ED]/10 text-center space-y-2">
                    <p className="text-sm text-[#F9F6ED]/70">No active packs or memberships found for {lookupPhone}.</p>
                    <p className="text-xs text-[#F9F6ED]/40">Choose a membership plan above to get started!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Purchase Flow */}
      {selectedPack && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101E2B] border border-[#C7A26A]/40 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedPack(null)}
              className="absolute top-4 right-4 text-[#F9F6ED]/50 hover:text-[#F9F6ED] text-xl font-bold"
            >
              ×
            </button>

            {purchasedPass ? (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[#C7A26A]/20 text-[#C7A26A] mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-[#C7A26A] tracking-wider">Membership Confirmed</span>
                  <h3 className="text-2xl font-serif text-[#F9F6ED] mt-1">Welcome to Pavilion Club</h3>
                  <p className="text-xs text-[#F9F6ED]/60 mt-1">Your digital pass has been activated natively in TurfOS.</p>
                </div>

                <div className="p-5 rounded-xl bg-[#142636] border border-[#C7A26A]/40 text-left space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/50">Pass Reference:</span>
                    <span className="text-[#C7A26A] font-bold">{purchasedPass.reference}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/50">Package:</span>
                    <span className="text-white">{purchasedPass.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/50">Member:</span>
                    <span className="text-white">{purchasedPass.customer.name} ({purchasedPass.customer.phone})</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/50">Credits Total:</span>
                    <span className="text-white font-bold">{purchasedPass.creditsTotal} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Expires On:</span>
                    <span className="text-white">
                      {purchasedPass.expiresAt ? new Date(purchasedPass.expiresAt).toLocaleDateString('en-IN') : 'Lifetime'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    href="/book"
                    className="flex-1 py-3 rounded-xl bg-[#C7A26A] text-[#0B141B] font-bold text-xs uppercase tracking-wider hover:bg-[#F9F6ED] transition text-center"
                  >
                    Go to Book Court
                  </Link>
                  <button
                    onClick={() => setSelectedPack(null)}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-[#F9F6ED] font-bold text-xs uppercase tracking-wider transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePurchase} className="space-y-5">
                <div>
                  <span className="text-[11px] uppercase font-bold text-[#C7A26A] tracking-wider">Purchase Membership</span>
                  <h3 className="text-xl font-serif text-[#F9F6ED] mt-1">{selectedPack.name}</h3>
                  <p className="text-xs text-[#F9F6ED]/60 mt-0.5">{selectedPack.description}</p>
                </div>

                <div className="p-4 rounded-xl bg-[#142636] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-white/50">Amount Payable</span>
                    <div className="text-2xl font-serif font-bold text-[#F9F6ED]">
                      ₹{selectedPack.priceRupees.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#C7A26A]/20 text-[#C7A26A] text-xs font-bold">
                    {selectedPack.credits} Sessions
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#F9F6ED]/80 flex items-center gap-1.5 mb-1">
                      <User className="w-3.5 h-3.5 text-[#C7A26A]" /> Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anand Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#142330] border border-white/15 text-sm text-[#F9F6ED] focus:border-[#C7A26A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#F9F6ED]/80 flex items-center gap-1.5 mb-1">
                      <Phone className="w-3.5 h-3.5 text-[#C7A26A]" /> Mobile Number (10 digits)
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9840199999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#142330] border border-white/15 text-sm text-[#F9F6ED] focus:border-[#C7A26A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#F9F6ED]/80 flex items-center gap-1.5 mb-1">
                      <Mail className="w-3.5 h-3.5 text-[#C7A26A]" /> Email (for digital pass receipt)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. anand@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#142330] border border-white/15 text-sm text-[#F9F6ED] focus:border-[#C7A26A] outline-none"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-[#F9F6ED]/50 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#C7A26A]" /> Direct Door A checkout · Instant pass activation
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-[#C7A26A] text-[#0B141B] font-bold text-xs uppercase tracking-wider hover:bg-[#F9F6ED] transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Activating Pass...' : `Pay ₹${selectedPack.priceRupees.toLocaleString('en-IN')} & Activate`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
