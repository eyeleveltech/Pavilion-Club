'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { submitEnquiry } from '@/lib/turfos-client';
import { addPickleballEnquiry, addStudioEnquiry } from '@/lib/enquiry-store';
import { CLUB, whatsappUrl } from '@/lib/club';
import { GoldButton } from '@/components/public/site/GoldButton';
import { Heading } from '@/components/public/site/SitePage';
import { cx } from '@/components/public/book/ui';
import {
  PrintRegistrationSheet,
  type PrintableRegistrationData,
} from '@/components/public/studio/PrintRegistrationSheet';
import {
  LuxuryMetalPassCard,
  type MemberPass,
} from '@/components/public/membership/MembershipCheckoutModal';

const MEMBERSHIP_PRICE_PAISE = 236000; // ₹2,360 (₹2,000 + 18% GST ₹360)
const STORAGE_KEY = 'pavilion_member_pass';

const STUDIO_PROGRAMMES = [
  'Dance (Hip-Hop & Contemporary)',
  'Salsa & Latin Social',
  'Dance Fitness (Cardio & Core)',
  'Yoga & Mindful Movement',
  'Boxing & Combat Conditioning',
  'Silambam (Traditional Martial Arts)',
  'Gymnastics & Tumbling',
  'Personal Training (1-on-1)',
  'Studio Floor Rental',
];

const STUDIO_COHORTS = [
  'Kids (Ages 4–10)',
  'Juniors (Ages 10–14)',
  'Teens (Ages 14–18)',
  'Adults (18+)',
  'All Ages / Open Batch',
];

const STUDIO_BATCH_OPTIONS = [
  'Weekday Batch (Mon · Wed · Fri · 12 Classes)',
  'Weekend Batch (Sat · Sun · 8 Classes)',
  'Morning Batch (06:00 AM – 07:00 AM)',
  'Evening Batch (05:00 PM – 06:00 PM)',
  'Night Batch (07:00 PM – 08:00 PM)',
];

function generateMemberReference(category: 'pickleball' | 'studio'): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const prefix = category === 'pickleball' ? 'PAV-MEM' : 'PAV-STU';
  return `${prefix}-${year}-${randomPart}`;
}

const control =
  'mt-1 block w-full rounded-none border-0 border-b border-[rgba(15,30,46,.24)] bg-transparent px-0 py-3 text-[1rem] text-navy placeholder:text-ink-faint transition-[border-color,box-shadow] duration-300 focus:border-navy focus:shadow-[0_1px_0_0_var(--navy)] focus:outline-none';

