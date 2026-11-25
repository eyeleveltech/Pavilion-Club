'use client';

import React from 'react';

export function StudioTimetable() {
  React.useEffect(() => {
    const checkHash = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash === '#studio-enquiry' || hash === '#studio') {
          const formEl = document.getElementById('enquire');
          if (formEl) {
            formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a[href="#studio-enquiry"]');
      if (target) {
        const formEl = document.getElementById('enquire');
        if (formEl) {
          e.preventDefault();
          const catSelect = document.querySelector<HTMLSelectElement>('#enquire select[name="category"]');
          if (catSelect && catSelect.value !== 'studio') {
            catSelect.value = 'studio';
            catSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
          formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => {
            const nameInput = document.querySelector<HTMLInputElement>('#enquire input[name="name"]');
            nameInput?.focus();
          }, 400);
          return;
        }
      }
    };
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('hashchange', checkHash);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const openEnquiryCell = (activity: string, timeSlot: string, day: string, targetGroup = 'Adults') => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pavilion-select-category', {
          detail: {
            category: 'studio',
            programme: activity,
            cohort: targetGroup,
          },
        })
      );
      const formEl = document.getElementById('enquire');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          const nameInput = document.querySelector<HTMLInputElement>('#enquire input[name="name"]');
          nameInput?.focus();
        }, 400);
      } else {
        window.location.href = '/studio/#membership';
      }
    }
  };

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
            Sessions held exclusively on <span className="text-[#C7A26A] font-semibold">Monday, Wednesday &amp; Friday</span> (6:00 AM – 10:00 PM). Click any class slot in the matrix below to apply online.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#enquire"
            className="inline-flex items-center gap-2 rounded-xl border border-[#C7A26A]/40 bg-[#C7A26A]/10 px-4 py-2.5 text-xs font-semibold text-[#C7A26A] hover:bg-[#C7A26A] hover:text-black transition-all"
          >
            Apply for Class Slot
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </div>

      {/* MASTER GRID VIEW (Matching Client Graphic Sheet 100%) */}
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
    </div>
  );
}
