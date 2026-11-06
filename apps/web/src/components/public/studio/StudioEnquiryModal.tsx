'use client';

import React, { useEffect, useState } from 'react';
import { CLUB } from '@/lib/club';
import { GoldButton } from '@/components/public/site/GoldButton';
import { addStudioEnquiry } from '@/lib/enquiry-store';

export interface StudioEnquiryData {
  activity?: string;
  timeSlot?: string;
  day?: string;
  targetGroup?: string;
}

export interface StudioEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: StudioEnquiryData | null;
}

export interface StudioCategoryOption {
  id: string;
  num: string;
  title: string;
  desc: string;
  defaultTarget?: string;
}

export const STUDIO_CATEGORIES: StudioCategoryOption[] = [
  { id: 'dance', num: '01', title: 'Dance', desc: 'Hip-Hop, Contemporary & Freestyle Choreography', defaultTarget: 'Juniors (Ages 10–14)' },
  { id: 'salsa', num: '02', title: 'Salsa & Latin Social', desc: 'Partnerwork, Musicality, Body Isolation & Styling', defaultTarget: 'Adults (18+)' },
  { id: 'dance-fitness', num: '03', title: 'Dance Fitness', desc: 'High-Energy Cardio Dance & Dynamic Core Burn', defaultTarget: 'Adults (18+)' },
  { id: 'yoga', num: '04', title: 'Yoga & Mindful Movement', desc: 'Hatha Flow, Alignment, Breathwork & Morning Reset', defaultTarget: 'Adults (18+)' },
  { id: 'silambam', num: '05', title: 'Silambam (Martial Arts)', desc: 'Traditional Stick Rotation, Discipline & Footwork', defaultTarget: 'Kids (Ages 4–10)' },
  { id: 'boxing', num: '06', title: 'Boxing & Combat', desc: 'Punch Power, Heavy Bags, Stance & Pad Drills', defaultTarget: 'Teens (Ages 14–18)' },
  { id: 'pt', num: '07', title: 'Personal Training (1-on-1)', desc: 'Dedicated Individual Coaching & Custom Programming', defaultTarget: 'Adults (18+)' },
  { id: 'workshop', num: '08', title: 'Special Workshop', desc: 'Curated Guest Masterclasses & Weekend Labs', defaultTarget: 'All Ages' },
  { id: 'rental', num: '09', title: 'Studio Rental & Practice', desc: 'Private Floor Rehearsals & Production Bookings', defaultTarget: 'All Ages' },
];

// Alias for backward compatibility if imported elsewhere
export const STUDIO_PILLARS = STUDIO_CATEGORIES;

export const STUDIO_TARGET_GROUPS = [
  'Kids (Ages 4–10)',
  'Juniors (Ages 10–14)',
  'Teens (Ages 14–18)',
  'Adults (18+)',
  'All Ages',
];

export const STUDIO_DAYS = [
  { key: 'Mon', label: 'Monday' },
  { key: 'Wed', label: 'Wednesday' },
  { key: 'Fri', label: 'Friday' },
  { key: 'MWF', label: 'Mon · Wed · Fri (All)' },
];

export const STUDIO_TIME_SLOTS = [
  { value: '06:00 AM – 07:00 AM', label: '06:00 AM – 07:00 AM · Yoga / Fitness (Adults)' },
  { value: '07:00 AM – 08:00 AM', label: '07:00 AM – 08:00 AM · Fitness / Yoga (Adults)' },
  { value: '08:00 AM – 09:00 AM', label: '08:00 AM – 09:00 AM · Personal Training (1-on-1)' },
  { value: '09:00 AM – 04:00 PM', label: '09:00 AM – 04:00 PM · School / Private Rehearsals / PT' },
  { value: '04:00 PM – 05:00 PM', label: '04:00 PM – 05:00 PM · Kids Dance (Ages 4–10)' },
  { value: '05:00 PM – 06:00 PM', label: '05:00 PM – 06:00 PM · Dance (Kids & Juniors)' },
  { value: '06:00 PM – 07:00 PM', label: '06:00 PM – 07:00 PM · Dance (Teens) / Boxing (Fri Teens)' },
  { value: '07:00 PM – 08:00 PM', label: '07:00 PM – 08:00 PM · Dance Fitness / Dance (Fri Adults)' },
  { value: '08:00 PM – 09:00 PM', label: '08:00 PM – 09:00 PM · Boxing / Dance Fitness (Fri Adults)' },
  { value: '09:00 PM – 10:00 PM', label: '09:00 PM – 10:00 PM · Night Personal Training (Adults)' },
];

