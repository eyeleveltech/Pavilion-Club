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
          // If explicitly navigating to studio enquiry
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
        targetGroup: slot.targetGroup,
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
        (selectedGroup === 'Juniors' && slot.targetGroup === 'Juniors') ||
        (selectedGroup === 'Teens' && slot.targetGroup === 'Teens');
      return matchesDay && matchesPillar && matchesGroup;
    });
  }, [activeDay, selectedPillar, selectedGroup]);

  // Master time rows for Grid View
  const GRID_TIME_ROWS = [
    { label: '6:00 – 7:00 AM', id: '6-7' },
    { label: '7:00 – 8:00 AM', id: '7-8' },
    { label: '8:00 – 9:00 AM', id: '8-9' },
    { label: '9:00 AM – 4:00 PM', id: '9-4', isDaytimeBlock: true },
    { label: '4:00 – 5:00 PM', id: '4-5' },
    { label: '5:00 – 6:00 PM', id: '5-6' },
    { label: '6:00 – 7:00 PM', id: '6-7pm' },
    { label: '7:00 – 8:00 PM', id: '7-8pm' },
    { label: '8:00 – 9:00 PM', id: '8-9pm' },
    { label: '9:00 – 10:00 PM', id: '9-10pm' },
  ];

  return (
    <div className="w-full mt-14 pt-12 border-t border-white/10" id="schedule">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#C7A26A] animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C7A26A]">
              7-Day Master Class Schedule
            </span>
          </div>
          <h3 className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Pavilion Studio Timetable
          </h3>
          <p className="mt-2 text-sm text-white/60 max-w-xl">
            A clear view of every class from Monday to Sunday. Filter by age group, discipline or switch to the full
            master matrix.
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
          {/* Day Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {DAYS_OF_WEEK.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveDay(d.key)}
                className={`flex-1 min-w-[100px] rounded-xl border px-4 py-3 text-center transition-all ${
                  activeDay === d.key
                    ? 'border-[#C7A26A] bg-gradient-to-b from-[#C7A26A]/20 to-[#0A1520] text-white shadow-lg'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:text-white'
                }`}
              >
                <span className="block text-[10px] uppercase tracking-wider text-[#C7A26A]/80 font-mono">
                  {d.key === 'Sat' || d.key === 'Sun' ? 'Weekend' : 'Weekday'}
                </span>
                <span className="text-sm font-semibold tracking-wide block mt-0.5">{d.label}</span>
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
                onChange={(e) => setSelectedPillar(e.target.value as any)}
                aria-label="Filter classes by discipline"
                className="rounded-lg border border-white/15 bg-[#071018] px-3 py-1.5 text-xs text-white focus:border-[#C7A26A] focus:outline-none"
              >
                <option value="All">All 5 Pillars + Rentals</option>
                {STUDIO_PILLARS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.number} · {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Group Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {TARGET_GROUPS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setSelectedGroup(g.key)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    selectedGroup === g.key
                      ? 'bg-[#C7A26A] text-black font-semibold'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Slots List */}
          {dailySlots.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-sm text-white/50">
              No classes match the selected filter on this day. Try selecting{' '}
              <button
                type="button"
                onClick={() => {
                  setSelectedPillar('All');
                  setSelectedGroup('All');
                }}
                className="text-[#C7A26A] underline"
              >
                All Disciplines
              </button>
              .
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailySlots.map((slot) => (
                <div
                  key={`${slot.id}-${activeDay}`}
                  onClick={() => openEnquiry(slot, activeDay)}
                  className="group relative rounded-2xl border border-white/10 bg-[#071018] p-5 hover:border-[#C7A26A]/50 transition-all shadow-md hover:shadow-xl flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Top Meta: Time + Target Group */}
                    <div className="flex items-center justify-between gap-3 text-xs mb-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-white/90">
                        <svg className="w-3.5 h-3.5 text-[#C7A26A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
                        </svg>
                        {slot.time}
                      </span>
                      <div className="flex items-center gap-2">
                        {slot.badge && (
                          <span className="rounded bg-[#C7A26A]/20 px-2 py-0.5 text-[10px] font-semibold text-[#C7A26A]">
                            {slot.badge}
                          </span>
                        )}
                        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                          {slot.targetGroup}
                        </span>
                      </div>
                    </div>

                    {/* Activity Title & Pillar */}
                    <h4 className="text-xl font-bold font-serif text-white group-hover:text-[#C7A26A] transition-colors">
                      {slot.activity}
                    </h4>
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

      {/* MASTER GRID VIEW (Matching Client Graphic Sheet) */}
      {viewMode === 'grid' && (
        <div className="rounded-2xl border border-white/15 bg-[#071018] overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/10 bg-[#0A1520] flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#C7A26A]">
              Full 7-Day Matrix View
            </span>
            <span className="text-xs text-white/50">Click any class cell to enquire</span>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full border-collapse text-left text-xs min-w-[850px]">
              <thead>
                <tr className="border-b border-white/15 bg-[#0d1c2b] text-[11px] uppercase tracking-wider text-[#C7A26A]">
                  <th className="p-3 w-32 font-semibold">Time</th>
                  <th className="p-3 font-semibold">Mon</th>
                  <th className="p-3 font-semibold">Tue</th>
                  <th className="p-3 font-semibold">Wed</th>
                  <th className="p-3 font-semibold">Thu</th>
                  <th className="p-3 font-semibold">Fri</th>
                  <th className="p-3 font-semibold bg-[#111f30] text-[#d4af37]">Sat</th>
                  <th className="p-3 font-semibold bg-[#111f30] text-[#d4af37]">Sun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {/* 6-7 AM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono font-medium text-white/70 whitespace-nowrap">06:00 – 07:00 AM</td>
                  <td className="p-3 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[0], 'Mon')}>
                    <span className="font-semibold text-white block">Yoga</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[0], 'Tue')}>
                    <span className="font-semibold text-white block">Yoga</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[1], 'Wed')}>
                    <span className="font-semibold text-[#C7A26A] block">Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[0], 'Thu')}>
                    <span className="font-semibold text-white block">Yoga</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[0], 'Fri')}>
                    <span className="font-semibold text-white block">Yoga</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[0], 'Sat')}>
                    <span className="font-semibold text-white block">Yoga</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[0], 'Sun')}>
                    <span className="font-semibold text-white block">Yoga</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                </tr>

                {/* 7-8 AM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono font-medium text-white/70 whitespace-nowrap">07:00 – 08:00 AM</td>
                  <td className="p-3 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[2], 'Mon')}>
                    <span className="font-semibold text-white block">Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[2], 'Tue')}>
                    <span className="font-semibold text-white block">Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[3], 'Wed')}>
                    <span className="font-semibold text-[#C7A26A] block">Yoga</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[2], 'Thu')}>
                    <span className="font-semibold text-white block">Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[2], 'Fri')}>
                    <span className="font-semibold text-white block">Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[2], 'Sat')}>
                    <span className="font-semibold text-white block">Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/10" onClick={() => openEnquiry(STUDIO_SCHEDULE[2], 'Sun')}>
                    <span className="font-semibold text-white block">Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                </tr>

                {/* 8-9 AM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono font-medium text-white/70 whitespace-nowrap">08:00 – 09:00 AM</td>
                  <td
                    colSpan={5}
                    onClick={() => openEnquiryCell('Fitness (Personal Training)', '08:00 AM – 09:00 AM', 'Mon-Fri', 'Individual')}
                    className="p-3 text-center bg-[#C7A26A]/5 border-r border-white/10 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                  >
                    <span className="font-semibold text-[#C7A26A] block">Personal Training (1-on-1)</span>
                    <span className="text-[10px] text-white/50">Mon–Fri Dedicated Individual Coaching</span>
                  </td>
                  <td
                    className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance (Kids)', '08:00 AM – 09:00 AM', 'Sat', 'Kids')}
                  >
                    <span className="font-semibold text-white block">Kids Dance</span>
                    <span className="text-[10px] text-white/50">Kids</span>
                  </td>
                  <td
                    className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance (Kids)', '08:00 AM – 09:00 AM', 'Sun', 'Kids')}
                  >
                    <span className="font-semibold text-white block">Kids Dance</span>
                    <span className="text-[10px] text-white/50">Kids</span>
                  </td>
                </tr>

                {/* 9:00 AM – 4:00 PM (Off-Peak / Weekend Morning Blocks) */}
                <tr className="bg-white/[0.01]">
                  <td className="p-3 font-mono font-medium text-white/70 whitespace-nowrap">09:00 AM – 04:00 PM</td>
                  <td
                    colSpan={5}
                    onClick={() => openEnquiryCell('School / Private / PT Slots', '09:00 AM – 04:00 PM', 'Mon-Fri', 'Institutional / Private')}
                    className="p-3 text-center bg-white/5 border-r border-white/10 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                  >
                    <span className="font-semibold text-white/80 block">School / Private / PT Slots</span>
                    <span className="text-[10px] text-white/50">Private Rehearsals &amp; Institutional Tie-ups</span>
                  </td>
                  <td className="p-2 bg-[#111f30]/40 text-[10px] space-y-1">
                    <div
                      onClick={() => openEnquiryCell('Dance (Kids)', '10:00 AM – 11:00 AM', 'Sat', 'Kids')}
                      className="p-1 rounded cursor-pointer hover:bg-[#C7A26A]/20 transition-colors"
                    >
                      <b>10-11 AM:</b> Kids Dance
                    </div>
                    <div
                      onClick={() => openEnquiryCell('Silambam', '11:00 AM – 12:00 PM', 'Sat', 'Kids')}
                      className="p-1 rounded cursor-pointer hover:bg-[#C7A26A]/20 transition-colors"
                    >
                      <b>11-12 PM:</b> Silambam (Kids)
                    </div>
                    <div
                      onClick={() => openEnquiryCell('Boxing', '12:00 PM – 01:00 PM', 'Sat', 'Juniors')}
                      className="p-1 rounded cursor-pointer hover:bg-[#C7A26A]/20 transition-colors"
                    >
                      <b>12-01 PM:</b> Boxing (Juniors)
                    </div>
                    <div
                      onClick={() => openEnquiryCell('Studio Rental', '01:00 PM – 03:00 PM', 'Sat', 'All')}
                      className="p-1 rounded cursor-pointer hover:bg-[#C7A26A]/20 transition-colors"
                    >
                      <b>01-03 PM:</b> Studio Rental
                    </div>
                    <div
                      onClick={() => openEnquiryCell('Dance (Kids)', '03:00 PM – 04:00 PM', 'Sat', 'Kids')}
                      className="p-1 rounded cursor-pointer hover:bg-[#C7A26A]/20 transition-colors"
                    >
                      <b>03-04 PM:</b> Kids Dance
                    </div>
                  </td>
                  <td className="p-2 bg-[#111f30]/40 text-[10px] space-y-1">
                    <div
                      onClick={() => openEnquiryCell('Silambam', '10:00 AM – 11:00 AM', 'Sun', 'Kids')}
                      className="p-1 rounded cursor-pointer hover:bg-[#C7A26A]/20 transition-colors"
                    >
                      <b>10-11 AM:</b> Silambam (Kids)
                    </div>
                    <div
                      onClick={() => openEnquiryCell('Boxing', '11:00 AM – 12:00 PM', 'Sun', 'Juniors')}
                      className="p-1 rounded cursor-pointer hover:bg-[#C7A26A]/20 transition-colors"
                    >
                      <b>11-12 PM:</b> Boxing (Juniors)
                    </div>
                    <div
                      onClick={() => openEnquiryCell('Practice / Rehearsal', '12:00 PM – 02:00 PM', 'Sun', 'All')}
                      className="p-1 rounded cursor-pointer hover:bg-[#C7A26A]/20 transition-colors"
                    >
                      <b>12-02 PM:</b> Practice / Rehearsal
                    </div>
                    <div
                      onClick={() => openEnquiryCell('Fitness (Personal Training)', '02:00 PM – 03:00 PM', 'Sun', 'Adults')}
                      className="p-1 rounded cursor-pointer hover:bg-[#C7A26A]/20 transition-colors"
                    >
                      <b>02-03 PM:</b> PT (Adults)
                    </div>
                    <div
                      onClick={() => openEnquiryCell('Dance (Kids)', '03:00 PM – 04:00 PM', 'Sun', 'Kids')}
                      className="p-1 rounded cursor-pointer hover:bg-[#C7A26A]/20 transition-colors"
                    >
                      <b>03-04 PM:</b> Kids Dance
                    </div>
                  </td>
                </tr>

                {/* 4-5 PM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono font-medium text-white/70 whitespace-nowrap">04:00 – 05:00 PM</td>
                  <td
                    colSpan={5}
                    onClick={() => openEnquiryCell('Dance (Kids Daily Batch)', '04:00 PM – 05:00 PM', 'Mon-Fri', 'Kids')}
                    className="p-3 text-center bg-[#0d1c2b]/70 border-r border-white/10 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                  >
                    <span className="font-semibold text-white block">Kids Dance (Daily Batch)</span>
                    <span className="text-[10px] text-white/50">Ages 4–10 · After-School Movement</span>
                  </td>
                  <td
                    className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance', '04:00 PM – 05:00 PM', 'Sat', 'Juniors')}
                  >
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Juniors</span>
                  </td>
                  <td
                    className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance', '04:00 PM – 05:00 PM', 'Sun', 'Juniors')}
                  >
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Juniors</span>
                  </td>
                </tr>

                {/* 5-6 PM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono font-medium text-white/70 whitespace-nowrap">05:00 – 06:00 PM</td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance', '05:00 PM – 06:00 PM', 'Mon', 'Kids & Juniors')}
                  >
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Kids &amp; Juniors</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Silambam', '05:00 PM – 06:00 PM', 'Tue', 'Kids & Juniors')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Silambam</span>
                    <span className="text-[10px] text-white/50">Kids &amp; Juniors</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance', '05:00 PM – 06:00 PM', 'Wed', 'Kids & Juniors')}
                  >
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Kids &amp; Juniors</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Silambam', '05:00 PM – 06:00 PM', 'Thu', 'Kids & Juniors')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Silambam</span>
                    <span className="text-[10px] text-white/50">Kids &amp; Juniors</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance', '05:00 PM – 06:00 PM', 'Fri', 'Kids & Juniors')}
                  >
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Kids &amp; Juniors</span>
                  </td>
                  <td
                    className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance', '05:00 PM – 06:00 PM', 'Sat', 'Teens')}
                  >
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Teens</span>
                  </td>
                  <td
                    className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance', '05:00 PM – 06:00 PM', 'Sun', 'Teens')}
                  >
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Teens</span>
                  </td>
                </tr>

                {/* 6-7 PM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono font-medium text-white/70 whitespace-nowrap">06:00 – 07:00 PM</td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance', '06:00 PM – 07:00 PM', 'Mon', 'Teens')}
                  >
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Teens</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Boxing', '06:00 PM – 07:00 PM', 'Tue', 'Teens')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Boxing</span>
                    <span className="text-[10px] text-white/50">Teens</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance', '06:00 PM – 07:00 PM', 'Wed', 'Teens')}
                  >
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Teens</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Boxing', '06:00 PM – 07:00 PM', 'Thu', 'Teens')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Boxing</span>
                    <span className="text-[10px] text-white/50">Teens</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance', '06:00 PM – 07:00 PM', 'Fri', 'Teens')}
                  >
                    <span className="font-semibold text-white block">Dance</span>
                    <span className="text-[10px] text-white/50">Teens</span>
                  </td>
                  <td
                    className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance Fitness (Salsa)', '06:00 PM – 07:00 PM', 'Sat', 'Adults')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Salsa</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td
                    className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance Fitness (Salsa)', '06:00 PM – 07:00 PM', 'Sun', 'Adults')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Salsa</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                </tr>

                {/* 7-8 PM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono font-medium text-white/70 whitespace-nowrap">07:00 – 08:00 PM</td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance Fitness', '07:00 PM – 08:00 PM', 'Mon', 'Adults')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Dance Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance Fitness (Salsa)', '07:00 PM – 08:00 PM', 'Tue', 'Adults')}
                  >
                    <span className="font-semibold text-white block">Salsa</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance Fitness', '07:00 PM – 08:00 PM', 'Wed', 'Adults')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Dance Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance Fitness (Salsa)', '07:00 PM – 08:00 PM', 'Thu', 'Adults')}
                  >
                    <span className="font-semibold text-white block">Salsa</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance Fitness', '07:00 PM – 08:00 PM', 'Fri', 'Adults')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Dance Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td
                    className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance Fitness', '07:00 PM – 08:00 PM', 'Sat', 'Adults')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Dance Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td
                    className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance Fitness', '07:00 PM – 08:00 PM', 'Sun', 'Adults')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Dance Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                </tr>

                {/* 8-9 PM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono font-medium text-white/70 whitespace-nowrap">08:00 – 09:00 PM</td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Boxing', '08:00 PM – 09:00 PM', 'Mon', 'Teens / Adults')}
                  >
                    <span className="font-semibold text-white block">Boxing</span>
                    <span className="text-[10px] text-white/50">Teens / Adults</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance Fitness', '08:00 PM – 09:00 PM', 'Tue', 'Adults')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Dance Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Boxing', '08:00 PM – 09:00 PM', 'Wed', 'Adults')}
                  >
                    <span className="font-semibold text-white block">Boxing</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance Fitness', '08:00 PM – 09:00 PM', 'Thu', 'Adults')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Dance Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td
                    className="p-3 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Dance Fitness', '08:00 PM – 09:00 PM', 'Fri', 'Adults')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">Dance Fitness</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td
                    className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Boxing', '08:00 PM – 09:00 PM', 'Sat', 'Adults')}
                  >
                    <span className="font-semibold text-white block">Boxing</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td
                    className="p-3 bg-[#C7A26A]/20 border border-[#C7A26A]/40 cursor-pointer hover:bg-[#C7A26A]/30 transition-colors"
                    onClick={() => openEnquiryCell('Special Workshop', '08:00 PM – 09:00 PM', 'Sun', 'All')}
                  >
                    <span className="font-semibold text-[#C7A26A] block">★ Workshop</span>
                    <span className="text-[10px] text-white/70">Special (All)</span>
                  </td>
                </tr>

                {/* 9-10 PM */}
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono font-medium text-white/70 whitespace-nowrap">09:00 – 10:00 PM</td>
                  <td
                    colSpan={5}
                    onClick={() => openEnquiryCell('Fitness (Personal Training)', '09:00 PM – 10:00 PM', 'Mon-Fri', 'Adults')}
                    className="p-3 text-center bg-white/5 border-r border-white/10 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                  >
                    <span className="font-semibold text-white/80 block">Personal Training (Adults)</span>
                    <span className="text-[10px] text-white/50">1-on-1 Night Conditioning &amp; Recovery</span>
                  </td>
                  <td
                    className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Open Practice / PT', '09:00 PM – 10:00 PM', 'Sat', 'Adults')}
                  >
                    <span className="font-semibold text-white block">Open Practice</span>
                    <span className="text-[10px] text-white/50">Adults</span>
                  </td>
                  <td
                    className="p-3 bg-[#111f30]/40 cursor-pointer hover:bg-[#C7A26A]/15 transition-colors"
                    onClick={() => openEnquiryCell('Open Practice / PT', '09:00 PM – 10:00 PM', 'Sun', 'Adults')}
                  >
                    <span className="font-semibold text-white block">Open Practice</span>
                    <span className="text-[10px] text-white/50">Adults</span>
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
