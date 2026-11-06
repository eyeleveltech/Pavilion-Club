'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Trash2,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  getPickleballEnquiries,
  getStudioEnquiries,
  updateStudioEnquiryStatus,
  checkInMember,
  deleteEnquiry,
  ENQUIRY_UPDATE_EVENT,
  type PickleballEnquiry,
  type StudioEnquiry,
} from '@/lib/enquiry-store';

export function EnquiriesView() {
  const [activeTab, setActiveTab] = useState<'pickleball' | 'studio'>('pickleball');
  const [pickleballList, setPickleballList] = useState<PickleballEnquiry[]>([]);
  const [studioList, setStudioList] = useState<StudioEnquiry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');
  const [checkInNotice, setCheckInNotice] = useState<{ tone: 'success' | 'warn'; text: string } | null>(null);

  // Load enquiries from storage and bind live sync listeners
  const refreshData = () => {
    setPickleballList(getPickleballEnquiries());
    setStudioList(getStudioEnquiries());
    setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const handleCheckIn = (id: string) => {
    const res = checkInMember(id);
    setCheckInNotice({
      tone: res.success ? 'success' : 'warn',
      text: res.message,
    });
    refreshData();
    setTimeout(() => {
      setCheckInNotice(null);
    }, 4000);
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener(ENQUIRY_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(ENQUIRY_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Filtered Pickleball List
  const filteredPickleball = useMemo(() => {
    return pickleballList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [pickleballList, searchQuery]);

  // Filtered Studio List
  const filteredStudio = useMemo(() => {
    return studioList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === 'All' ||
        item.category.toLowerCase().includes(categoryFilter.toLowerCase());

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [studioList, searchQuery, categoryFilter, statusFilter]);

  const handleStatusChange = (id: string, newStatus: StudioEnquiry['status']) => {
    updateStudioEnquiryStatus(id, newStatus);
    refreshData();
  };

  const handleDelete = (id: string, type: 'pickleball' | 'studio') => {
    if (confirm('Are you sure you want to remove this enquiry from the desk?')) {
      deleteEnquiry(id, type);
      refreshData();
    }
  };

  const exportCSV = () => {
    if (activeTab === 'pickleball') {
      const headers = ['Reference,Name,Phone,Email,Plan,Sessions,Amount,PaymentId,Status,Created'];
      const rows = filteredPickleball.map(
        (p) =>
          `"${p.reference}","${p.name}","${p.phone}","${p.email}","${p.plan}","${p.sessions}","${p.amountDisplay}","${p.paymentId}","${p.status}","${p.createdAt}"`
      );
      const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pickleball-membership-enquiries-${Date.now()}.csv`;
      a.click();
    } else {
      const headers = ['Reference,Name,Phone,Email,Discipline,Cohort,Day,Slot,Level,Status,Created'];
      const rows = filteredStudio.map(
        (s) =>
          `"${s.reference}","${s.name}","${s.phone}","${s.email}","${s.category}","${s.cohort}","${s.day}","${s.timeSlot}","${s.level}","${s.status}","${s.createdAt}"`
      );
      const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studio-membership-enquiries-${Date.now()}.csv`;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title Lockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c7a26a] animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c7a26a]">
              Front Desk Operations Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
            Enquiries &amp; Member Applications
          </h1>
          <p className="text-xs text-white/60 mt-0.5">
            Real-time feed of online form submissions across Pickleball Membership &amp; Pavilion Studio.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/90 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#c7a26a]" />
            Export CSV
          </button>
          <span className="text-[11px] text-white/40 font-mono">
            Synced: {lastRefreshed}
          </span>
        </div>
      </div>

      {/* TWO TOP TABS (Pickleball vs Studio) */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('pickleball')}
          className={`flex items-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'pickleball'
              ? 'border-[#c7a26a] bg-[#c7a26a]/10 text-white font-bold shadow-sm'
              : 'border-transparent text-white/60 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <span>🎾 Pickleball Membership</span>
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
              activeTab === 'pickleball'
                ? 'bg-[#c7a26a] text-black font-bold'
                : 'bg-white/10 text-white/70'
            }`}
          >
            {pickleballList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'studio'
              ? 'border-[#c7a26a] bg-[#c7a26a]/10 text-white font-bold shadow-sm'
              : 'border-transparent text-white/60 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <span>💃 Pavilion Studio Membership</span>
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
              activeTab === 'studio'
                ? 'bg-[#c7a26a] text-black font-bold'
                : 'bg-white/10 text-white/70'
            }`}
          >
            {studioList.length}
          </span>
        </button>
      </div>

      {/* Check-In Notice Banner */}
      {checkInNotice && (
        <div
          role="alert"
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
            checkInNotice.tone === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/50 text-emerald-300'
              : 'border-amber-500/40 bg-amber-950/50 text-amber-200'
          }`}
        >
          <span>{checkInNotice.text}</span>
          <button
            type="button"
            onClick={() => setCheckInNotice(null)}
            className="text-white/60 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0c1622] p-3 rounded-xl border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email, ref..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-white/15 bg-[#060c14] text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#c7a26a] transition-all"
          />
        </div>

        {activeTab === 'studio' && (
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {/* Discipline Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-white/15 bg-[#060c14] text-xs text-white focus:outline-none focus:border-[#c7a26a]"
            >
              <option value="All">All Disciplines</option>
              <option value="Boxing">Boxing</option>
              <option value="Dance">Dance</option>
              <option value="Yoga">Yoga</option>
              <option value="Fitness">Fitness</option>
              <option value="Personal Training">Personal Training</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-white/15 bg-[#060c14] text-xs text-white focus:outline-none focus:border-[#c7a26a]"
            >
              <option value="All">All Statuses</option>
              <option value="New">🟢 New</option>
              <option value="Contacted">🟡 Contacted</option>
              <option value="Trial Scheduled">🟣 Trial Scheduled</option>
              <option value="Enrolled">🔵 Enrolled</option>
            </select>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* TAB 1: PICKLEBALL MEMBERSHIP LIST */}
      {/* ============================================================= */}
      {activeTab === 'pickleball' && (
        <div className="rounded-xl border border-white/10 bg-[#08111d] overflow-hidden shadow-xl">
          {filteredPickleball.length === 0 ? (
            <div className="p-12 text-center text-white/50 text-sm">
              No pickleball membership submissions match your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs min-w-[780px]">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0d1c2b] text-[11px] uppercase tracking-wider text-[#c7a26a]">
                    <th className="p-3.5 font-semibold">Reference</th>
                    <th className="p-3.5 font-semibold">Member Particulars</th>
                    <th className="p-3.5 font-semibold">Plan &amp; Sessions</th>
                    <th className="p-3.5 font-semibold">Payment / Status</th>
                    <th className="p-3.5 font-semibold">Submitted</th>
                    <th className="p-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredPickleball.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-white bg-white/5 border border-white/15 px-2 py-0.5 rounded">
                          {item.reference}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-white text-sm">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-white/60 text-[11px]">
                          <span className="font-mono">{item.phone}</span>
                          <span>·</span>
                          <span className="text-white/50">{item.email}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-white/90">{item.plan}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-[#c7a26a] bg-[#c7a26a]/10 px-2 py-0.5 rounded border border-[#c7a26a]/30">
                            {item.sessionsUsed || 0} / {item.sessions} Used
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                            {item.sessions - (item.sessionsUsed || 0)} left
                          </span>
                        </div>
                        {/* Mini attendance progress */}
                        <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#c7a26a] to-emerald-400 transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (((item.sessionsUsed || 0) / item.sessions) * 100))}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-white">
                          {item.amountDisplay}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {item.status}
                          </span>
                          <span className="font-mono text-[9px] text-white/40 truncate max-w-[90px]">
                            {item.paymentId}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-white/60 whitespace-nowrap">
                        {item.createdDisplay}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* 1-Click Member Check-In */}
                          {(() => {
                            const todayYMD = new Date().toISOString().slice(0, 10);
                            const checkedInToday = item.lastCheckIn && item.lastCheckIn.slice(0, 10) === todayYMD;
                            const isExhausted = (item.sessionsUsed || 0) >= item.sessions;

                            if (checkedInToday) {
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 rounded-lg">
                                  ✓ In Today
                                </span>
                              );
                            }
                            if (isExhausted) {
                              return (
                                <span className="inline-flex items-center px-2 py-1 text-[10px] font-semibold text-white/40 bg-white/5 border border-white/10 rounded-lg">
                                  20/20 Done
                                </span>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => handleCheckIn(item.id)}
                                className="px-2.5 py-1 text-[11px] font-bold text-black bg-[#c7a26a] hover:bg-[#d9b882] rounded-lg shadow-sm transition-all flex items-center gap-1 active:scale-95"
                                title="Check-in member for today's 1-hour session"
                              >
                                🎾 Check-In (1 Hr)
                              </button>
                            );
                          })()}

                          {/* 1-Click WhatsApp Button */}
                          <a
                            href={`https://wa.me/91${item.phone}?text=${encodeURIComponent(
                              `Hello ${item.name}! Welcome to The Pavilion Club. Your Inaugural Shared-Play Membership (${item.reference}) is active with 20 Sessions.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>

                          {/* Direct Call Button */}
                          <a
                            href={`tel:${item.phone}`}
                            className="p-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 transition-all"
                            title="Call customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete Entry */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, 'pickleball')}
                            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: STUDIO MEMBERSHIP & CLASS ENQUIRIES */}
      {/* ============================================================= */}
      {activeTab === 'studio' && (
        <div className="rounded-xl border border-white/10 bg-[#08111d] overflow-hidden shadow-xl">
          {filteredStudio.length === 0 ? (
            <div className="p-12 text-center text-white/50 text-sm">
              No studio enquiries match your search or filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs min-w-[880px]">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0d1c2b] text-[11px] uppercase tracking-wider text-[#c7a26a]">
                    <th className="p-3.5 font-semibold">Reference</th>
                    <th className="p-3.5 font-semibold">Applicant</th>
                    <th className="p-3.5 font-semibold">Discipline &amp; Cohort</th>
                    <th className="p-3.5 font-semibold">Preferred Slot</th>
                    <th className="p-3.5 font-semibold">Notes</th>
                    <th className="p-3.5 font-semibold">Lead Status</th>
                    <th className="p-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredStudio.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#c7a26a] bg-[#c7a26a]/10 border border-[#c7a26a]/30 px-2 py-0.5 rounded">
                          {item.reference}
                        </span>
                        <div className="text-[10px] text-white/40 mt-1">
                          {item.createdDisplay}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-white text-sm">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-white/60 text-[11px]">
                          <span className="font-mono">{item.phone}</span>
                          <span>·</span>
                          <span className="text-white/50">{item.email}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-white/10 text-white">
                          {item.category}
                        </span>
                        <div className="text-[10px] text-white/50 mt-1">
                          {item.cohort} · <span className="text-[#c7a26a]">{item.level}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-[#c7a26a]">
                          {item.day}
                        </div>
                        <div className="text-[11px] text-white/70 font-mono mt-0.5">
                          {item.timeSlot}
                        </div>
                      </td>
                      <td className="p-3.5 max-w-[180px]">
                        <p className="text-white/60 text-[11px] truncate" title={item.notes || 'No special requests'}>
                          {item.notes || <span className="text-white/30 italic">None</span>}
                        </p>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(
                              item.id,
                              e.target.value as StudioEnquiry['status']
                            )
                          }
                          className={`text-[11px] font-semibold rounded-lg px-2 py-1 border transition-all cursor-pointer ${
                            item.status === 'New'
                              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                              : item.status === 'Contacted'
                                ? 'bg-amber-950/50 border-amber-500/50 text-amber-300'
                                : item.status === 'Trial Scheduled'
                                  ? 'bg-purple-950/50 border-purple-500/50 text-purple-300'
                                  : 'bg-blue-950/50 border-blue-500/50 text-blue-300'
                          }`}
                        >
                          <option value="New">🟢 New Lead</option>
                          <option value="Contacted">🟡 Contacted</option>
                          <option value="Trial Scheduled">🟣 Trial Scheduled</option>
                          <option value="Enrolled">🔵 Enrolled</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click WhatsApp Quick Trial Confirmation */}
                          <a
                            href={`https://wa.me/91${item.phone}?text=${encodeURIComponent(
                              `Hello ${item.name}! This is the Front Desk at Pavilion Studio Mogappair. We received your trial request for ${item.category} (${item.day} · ${item.timeSlot}). Would you like us to confirm your complimentary trial pass?`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all"
                            title="Send WhatsApp confirmation"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>

                          {/* Direct Call Button */}
                          <a
                            href={`tel:${item.phone}`}
                            className="p-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 transition-all"
                            title="Call customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete Entry */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, 'studio')}
                            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