export function StudioEnquiryModal({ isOpen, onClose, initialData }: StudioEnquiryModalProps) {
  // Step State: 1 = Personal Particulars (I), 2 = Category & Cohort (II), 3 = Slot & Timing (III), 4 = Confirmed
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields - Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Form Fields - Step 2 (Category, Cohort, Level)
  const [category, setCategory] = useState<string>(STUDIO_CATEGORIES[0]?.title ?? 'Dance');
  const [targetGroup, setTargetGroup] = useState<string>('Adults (18+)');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');

  // Form Fields - Step 3 (Slot, Day, Notes)
  const [selectedDay, setSelectedDay] = useState<string>('Mon');
  const [timeSlot, setTimeSlot] = useState<string>(STUDIO_TIME_SLOTS[0]?.value ?? '06:00 AM – 07:00 AM');
  const [notes, setNotes] = useState('');

  // Validation & Reference State
  const [formError, setFormError] = useState('');
  const [refId, setRefId] = useState('');

  // Sync initialData if triggered from timetable cell or card
  useEffect(() => {
    if (!initialData) return;

    // 1. Map Activity to specific Category
    const act = (initialData.activity || '').toLowerCase();
    if (act.includes('salsa')) {
      setCategory('Salsa & Latin Social');
    } else if (act.includes('silambam')) {
      setCategory('Silambam (Martial Arts)');
    } else if (act.includes('boxing')) {
      setCategory('Boxing & Combat');
    } else if (act.includes('yoga')) {
      setCategory('Yoga & Mindful Movement');
    } else if (act.includes('personal training') || act.includes('pt')) {
      setCategory('Personal Training (1-on-1)');
    } else if (act.includes('dance fitness')) {
      setCategory('Dance Fitness');
    } else if (act.includes('workshop')) {
      setCategory('Special Workshop');
    } else if (act.includes('rental') || act.includes('practice') || act.includes('rehearsal') || act.includes('school')) {
      setCategory('Studio Rental & Practice');
    } else if (act.includes('dance')) {
      setCategory('Dance');
    }

    // 2. Map Target Group / Cohort
    const tg = (initialData.targetGroup || '').toLowerCase();
    if (tg.includes('kid')) {
      setTargetGroup('Kids (Ages 4–10)');
    } else if (tg.includes('junior')) {
      setTargetGroup('Juniors (Ages 10–14)');
    } else if (tg.includes('teen')) {
      setTargetGroup('Teens (Ages 14–18)');
    } else if (tg.includes('adult')) {
      setTargetGroup('Adults (18+)');
    } else if (tg.includes('all')) {
      setTargetGroup('All Ages');
    }

    // 3. Map Day
    if (initialData.day) {
      const d = initialData.day;
      const matchedDay = STUDIO_DAYS.find(
        (sd) => sd.key.toLowerCase() === d.toLowerCase() || sd.label.toLowerCase().includes(d.toLowerCase())
      );
      if (matchedDay) {
        setSelectedDay(matchedDay.key);
      } else {
        setSelectedDay(d);
      }
    }

    // 4. Map Time Slot accurately
    if (initialData.timeSlot) {
      const slotClean = initialData.timeSlot.trim();
      const matched = STUDIO_TIME_SLOTS.find(
        (s) =>
          s.value.toLowerCase() === slotClean.toLowerCase() ||
          s.value.toLowerCase().includes(slotClean.toLowerCase()) ||
          slotClean.toLowerCase().includes(s.value.toLowerCase())
      );
      if (matched) {
        setTimeSlot(matched.value);
      } else {
        // Fallback: match by hour numbers and AM/PM
        const isPM = /pm/i.test(slotClean);
        const digits = slotClean.match(/\d+/g)?.slice(0, 2).join('');
        const found = STUDIO_TIME_SLOTS.find((s) => {
          const sPM = /pm/i.test(s.value);
          const sDigits = s.value.match(/\d+/g)?.slice(0, 2).join('');
          return digits === sDigits && isPM === sPM;
        });
        if (found) {
          setTimeSlot(found.value);
        } else {
          setTimeSlot(slotClean);
        }
      }
    }
  }, [initialData]);

  // Lock body scroll while modal is active & reset step
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setFormError('');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Step 1 Validation
  const handleProceedToCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter your name.');
      return;
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setStep(2);
  };

  // Step 2 Proceed
  const handleProceedToSlot = () => {
    setFormError('');
    setStep(3);
  };

  // Step 3 Final Submission
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRef = `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setRefId(newRef);

    // Auto-save to Front Desk Enquiries Console
    addStudioEnquiry({
      reference: newRef,
      name: name.trim(),
      phone: phone.replace(/\D/g, ''),
      email: email.trim().toLowerCase(),
      category,
      cohort: targetGroup,
      day: selectedDay,
      timeSlot,
      level,
      notes: notes.trim(),
    });

    setStep(4);
  };

  const handleReset = () => {
    setStep(1);
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setFormError('');
    onClose();
  };

  const romanSteps = ['I', 'II', 'III'] as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-modal-title"
      data-lenis-prevent="true"
      className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-[#040911]/92 backdrop-blur-md animate-modal-backdrop flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes modalBackdropFade {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(12px); }
        }
        @keyframes modalCardPop {
          0% { opacity: 0; transform: scale(0.97) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes stepContentIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-modal-backdrop {
          animation: modalBackdropFade 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-modal-card {
          animation: modalCardPop 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-step-in {
          animation: stepContentIn 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .studio-modal-scroll { overflow-x: hidden !important; }
        .studio-modal-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .studio-modal-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .studio-modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(199, 162, 106, 0.35);
          border-radius: 4px;
        }
      `}</style>

      {/* Monocle Roman Luxury Card */}
      <div
        data-lenis-prevent="true"
        className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] flex flex-col rounded-2xl border border-[#c7a26a]/40 bg-[#09131e] px-5 py-5 sm:px-7 sm:py-6 text-[#fbf8f1] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(199,162,106,0.12)] z-10 animate-modal-card overflow-hidden font-serif"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#c7a26a]/20 shrink-0 mb-1 font-sans">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c7a26a] animate-pulse" />
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.28em] text-[#c7a26a]">
              The Pavilion Studio
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Roman Numerals Stepper (I · II · III) */}
            {step < 4 && (
              <div className="flex items-center gap-3 font-serif text-xs">
                {romanSteps.map((roman, idx) => {
                  const stepNumber = idx + 1;
                  const isActive = step === stepNumber;
                  const isDone = step > stepNumber;
                  return (
                    <span
                      key={roman}
                      className={`transition-all duration-300 font-medium ${
                        isActive
                          ? 'text-[#c7a26a] border-b-2 border-[#c7a26a] pb-0.5'
                          : isDone
                            ? 'text-white/80'
                            : 'text-white/30'
                      }`}
                    >
                      {roman}
                    </span>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-white/50 hover:text-[#c7a26a] hover:bg-white/5 transition-all active:scale-95 ml-1"
              aria-label="Close dialog"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div data-lenis-prevent="true" className="overflow-y-auto overflow-x-hidden overscroll-contain flex-1 py-1 studio-modal-scroll pr-1 space-y-4 font-sans">
          {/* ======================================================== */}
          {/* STEP I: Personal Particulars (Name, Email, Mobile Number) */}
          {/* ======================================================== */}
          {step === 1 && (
            <form onSubmit={handleProceedToCategory} className="space-y-4 animate-step-in">
              <div className="text-left pb-1">
                <h2 id="studio-modal-title" className="font-serif text-2xl sm:text-3xl font-normal italic text-[#fbf8f1]">
                  Personal Particulars.
                </h2>
                <p className="mt-1 text-xs text-[#fbf8f1]/65 max-w-sm">
                  Step I: Please share your credentials for studio enrolment.
                </p>
              </div>

              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/70 mb-1 font-sans">
                    Name <span className="text-[#c7a26a]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] placeholder-white/30 text-xs focus:outline-none focus:border-[#c7a26a] transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/70 mb-1 font-sans">
                    Email <span className="text-[#c7a26a]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] placeholder-white/30 text-xs focus:outline-none focus:border-[#c7a26a] transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/70 mb-1 font-sans">
                    Mobile Number <span className="text-[#c7a26a]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Mobile Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] placeholder-white/30 text-xs focus:outline-none focus:border-[#c7a26a] transition-all font-sans"
                  />
                </div>
              </div>

              {formError && (
                <p role="alert" className="text-xs text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg p-2 text-center animate-step-in font-sans">
                  {formError}
                </p>
              )}

              <GoldButton
                type="submit"
                fullWidth
                className="mt-2"
              >
                Proceed to Step II →
              </GoldButton>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP II: Category & Cohort (Discipline, Age Group & Level) */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="space-y-4 animate-step-in">
              <div className="text-left pb-1">
                <h2 className="font-serif text-2xl sm:text-3xl font-normal italic text-[#fbf8f1]">
                  Category &amp; Cohort.
                </h2>
                <p className="mt-1 text-xs text-[#fbf8f1]/65 max-w-sm">
                  Step II: Select your studio discipline, age group &amp; experience level.
                </p>
              </div>

              {/* Category Selector List */}
              <div>
                <label className="block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/70 mb-1.5 font-sans">
                  Studio Discipline / Category <span className="text-[#c7a26a]">*</span>
                </label>
                <div className="max-h-56 overflow-y-auto studio-modal-scroll divide-y divide-white/10 border border-white/10 rounded-xl bg-[#060d15]/60 pr-1">
                  {STUDIO_CATEGORIES.map((cat) => {
                    const isSelected = category === cat.title;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setCategory(cat.title);
                          if (cat.defaultTarget && (!targetGroup || targetGroup === 'Adults (18+)')) {
                            setTargetGroup(cat.defaultTarget);
                          }
                        }}
                        className={`p-2.5 sm:px-3 sm:py-2.5 flex items-center justify-between cursor-pointer transition-all ${
                          isSelected ? 'bg-[#c7a26a]/15' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-[#c7a26a]">{cat.num}</span>
                          <div>
                            <span className={`text-xs sm:text-sm font-serif ${isSelected ? 'text-[#c7a26a] font-semibold' : 'text-white'}`}>
                              {cat.title}
                            </span>
                            <span className="block text-[10px] text-white/50 font-sans">{cat.desc}</span>
                          </div>
                        </div>
                        <span className={`text-xs ${isSelected ? 'text-[#c7a26a]' : 'text-white/20'}`}>
                          {isSelected ? '●' : '○'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Age Group / Cohort Pills */}
              <div>
                <label className="block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/70 mb-1.5 font-sans">
                  Target Group / Cohort
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STUDIO_TARGET_GROUPS.map((tg) => (
                    <button
                      type="button"
                      key={tg}
                      onClick={() => setTargetGroup(tg)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                        targetGroup === tg
                          ? 'border-[#c7a26a] bg-[#c7a26a]/20 text-[#c7a26a] font-bold shadow-[0_0_10px_rgba(199,162,106,0.18)]'
                          : 'border-white/15 bg-white/[0.02] text-white/60 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      {tg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/70 mb-1.5 font-sans">
                  Experience Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={`h-9 rounded-lg border text-xs font-medium transition-all active:scale-95 font-sans ${
                        level === lvl
                          ? 'border-[#c7a26a] bg-[#c7a26a]/20 text-[#c7a26a] font-bold shadow-[0_0_12px_rgba(199,162,106,0.18)]'
                          : 'border-white/15 bg-white/[0.02] text-white/60 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 h-[46px] rounded-none border border-white/20 hover:border-white/40 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/80 hover:text-white transition-all active:scale-95"
                >
                  ← Back
                </button>
                <GoldButton
                  type="button"
                  onClick={handleProceedToSlot}
                  className="flex-1"
                >
                  Step III: Slot &amp; Timing →
                </GoldButton>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP III: Slot & Timing (Day Selection & Schedule Slot) */}
          {/* ======================================================== */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4 animate-step-in">
              <div className="text-left pb-1">
                <h2 className="font-serif text-2xl sm:text-3xl font-normal italic text-[#fbf8f1]">
                  Slot &amp; Timing.
                </h2>
                <p className="mt-1 text-xs text-[#fbf8f1]/65 max-w-sm">
                  Step III: Select your preferred day &amp; class timing slot.
                </p>
              </div>

              <div className="space-y-3.5 pt-1">
                {/* Day of Week Selector */}
                <div>
                  <label className="block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/70 mb-1.5 font-sans">
                    Preferred Day <span className="text-[#c7a26a]">*</span>
                    <span className="text-[10px] text-[#c7a26a] lowercase ml-2 font-normal">(Mon · Wed · Fri sessions)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STUDIO_DAYS.map((d) => (
                      <button
                        type="button"
                        key={d.key}
                        onClick={() => setSelectedDay(d.key)}
                        className={`py-2 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                          selectedDay === d.key
                            ? 'border-[#c7a26a] bg-[#c7a26a]/20 text-[#c7a26a] font-bold shadow-[0_0_10px_rgba(199,162,106,0.15)]'
                            : 'border-white/15 bg-white/[0.02] text-white/60 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Class Timing Slot Dropdown */}
                <div>
                  <label className="block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/70 mb-1 font-sans">
                    Class Timing Slot <span className="text-[#c7a26a]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full h-11 appearance-none rounded-lg border border-white/15 bg-[#060d15] px-3.5 pr-10 text-xs text-[#fbf8f1] focus:outline-none focus:border-[#c7a26a] transition-all cursor-pointer font-sans"
                    >
                      {STUDIO_TIME_SLOTS.map((s) => (
                        <option key={s.value} value={s.value} className="bg-[#08111d] text-white">
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#c7a26a]">
                      <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/70 mb-1 font-sans">
                    Participant Notes / Special Requests (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Enquiring for my 8-year-old child for Kids Dance & Silambam..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] placeholder-white/30 text-xs focus:outline-none focus:border-[#c7a26a] transition-all resize-none font-sans"
                  />
                </div>

                {/* Editorial Monocle Review Strip */}
                <div className="rounded-xl border border-[#c7a26a]/30 bg-[#060d15] p-3.5 text-xs space-y-1.5 font-sans">
                  <div className="flex justify-between items-center text-white/60">
                    <span>Enquirer:</span>
                    <span className="font-semibold text-white truncate max-w-[200px]">{name} ({email})</span>
                  </div>
                  <div className="flex justify-between items-center text-white/60">
                    <span>Category &amp; Cohort:</span>
                    <span className="font-semibold text-[#c7a26a]">{category} · {targetGroup}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/60">
                    <span>Slot &amp; Timing:</span>
                    <span className="font-medium text-white">{selectedDay} · {timeSlot}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/60">
                    <span>Mobile:</span>
                    <span className="font-mono text-white/90">{phone}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 h-[46px] rounded-none border border-white/20 hover:border-white/40 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/80 hover:text-white transition-all active:scale-95"
                >
                  ← Back
                </button>
                <GoldButton
                  type="submit"
                  className="flex-1"
                >
                  Transmit Enquiry ✓
                </GoldButton>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP IV: Registered & Confirmed */}
          {/* ======================================================== */}
          {step === 4 && (
            <div className="py-6 text-center space-y-4 animate-step-in font-sans">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#c7a26a]/20 border border-[#c7a26a]/40 text-[#c7a26a]">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h3 className="text-2xl font-serif italic text-white">Your reservation is registered.</h3>
                <p className="mt-1 text-xs text-white/60">
                  Reference <span className="font-mono text-[#c7a26a] font-semibold">#{refId}</span> · Confirmation transmitted to your email.
                </p>
              </div>

              {/* Summary Card */}
              <div className="rounded-xl border border-white/10 bg-[#060d15] p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-white/50">Discipline / Category</span>
                  <span className="font-semibold text-[#c7a26a] font-serif">{category}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-white/50">Target Group</span>
                  <span className="font-medium text-white">{targetGroup}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-white/50">Slot &amp; Timing</span>
                  <span className="font-medium text-white">{selectedDay} · {timeSlot}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-white/50">Level</span>
                  <span className="font-medium text-white">{level}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-white/50">Name</span>
                  <span className="font-medium text-white">{name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-white/50">Email</span>
                  <span className="font-medium text-white">{email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50">Mobile</span>
                  <span className="font-mono text-white/90">{phone}</span>
                </div>
              </div>

              <p className="text-[11px] text-white/50">
                Our Studio Desk will communicate batch schedule and trial availability. Immediate desk: <strong className="text-white">{CLUB.phoneDisplay}</strong>.
              </p>

              <button
                type="button"
                onClick={handleReset}
                className="w-full h-[46px] rounded-none border border-white/20 hover:border-white/40 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95"
              >
                Done &amp; Close
              </button>
            </div>
          )}
        </div>

        {/* Pinned Monocle Footer Note */}
        <div className="pt-3 border-t border-[#c7a26a]/20 shrink-0 text-center text-[10px] text-white/40 font-sans tracking-wider">
          Pavilion Studio · The Pavilion Club · Mogappair East, Chennai · Desk {CLUB.phoneDisplay}
        </div>
      </div>
    </div>
  );
}
