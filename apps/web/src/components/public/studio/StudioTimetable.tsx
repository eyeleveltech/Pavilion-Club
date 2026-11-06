'use client';

import React, { useMemo, useState } from 'react';
import {
  DAYS_OF_WEEK,
  STUDIO_PILLARS,
  STUDIO_SCHEDULE,
  type DayKey,
  type StudioClassSlot,
  type StudioPillar,
  type TargetGroup,
} from '@/lib/studio-schedule';
import { StudioEnquiryModal, type StudioEnquiryData } from './StudioEnquiryModal';

const TARGET_GROUPS: { key: TargetGroup | 'All'; label: string }[] = [
  { key: 'All', label: 'All Age Groups' },
  { key: 'Kids', label: 'Kids (Ages 4–10)' },
  { key: 'Juniors', label: 'Juniors (Ages 11–14)' },
  { key: 'Teens', label: 'Teens (Ages 15–18)' },
  { key: 'Adults', label: 'Adults (18+)' },
  { key: 'Individual', label: '1-on-1 PT' },
];

export function StudioTimetable() {
  const [activeDay, setActiveDay] = useState<DayKey>('Mon');
  const [selectedPillar, setSelectedPillar] = useState<StudioPillar | 'All'>('All');
  const [selectedGroup, setSelectedGroup] = useState<TargetGroup | 'All'>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');

  // Enquiry Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enquiryData, setEnquiryData] = useState<StudioEnquiryData | null>(null);

  React.useEffect(() => {
    const checkHash = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash === '#studio-enquiry' || hash === '#studio') {
          if (hash === '#studio-enquiry') {
            setEnquiryData(null);
            setIsModalOpen(true);
          }
        }
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a[href="#studio-enquiry"]');
      if (target) {
        e.preventDefault();
        setEnquiryData(null);
        setIsModalOpen(true);
        if (window.location.hash !== '#studio-enquiry') {
          window.history.pushState(null, '', '#studio-enquiry');
        }
      }
    };
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('hashchange', checkHash);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const openEnquiry = (slot?: StudioClassSlot, day?: string) => {
    if (slot) {
      setEnquiryData({
        activity: slot.activity,
        timeSlot: slot.time,
        day: day || activeDay,
        targetGroup: slot.targetDisplay || slot.targetGroup,
      });
    } else {
      setEnquiryData(null);
    }
    setIsModalOpen(true);
  };

  const openEnquiryCell = (activity: string, timeSlot: string, day: string, targetGroup = 'Adults') => {
    setEnquiryData({
      activity,
      timeSlot,
      day,
      targetGroup,
    });
    setIsModalOpen(true);
  };

  // Filter slots for the active day in Cards View
  const dailySlots = useMemo(() => {
    return STUDIO_SCHEDULE.filter((slot) => {
      const matchesDay = slot.days.includes(activeDay);
      const matchesPillar = selectedPillar === 'All' || slot.pillar === selectedPillar;
      const matchesGroup =
        selectedGroup === 'All' ||
        slot.targetGroup === selectedGroup ||
        (selectedGroup === 'Juniors' && (slot.targetDisplay?.includes('Juniors') || slot.targetGroup === 'Juniors')) ||
        (selectedGroup === 'Teens' && (slot.targetDisplay?.includes('Teens') || slot.targetGroup === 'Teens')) ||
        (selectedGroup === 'Adults' && (slot.targetDisplay?.includes('Adults') || slot.targetGroup === 'Adults'));
      return matchesDay && matchesPillar && matchesGroup;
    });
  }, [activeDay, selectedPillar, selectedGroup]);

  return (
    <div className="w-full mt-14 pt-12 border-t border-white/10" id="schedule">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#C7A26A] animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C7A26A]">
              Mon · Wed · Fri Master Class Schedule
            </span>
          </div>
          <h3 className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Pavilion Studio Timetable
          </h3>
          <p className="mt-2 text-sm text-white/60 max-w-xl">
            Sessions held exclusively on <span className="text-[#C7A26A] font-semibold">Monday, Wednesday &amp; Friday</span> (6:00 AM – 10:00 PM). Filter by age cohort, discipline, or browse the master matrix.
          </p>
        </div>

        {/* View Switcher & Global Enquiry */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-[#C7A26A] text-black shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Daily Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#C7A26A] text-black shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Master Grid Matrix
            </button>
          </div>
        </div>
      </div>

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          {/* Day Switcher Tabs (Only Mon, Wed, Fri) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {DAYS_OF_WEEK.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveDay(d.key)}
                className={`rounded-xl border p-3 sm:p-4 text-center transition-all ${
                  activeDay === d.key
                    ? 'border-[#C7A26A] bg-gradient-to-b from-[#C7A26A]/20 to-[#0A1520] text-white shadow-lg'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:text-white'
                }`}
              >
                <span className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-[#C7A26A]/80 font-mono">
                  {d.theme}
                </span>
                <span className="text-sm sm:text-base font-semibold tracking-wide block mt-0.5">
                  {d.label}
                </span>
              </button>
            ))}
          </div>

          {/* Filter Bar (Pillars & Target Groups) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0d1c2b]/60 p-3.5 backdrop-blur-sm">
            {/* Discipline Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/50 uppercase tracking-wider text-[10px] font-mono whitespace-nowrap">
                Discipline:
              </span>
              <select
                value={selectedPillar}
                onChange={(e) => setSelectedPillar(e.target.value as StudioPillar | 'All')}
                aria-label="Filter classes by studio discipline"
                className="bg-[#071018] border border-white/15 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#C7A26A]"
              >
                <option value="All">All Disciplines</option>
                {STUDIO_PILLARS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Group Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              {TARGET_GROUPS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setSelectedGroup(g.key)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium whitespace-nowrap transition-all ${
                    selectedGroup === g.key
                      ? 'bg-white text-black font-semibold'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slots List / Grid */}
          {dailySlots.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0A1520]/60 p-12 text-center">
              <p className="text-white/60 text-sm">No classes match your selected filters on {activeDay}.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPillar('All');
                  setSelectedGroup('All');
                }}
                className="mt-3 text-xs text-[#C7A26A] underline font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dailySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-[#0A1520] to-[#060D15] p-5 hover:border-[#C7A26A]/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <div>
                    {/* Header Row: Time + Target Group Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-semibold text-[#C7A26A] bg-[#C7A26A]/10 border border-[#C7A26A]/30 rounded-full px-2.5 py-0.5">
                        {slot.time}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70 bg-white/10 px-2 py-0.5 rounded">
                        {slot.targetDisplay || slot.targetGroup}
                      </span>
                    </div>

                    {/* Activity Title & Pillar */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-xl font-bold font-serif text-white group-hover:text-[#C7A26A] transition-colors">
                        {slot.activity}
                      </h4>
                      {slot.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#C7A26A]/20 text-[#C7A26A] border border-[#C7A26A]/40 shrink-0">
                          {slot.badge}
                        </span>
                      )}
                    </div>
                    <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-[#C7A26A]/80 mt-1">
                      {slot.pillar}
                    </span>

                    {/* Description */}
                    {slot.description && (
                      <p className="mt-2.5 text-xs text-white/60 leading-relaxed">{slot.description}</p>
                    )}
                  </div>

                  {/* Card Bottom Action */}
                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-white/40">The Pavilion Studio · Mogappair</span>
                    <button
                      type="button"
                      onClick={() => openEnquiry(slot, activeDay)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#C7A26A] hover:underline"
                    >
                      Enquire Slot
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MASTER GRID VIEW (Matching Client Graphic Sheet 100%) */}
      {viewMode === 'grid' && (
        <div className="rounded-2xl border border-white/15 bg-[#071018] overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/10 bg-[#0A1520] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#C7A26A] block">
                Master Matrix · Monday · Wednesday · Friday
              </span>
              <span className="text-[11px] text-white/50">
                Suggested Hours: 6:00 AM – 10:00 PM · Move · Perform · Transform
              </span>
            </div>
            <span className="text-xs text-white/50">Click any class cell to enquire</span>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full border-collapse text-left text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-white/15 bg-[#0d1c2b] text-[11px] uppercase tracking-wider text-[#C7A26A]">
                  <th className="p-3.5 w-36 font-semibold font-mono">Time</th>
                  <th className="p-3.5 font-semibold">
                    <span className="block text-white text-xs">Monday</span>
                    <span className="text-[10px] text-[#C7A26A]/80 font-normal tracking-normal lowercase">dance + fitness</span>
                  </th>
                  <th className="p-3.5 font-semibold">
                    <span className="block text-white text-xs">Wednesday</span>
                    <span className="text-[10px] text-[#C7A26A]/80 font-normal tracking-normal lowercase">dance + fitness</span>
                  </th>
                  <th className="p-3.5 font-semibold">
                    <span className="block text-white text-xs">Friday</span>
                    <span className="text-[10px] text-[#C7A26A]/80 font-normal tracking-normal lowercase">dance + boxing + fitness</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {/* Section Header: MORNING MOVEMENT */}
                <tr className="bg-[#050B11]/80">
                  <td colSpan={4} className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C7A26A]/90">
                    ☀️ Morning Movement
                  </td>
                </tr>

                {/* 6:00 – 7:00 AM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 font-mono font-medium text-white/70 whitespace-nowrap">06:00 – 07:00 AM</td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/10 transition-colors" onClick={() => openEnquiryCell('Yoga', '06:00 AM – 07:00 AM', 'Mon', 'Adults')}>
                    <span className="font-semibold text-white block">Yoga</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/10 transition-colors" onClick={() => openEnquiryCell('Fitness', '06:00 AM – 07:00 AM', 'Wed', 'Adults')}>
                    <span className="font-semibold text-[#C7A26A] block">Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/10 transition-colors" onClick={() => openEnquiryCell('Yoga', '06:00 AM – 07:00 AM', 'Fri', 'Adults')}>
                    <span className="font-semibold text-white block">Yoga</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                </tr>

                {/* 7:00 – 8:00 AM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 font-mono font-medium text-white/70 whitespace-nowrap">07:00 – 08:00 AM</td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/10 transition-colors" onClick={() => openEnquiryCell('Fitness', '07:00 AM – 08:00 AM', 'Mon', 'Adults')}>
                    <span className="font-semibold text-white block">Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/10 transition-colors" onClick={() => openEnquiryCell('Yoga', '07:00 AM – 08:00 AM', 'Wed', 'Adults')}>
                    <span className="font-semibold text-[#C7A26A] block">Yoga</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/10 transition-colors" onClick={() => openEnquiryCell('Fitness', '07:00 AM – 08:00 AM', 'Fri', 'Adults')}>
                    <span className="font-semibold text-white block">Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                </tr>

                {/* 8:00 – 9:00 AM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 font-mono font-medium text-white/70 whitespace-nowrap">08:00 – 09:00 AM</td>
                  <td
                    colSpan={3}
                    onClick={() => openEnquiryCell('Personal Training', '08:00 AM – 09:00 AM', 'MWF', 'Individual')}
                    className="p-3.5 text-center bg-[#C7A26A]/5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors border-l border-white/10"
                  >
                    <span className="font-semibold text-[#C7A26A] block">Personal Training (1-on-1)</span>
                    <span className="text-[10px] text-white/50">Mon · Wed · Fri Individual Goal Coaching</span>
                  </td>
                </tr>

                {/* Section Header: DAY SLOTS */}
                <tr className="bg-[#050B11]/80">
                  <td colSpan={4} className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C7A26A]/90">
                    💼 Day Slots
                  </td>
                </tr>

                {/* 9:00 AM – 4:00 PM */}
                <tr className="bg-white/[0.01]">
                  <td className="p-3.5 font-mono font-medium text-white/70 whitespace-nowrap">09:00 AM – 04:00 PM</td>
                  <td
                    colSpan={3}
                    onClick={() => openEnquiryCell('School / Private / PT Slots', '09:00 AM – 04:00 PM', 'MWF', 'School / Private')}
                    className="p-3.5 text-center bg-white/5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors border-l border-white/10"
                  >
                    <span className="font-semibold text-white/90 block">School / Private / PT Slots</span>
                    <span className="text-[10px] text-white/50">Dedicated Private Studio Rehearsals &amp; Institutional Bookings</span>
                  </td>
                </tr>

                {/* Section Header: EVENING SESSIONS */}
                <tr className="bg-[#050B11]/80">
                  <td colSpan={4} className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C7A26A]/90">
                    🌙 Evening Sessions
                  </td>
                </tr>

                {/* 4:00 – 5:00 PM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 font-mono font-medium text-white/70 whitespace-nowrap">04:00 – 05:00 PM</td>
                  <td
                    colSpan={3}
                    onClick={() => openEnquiryCell('Kids Dance', '04:00 PM – 05:00 PM', 'MWF', 'Kids')}
                    className="p-3.5 text-center bg-[#0d1c2b]/70 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors border-l border-white/10"
                  >
                    <span className="font-semibold text-white block">Kids Dance</span>
                    <span className="text-[10px] text-white/50">Target: Kids (Ages 4–10 Foundation)</span>
                  </td>
                </tr>

                {/* 5:00 – 6:00 PM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 font-mono font-medium text-white/70 whitespace-nowrap">05:00 – 06:00 PM</td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors" onClick={() => openEnquiryCell('Dance', '05:00 PM – 06:00 PM', 'Mon', 'Kids / Juniors')}>
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Kids / Juniors</span>
                  </td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors" onClick={() => openEnquiryCell('Dance', '05:00 PM – 06:00 PM', 'Wed', 'Juniors')}>
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Juniors</span>
                  </td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors" onClick={() => openEnquiryCell('Dance', '05:00 PM – 06:00 PM', 'Fri', 'Juniors')}>
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Juniors</span>
                  </td>
                </tr>

                {/* 6:00 – 7:00 PM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 font-mono font-medium text-white/70 whitespace-nowrap">06:00 – 07:00 PM</td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors" onClick={() => openEnquiryCell('Dance', '06:00 PM – 07:00 PM', 'Mon', 'Teens')}>
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Teens</span>
                  </td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors" onClick={() => openEnquiryCell('Dance', '06:00 PM – 07:00 PM', 'Wed', 'Teens')}>
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Teens</span>
                  </td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors bg-[#C7A26A]/10 border border-[#C7A26A]/30" onClick={() => openEnquiryCell('Boxing', '06:00 PM – 07:00 PM', 'Fri', 'Teens')}>
                    <span className="font-semibold text-[#C7A26A] block">Boxing</span>
                    <span className="text-[10px] text-white/70">Teens</span>
                  </td>
                </tr>

                {/* 7:00 – 8:00 PM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 font-mono font-medium text-white/70 whitespace-nowrap">07:00 – 08:00 PM</td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors" onClick={() => openEnquiryCell('Dance Fitness', '07:00 PM – 08:00 PM', 'Mon', 'Adults')}>
                    <span className="font-semibold text-[#C7A26A] block">Dance Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors" onClick={() => openEnquiryCell('Dance Fitness', '07:00 PM – 08:00 PM', 'Wed', 'Adults')}>
                    <span className="font-semibold text-[#C7A26A] block">Dance Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors" onClick={() => openEnquiryCell('Dance', '07:00 PM – 08:00 PM', 'Fri', 'Adults')}>
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                </tr>

                {/* 8:00 – 9:00 PM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 font-mono font-medium text-white/70 whitespace-nowrap">08:00 – 09:00 PM</td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors" onClick={() => openEnquiryCell('Boxing', '08:00 PM – 09:00 PM', 'Mon', 'Teens / Adults')}>
                    <span className="font-semibold text-white block">Boxing</span>
                    <span className="text-[10px] text-white/50">Teens / Adults</span>
                  </td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors" onClick={() => openEnquiryCell('Boxing', '08:00 PM – 09:00 PM', 'Wed', 'Adults')}>
                    <span className="font-semibold text-white block">Boxing</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3.5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors" onClick={() => openEnquiryCell('Dance Fitness', '08:00 PM – 09:00 PM', 'Fri', 'Adults')}>
                    <span className="font-semibold text-[#C7A26A] block">Dance Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                </tr>

                {/* 9:00 – 10:00 PM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 font-mono font-medium text-white/70 whitespace-nowrap">09:00 – 10:00 PM</td>
                  <td
                    colSpan={3}
                    onClick={() => openEnquiryCell('Personal Training', '09:00 PM – 10:00 PM', 'MWF', 'Adults')}
                    className="p-3.5 text-center bg-white/5 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors border-l border-white/10"
                  >
                    <span className="font-semibold text-white/80 block">Personal Training (Adults)</span>
                    <span className="text-[10px] text-white/50">Mon · Wed · Fri 1-on-1 Night Conditioning &amp; Recovery</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Studio Enquiry Modal */}
      <StudioEnquiryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (typeof window !== 'undefined' && window.location.hash === '#studio-enquiry') {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
        initialData={enquiryData}
      />
    </div>
  );
}