export function UnifiedMembershipFormSection() {
  // Category Selection: 'pickleball' (12h Quota) vs 'studio' (Dance/Yoga/Boxing)
  const [category, setCategory] = useState<'pickleball' | 'studio'>('pickleball');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Studio Fields
  const [studioProgramme, setStudioProgramme] = useState(STUDIO_PROGRAMMES[0] ?? 'Dance');
  const [studioCohort, setStudioCohort] = useState(STUDIO_COHORTS[3] ?? 'Adults (18+)');
  const [studioBatch, setStudioBatch] = useState(STUDIO_BATCH_OPTIONS[0] ?? 'Weekday Batch');
  const [selectedPackage, setSelectedPackage] = useState<{
    programme: string;
    tier?: string | undefined;
    amount?: string | undefined;
    days?: string | undefined;
  } | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<{
    reference: string;
    name: string;
    phone: string;
    email: string;
    planTitle: string;
  } | null>(null);
  const [memberPass, setMemberPass] = useState<MemberPass | null>(null);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  // Synchronize category/programme changes from external buttons (Join, Rate Card, Timetable)
  useEffect(() => {
    const handleCategoryEvent = (
      e: CustomEvent<{
        category?: 'pickleball' | 'studio';
        programme?: string;
        cohort?: string;
        batch?: string;
        pricingLabel?: string;
        pricingTier?: string;
        pricingAmount?: string;
        pricingDays?: string;
      }>
    ) => {
      if (e.detail?.category) {
        setCategory(e.detail.category);
        if (e.detail.category === 'pickleball') {
          setSelectedPackage(null);
        }
      }
      if (e.detail?.programme) {
        const raw = e.detail.programme.toLowerCase();
        const found =
          STUDIO_PROGRAMMES.find((p) => p.toLowerCase() === raw) ||
          STUDIO_PROGRAMMES.find((p) => {
            const pLow = p.toLowerCase();
            if (raw.includes('box') && pLow.includes('box')) return true;
            if (raw.includes('yoga') && pLow.includes('yoga')) return true;
            if (raw.includes('salsa') && pLow.includes('salsa')) return true;
            if (raw.includes('dance') && pLow.includes('dance') && !raw.includes('fitness') && !pLow.includes('fitness')) return true;
            if (raw.includes('fitness') && pLow.includes('fitness')) return true;
            if (raw.includes('gymnast') && pLow.includes('gymnast')) return true;
            if (raw.includes('silambam') && pLow.includes('silambam')) return true;
            if (raw.includes('personal') || raw.includes('pt')) return pLow.includes('personal');
            return pLow.includes(raw) || raw.includes(pLow);
          }) ||
          STUDIO_PROGRAMMES[0] ||
          'Dance (Hip-Hop & Contemporary)';
        setStudioProgramme(found);
      }
      if (e.detail?.batch) {
        const rawBatch = e.detail.batch.toLowerCase();
        const foundBatch =
          STUDIO_BATCH_OPTIONS.find((b) => b.toLowerCase() === rawBatch) ||
          STUDIO_BATCH_OPTIONS.find((b) => {
            const bLow = b.toLowerCase();
            if (rawBatch.includes('weekday') && bLow.includes('weekday')) return true;
            if (rawBatch.includes('weekend') && bLow.includes('weekend')) return true;
            if (rawBatch.includes('morning') && bLow.includes('morning')) return true;
            if (rawBatch.includes('evening') && bLow.includes('evening')) return true;
            if (rawBatch.includes('night') && bLow.includes('night')) return true;
            return bLow.includes(rawBatch) || rawBatch.includes(bLow);
          }) ||
          e.detail.batch;
        if (foundBatch) setStudioBatch(foundBatch);
      }
      if (e.detail?.cohort) {
        const foundCohort =
          STUDIO_COHORTS.find((c) =>
            c.toLowerCase().includes(e.detail.cohort!.toLowerCase())
          ) || e.detail.cohort;
        if (foundCohort) setStudioCohort(foundCohort);
      }
      if (e.detail?.pricingLabel || e.detail?.programme) {
        setSelectedPackage({
          programme: e.detail.pricingLabel || e.detail.programme || '',
          tier: e.detail.pricingTier,
          amount: e.detail.pricingAmount,
          days: e.detail.pricingDays,
        });
      }
    };

    window.addEventListener('pavilion-select-category' as any, handleCategoryEvent);

    // Initial check for hash or params
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#studio' || hash === '#studio-enquiry') {
        setCategory('studio');
      }
    }

    return () => {
      window.removeEventListener('pavilion-select-category' as any, handleCategoryEvent);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setFormError('Please enter your full legal name.');
      return;
    }
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!agreedTerms) {
      setFormError('Please confirm the agreement checkbox to continue.');
      return;
    }

    setIsSubmitting(true);

    const ref = generateMemberReference(category);
    const now = new Date();
    const validUntilDate = new Date(now.getTime() + 30 * 86400000);

    const planTitle =
      category === 'pickleball'
        ? 'Inaugural Shared-Play Membership (12 Hours)'
        : selectedPackage?.tier
          ? `Pavilion Studio · ${studioProgramme} (${selectedPackage.tier})`
          : `Pavilion Studio · ${studioProgramme}`;

    const submissionNotes = [
      selectedPackage
        ? `Selected Package: ${selectedPackage.programme}${selectedPackage.tier ? ' · ' + selectedPackage.tier : ''}${selectedPackage.amount ? ' (' + selectedPackage.amount + ')' : ''}${selectedPackage.days ? ' [' + selectedPackage.days + ']' : ''}`
        : null,
      notes ? `Customer Notes: ${notes}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    setSubmittedLead({
      reference: ref,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      planTitle,
    });

    // 1. Submit Registration Dossier to Pavilion Serverless Route (/api/onboard)
    try {
      await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: ref,
          category,
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          plan: planTitle,
          sessions: 12,
          studioCategory: category === 'studio' ? studioProgramme : undefined,
          studioCohort: category === 'studio' ? studioCohort : undefined,
          studioSlot: category === 'studio' ? studioBatch : undefined,
          notes: submissionNotes || notes,
          amountDisplay:
            category === 'pickleball'
              ? '₹2,360.00'
              : selectedPackage?.amount
                ? selectedPackage.amount
                : 'Studio Standard',
          paymentStatus: 'Pay at Desk',
        }),
      });
    } catch (err) {
      console.warn('API onboard delivery logged:', err);
    }

    // 2. Submit to Central Turf-OS Enquiries
    try {
      await submitEnquiry({
        type: category === 'pickleball' ? 'membership' : 'studio',
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        category: planTitle,
        notes: `Registration ref: ${ref} (12 Hours Quota). Payment: Pay at Desk.${submissionNotes ? ' ' + submissionNotes : ''}`,
        details: {
          reference: ref,
          category,
          plan: planTitle,
          sessions: 12,
          selectedPackage: selectedPackage || undefined,
        },
      });
    } catch (err) {
      console.error('[TURF-OS ENQUIRY SUBMISSION FAILED]:', err);
    }

    // 3. Add to Front Desk Console Cache
    if (category === 'pickleball') {
      addPickleballEnquiry({
        reference: ref,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        plan: 'Inaugural Shared-Play Membership (12 Hours)',
        sessions: 12,
        amountPaise: MEMBERSHIP_PRICE_PAISE,
        paymentId: 'PAY_AT_DESK',
        status: 'Pay at Desk',
        notes,
      });
    } else {
      addStudioEnquiry({
        reference: ref,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        category: studioProgramme,
        cohort: studioCohort,
        day: studioBatch,
        timeSlot: studioBatch,
        notes,
      });
    }

    setIsSubmitting(false);
  };

  const handleWhatsApp = () => {
    const text =
      category === 'pickleball'
        ? `Hello The Pavilion Club! I would like to register for the Inaugural Shared-Play Membership (12 Hours Monthly Quota, ₹2,360/mo). My name is ${name || '[Name]'}, phone ${phone || '[Phone]'}.`
        : `Hello Pavilion Studio! I would like to join the ${studioProgramme} (${studioCohort} · ${studioBatch}). My name is ${name || '[Name]'}, phone ${phone || '[Phone]'}.`;
    window.open(whatsappUrl(text), '_blank', 'noopener');
  };

  const printableData: PrintableRegistrationData | null = memberPass
    ? {
        reference: memberPass.reference,
        name: memberPass.name,
        phone: memberPass.phone,
        email: memberPass.email,
        category: memberPass.planTitle,
        cohort: memberPass.studioCohort || (memberPass.category === 'pickleball' ? 'Pickleball Member' : 'Studio Member'),
        timeSlot: memberPass.category === 'pickleball' ? 'Mon–Fri 6:00 AM – 3:00 PM (12 Hours Monthly Quota)' : studioBatch,
        amountDisplay: memberPass.category === 'pickleball' ? '₹2,360 / mo (All-Inclusive)' : 'Standard Studio Rates',
        notes: notes || undefined,
        createdAt: new Date().toISOString(),
      }
    : null;

  return (
    <section id="enquire" className="site-section site-cream site-lines scroll-mt-20">
      <div className="site-wrap site-enquire">
        {/* Left Column: Heading, Lede & Details matching Franchise page */}
        <div className="site-enquire__head">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-[11px] font-semibold text-navy">
            <span>Already registered?</span>
            <Link href="/pass/" className="font-bold underline decoration-gold hover:text-gold inline-flex items-center gap-1">
              <span>View Digital Pass &amp; Hours</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <p className="site-eyebrow">
            Member Admission &amp; Registration
          </p>

          <h2 className="site-h2 mt-7">
            Join <em>the club.</em>
          </h2>

          <p className="site-lede mt-8 max-w-md">
            Register for Pickleball Shared-Play Membership (12 Hours Monthly Quota) or The Studio Mogappair. No online payment required — pay or verify at the front desk when you arrive.
          </p>

          <div className="mt-12 space-y-6">
            {/* Highlight 1: Pickleball */}
            <div className="border-l-2 border-gold pl-5 py-0.5">
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-ink-soft block">
                Inaugural Shared-Play Offer · Save ₹1,000
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm line-through text-ink-soft/60 font-mono">₹3,000</span>
                <span className="font-serif text-2xl font-bold text-navy">₹2,360</span>
                <span className="text-xs text-ink-soft">/ month (₹2,000 + 18% GST)</span>
              </div>
              <p className="text-[0.85rem] text-ink-soft mt-1 leading-relaxed">
                Includes <strong>12 Hours of play per month</strong> (up to 1 hr daily allowance, Mon–Fri 6:00 AM – 3:00 PM). Direct walk-in court access.
              </p>
            </div>

            {/* Highlight 2: Studio */}
            <div className="border-l-2 border-gold pl-5 py-0.5">
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-ink-soft block">
                The Studio Mogappair
              </span>
              <p className="text-[0.85rem] text-ink-soft mt-1 leading-relaxed">
                Curated programmes across Dance, Salsa, Dance Fitness, Yoga, Silambam, and Boxing for Kids, Juniors, Teens and Adults.
              </p>
            </div>

            <p className="text-[0.82rem] text-ink-soft pt-1">
              Prefer to speak first? Call our front desk at{' '}
              <a href={CLUB.phoneHref} className="underline text-navy font-semibold">
                {CLUB.phoneDisplay}
              </a>{' '}
              or email{' '}
              <a href={`mailto:${CLUB.email}`} className="underline text-navy">
                {CLUB.email}
              </a>.
            </p>

            <div className="pt-2 border-t border-[rgba(15,30,46,0.12)]">
              <Link
                href="/pass"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-gold transition-colors"
              >
                <span>🪪 Already a member or applied? View your Pass &amp; Quota</span>
                <span>⟶</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Exact Franchise Form Styling */}
        <div className="site-enquire__form">
          {!submittedLead ? (
            <form onSubmit={handleSubmit} className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {/* Name */}
              <label className="block">
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-ink-soft">
                  Name <span className="text-gold-text">*</span>
                </span>
                <input
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="e.g. Suresh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={control}
                />
              </label>

              {/* Phone */}
              <label className="block">
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-ink-soft">
                  Phone <span className="text-gold-text">*</span>
                </span>
                <input
                  type="tel"
                  name="phone"
                  required
                  autoComplete="tel"
                  placeholder="+91 96000 55623"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={control}
                />
              </label>

              {/* Email */}
              <label className="block sm:col-span-2">
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-ink-soft">
                  Email <span className="text-gold-text">*</span>
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={control}
                />
              </label>

              {/* Membership Category Selection */}
              <label className="block sm:col-span-2">
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-ink-soft">
                  Membership Category <span className="text-gold-text">*</span>
                </span>
                <select
                  name="category"
                  required
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value as 'pickleball' | 'studio';
                    setCategory(val);
                    if (val === 'pickleball') setSelectedPackage(null);
                  }}
                  className={control}
                >
                  <option value="pickleball">
                    Pickleball Shared-Play Membership (12 Hours Quota · ₹2,360/mo)
                  </option>
                  <option value="studio">
                    The Studio Mogappair (Dance / Fitness / Yoga / Boxing)
                  </option>
                </select>
              </label>

              {/* Studio Specific Fields (Shown when Studio is selected) */}
              {category === 'studio' && (
                <>
                  <label className="block sm:col-span-2">
                    <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-ink-soft">
                      Studio Discipline <span className="text-gold-text">*</span>
                    </span>
                    <select
                      name="studioProgramme"
                      required
                      value={studioProgramme}
                      onChange={(e) => setStudioProgramme(e.target.value)}
                      className={control}
                    >
                      {STUDIO_PROGRAMMES.map((prog) => (
                        <option key={prog} value={prog}>
                          {prog}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-ink-soft">
                      Target Cohort <span className="text-gold-text">*</span>
                    </span>
                    <select
                      name="studioCohort"
                      required
                      value={studioCohort}
                      onChange={(e) => setStudioCohort(e.target.value)}
                      className={control}
                    >
                      {STUDIO_COHORTS.map((coh) => (
                        <option key={coh} value={coh}>
                          {coh}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-ink-soft">
                      Preferred Batch <span className="text-gold-text">*</span>
                    </span>
                    <select
                      name="studioBatch"
                      required
                      value={studioBatch}
                      onChange={(e) => setStudioBatch(e.target.value)}
                      className={control}
                    >
                      {STUDIO_BATCH_OPTIONS.map((bat) => (
                        <option key={bat} value={bat}>
                          {bat}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              {/* Special Requests or Notes */}
              <label className="block sm:col-span-2">
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-ink-soft">
                  Special Requests or Skill Level (Optional)
                </span>
                <textarea
                  name="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Approximate level, preferred days, questions."
                  className={cx(control, 'resize-y')}
                />
              </label>

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-3 text-[0.88rem] leading-relaxed text-ink-soft sm:col-span-2">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#0f1e2e]"
                />
                <span>
                  I agree to The Pavilion Club contacting me and understand that shared-play weekday (6:00 AM – 3:00 PM, 12h quota) / studio terms apply.
                </span>
              </label>

              {formError && (
                <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2.5 sm:col-span-2 text-center">
                  {formError}
                </p>
              )}

              {/* Submit Row matching Franchise */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2 sm:col-span-2">
                <GoldButton type="submit" disabled={isSubmitting || !agreedTerms}>
                  {isSubmitting ? 'Submitting...' : 'Submit →'}
                </GoldButton>
              </div>

              <p className="text-[0.78rem] leading-relaxed text-ink-faint sm:col-span-2">
                No payment is collected online. Your details are transmitted to our front desk for verification and onboarding. Pay or verify at the club desk upon arrival. See our{' '}
                <Link href="/privacy/" className="underline">
                  privacy notice
                </Link>.
              </p>
            </form>
          ) : (
            /* Application Received Screen (Pending Front Desk Approval) */
            <div className="text-center py-6 animate-step-in space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 shadow-sm">
                ⏳ Application Submitted · Pending Desk Approval
              </span>

              <h3 className="font-serif text-2xl sm:text-3xl font-medium text-navy">
                Thank You, {submittedLead.name}
              </h3>

              <p className="text-xs sm:text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
                Your application has been received and dispatched to our Front Desk team. Our desk staff will review your details and contact you to confirm onboarding.
              </p>

              {/* Status Note Box */}
              <div className="max-w-md mx-auto rounded-xl border border-[rgba(15,30,46,0.15)] bg-white/80 p-5 text-left space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-[rgba(15,30,46,0.1)] pb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                    Application Reference
                  </span>
                  <span className="font-mono text-xs font-bold text-navy bg-gold/15 px-2 py-0.5 rounded border border-gold/30">
                    {submittedLead.reference}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-soft">Selected Programme:</span>
                  <span className="font-semibold text-navy text-right">{submittedLead.planTitle}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-soft">Digital Card Status:</span>
                  <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Unlocks upon Front Desk Approval
                  </span>
                </div>

                <div className="border-t border-[rgba(15,30,46,0.1)] pt-2.5 text-[11px] text-ink-soft leading-relaxed">
                  💡 <strong>What happens next?</strong> Our Front Desk team will call you at <strong>+91 {submittedLead.phone}</strong>. Once verified and accepted at the desk, your Official Digital Member Card with 12-Hour Quota will be activated!
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
                <Link
                  href={`/pass?phone=${submittedLead.phone}`}
                  className="px-4 py-2.5 rounded border border-navy/30 bg-white hover:bg-slate-50 text-navy text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>🪪 Check Pass Status Online</span>
                </Link>

                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="px-4 py-2.5 rounded border border-emerald-600/40 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <span>💬 WhatsApp Front Desk</span>
                </button>

                <a
                  href={CLUB.phoneHref}
                  className="px-4 py-2.5 rounded border border-navy/20 bg-white/80 hover:bg-white text-navy text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <span>📞 Call Desk</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedLead(null);
                    setAgreedTerms(false);
                    setName('');
                    setPhone('');
                    setEmail('');
                    setNotes('');
                  }}
                  className="px-4 py-2.5 text-xs text-ink-soft hover:text-navy underline transition-colors"
                >
                  Submit Another Application
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Sheet Modal for Physical Signature */}
      <PrintRegistrationSheet
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
        data={printableData}
      />
    </section>
  );
}
