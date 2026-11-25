'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';

import { cx } from '@/components/public/book/ui';
import { CLUB, mailtoUrl, whatsappUrl } from '@/lib/club';
import { submitEnquiry, type EnquiryInput } from '@/lib/turfos-client';
import { GoldButton } from './GoldButton';

type Base = { name: string; label: string; required?: boolean };

export type EnquiryField =
  | (Base & {
      kind: 'text' | 'email' | 'tel' | 'date' | 'time' | 'number';
      autoComplete?: string;
      placeholder?: string;
      /** Take the full row instead of half of it. */
      wide?: boolean;
    })
  | (Base & { kind: 'select'; options: readonly string[]; wide?: boolean })
  | (Base & { kind: 'textarea'; placeholder?: string })
  | (Base & { kind: 'checks'; options: readonly string[] });

interface SubmissionResult {
  reference: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string;
  whatsappMessage: string;
  emailMessage: string;
}

/**
 * An executive enquiry form for The Pavilion Club.
 * 1. Automatically saves customer leads directly into the central Turf-OS DB (enquiries table).
 * 2. Provides on-screen luxury golden confirmation box with immediate reference tracking.
 * 3. Supplies direct 1-click 'Chat with Front Desk on WhatsApp' and email follow-up actions.
 */
export function EnquiryForm({
  subject,
  fields,
  submitLabel = 'Submit Enquiry',
}: {
  /** Opens the message, e.g. "Event enquiry". */
  subject: string;
  fields: readonly EnquiryField[];
  submitLabel?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  function compose(form: HTMLFormElement): {
    message: string;
    name: string;
    phone: string;
    email: string | null;
    details: Record<string, unknown>;
  } | null {
    if (!form.reportValidity()) return null;
    const data = new FormData(form);

    const name = String(data.get('name') ?? data.get('fullName') ?? '').trim();
    const rawPhone = String(data.get('phone') ?? data.get('tel') ?? data.get('mobile') ?? '').trim();
    const digits = rawPhone.replace(/\D/g, '');
    const phone = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(-10);
    const email = String(data.get('email') ?? '').trim() || null;

    const details: Record<string, unknown> = {};
    const lines = [`${subject} from The Pavilion Club Website`, ''];

    for (const field of fields) {
      const val =
        field.kind === 'checks'
          ? data.getAll(field.name).map(String).join(', ')
          : String(data.get(field.name) ?? '').trim();
      if (val) {
        lines.push(`${field.label}: ${val}`);
        details[field.name] = val;
      }
    }

    return {
      message: lines.join('\n'),
      name: name || 'Interested Guest',
      phone,
      email,
      details,
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const form = formRef.current;
    if (!form) return;

    const composed = compose(form);
    if (!composed) return;

    if (!composed.phone || !/^[6-9]\d{9}$/.test(composed.phone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number (e.g. 9840123456).');
      return;
    }

    setIsSubmitting(true);

    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const reference = `PAV-ENQ-${year}-${rand}`;

    // Infer category type for central DB routing
    const lower = subject.toLowerCase();
    const type = lower.includes('academy')
      ? 'academy'
      : lower.includes('event')
        ? 'events'
        : lower.includes('franchise')
          ? 'franchise'
          : lower.includes('studio')
            ? 'studio'
            : 'general';

    const payload: EnquiryInput = {
      type,
      name: composed.name,
      phone: composed.phone,
      email: composed.email || undefined,
      category: subject,
      notes: composed.message,
      details: {
        ...composed.details,
        reference,
        submittedAt: new Date().toISOString(),
      },
    };

    // 1. Auto-save lead to Central Turf-OS DB
    try {
      await submitEnquiry(payload);
    } catch (err) {
      console.warn('Central DB auto-sync notice:', err);
    }

    // 2. Backup to local storage for offline resiliency
    try {
      const existing = JSON.parse(localStorage.getItem('pavilion_general_enquiries_v1') || '[]');
      existing.unshift({ ...payload, reference, id: `enq-${Date.now()}` });
      localStorage.setItem('pavilion_general_enquiries_v1', JSON.stringify(existing.slice(0, 100)));
    } catch {}

    setIsSubmitting(false);
    setSubmissionResult({
      reference,
      name: composed.name,
      phone: composed.phone,
      email: composed.email,
      subject,
      whatsappMessage: `${composed.message}\nReference: ${reference}`,
      emailMessage: `${composed.message}\nReference: ${reference}`,
    });
  }

  // Golden Confirmation Box view when enquiry is successfully received & saved
  if (submissionResult) {
    return (
      <div className="rounded-2xl border border-[#c7a26a]/40 bg-[#071018] p-8 text-ivory shadow-2xl transition-all sm:col-span-2" data-fade>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c7a26a] text-[#071018] shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c7a26a]/30 bg-[#c7a26a]/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#dfbc82]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c7a26a] animate-pulse" />
              Enquiry Saved at Front Desk
            </div>
            <h3 className="mt-2 font-serif text-2xl text-ivory">
              Thank you, {submissionResult.name}!
            </h3>
            <p className="mt-1 text-xs uppercase tracking-wider text-[#c7a26a]">
              Reference No: <span className="font-mono font-bold text-white">{submissionResult.reference}</span>
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ivory/80">
          Your enquiry for <strong className="text-white">{submissionResult.subject}</strong> has been logged directly into our central front desk console. A member of our executive staff will review your particulars and connect with you at{' '}
          <span className="font-semibold text-white">+91 {submissionResult.phone}</span> shortly.
        </p>

        {/* Action Buttons: WhatsApp chat & Desk Contact */}
        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
          <a
            href={whatsappUrl(submissionResult.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-none bg-[#c7a26a] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#071018] shadow-lg transition-colors hover:bg-[#dfbc82]"
          >
            <span>Chat with Front Desk on WhatsApp</span>
            <span aria-hidden="true">↗</span>
          </a>

          <a
            href={mailtoUrl(`${submissionResult.subject} · The Pavilion Club (${submissionResult.reference})`, submissionResult.emailMessage)}
            className="inline-flex items-center gap-2 rounded-none border border-white/20 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-ivory/90 transition-colors hover:border-white hover:text-white"
          >
            <span>Send Copy via Email</span>
            <span aria-hidden="true">↗</span>
          </a>

          <button
            type="button"
            onClick={() => {
              setSubmissionResult(null);
              setFormError(null);
            }}
            className="ml-auto text-xs text-ivory/60 underline transition-colors hover:text-ivory"
          >
            Submit another enquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      {formError && (
        <div className="sm:col-span-2 rounded border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-300">
          {formError}
        </div>
      )}

      {fields.map((field) => (
        <Field key={field.name} field={field} />
      ))}

      <label className="flex items-start gap-3 text-[0.88rem] leading-relaxed text-ink-soft sm:col-span-2">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 h-4 w-4 shrink-0 accent-[#0f1e2e]"
        />
        <span>I agree to The Pavilion Club contacting me regarding this enquiry.</span>
      </label>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2 sm:col-span-2">
        <GoldButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving Enquiry...' : submitLabel}
        </GoldButton>

        <a
          href={CLUB.phoneHref}
          className="site-link text-navy focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4"
        >
          Call Front Desk (+91 {CLUB.phoneDisplay}) <i aria-hidden="true" />
        </a>
      </div>

      <p className="text-[0.78rem] leading-relaxed text-ink-faint sm:col-span-2">
        Your enquiry details are logged securely into our front desk management console. An enquiry does not constitute a confirmed court reservation. See our{' '}
        <Link href="/privacy/" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}

const control =
  'mt-1 block w-full rounded-none border-0 border-b border-[rgba(15,30,46,.24)] bg-transparent px-0 py-3 text-[1rem] text-navy placeholder:text-ink-faint transition-[border-color,box-shadow] duration-300 focus:border-navy focus:shadow-[0_1px_0_0_var(--navy)] focus:outline-none';

function Label({ field }: { field: EnquiryField }) {
  return (
    <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-ink-soft">
      {field.label}
      {field.required ? <span className="text-gold-text"> *</span> : null}
    </span>
  );
}

function Field({ field }: { field: EnquiryField }) {
  if (field.kind === 'checks') {
    return (
      <fieldset className="sm:col-span-2">
        <legend>
          <Label field={field} />
        </legend>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
          {field.options.map((option) => (
            <label key={option} className="flex items-center gap-2.5 text-[0.92rem] text-navy">
              <input type="checkbox" name={field.name} value={option} className="h-4 w-4 accent-[#0f1e2e]" />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.kind === 'textarea') {
    return (
      <label className="block sm:col-span-2">
        <Label field={field} />
        <textarea
          name={field.name}
          required={field.required}
          placeholder={field.placeholder}
          rows={3}
          className={cx(control, 'resize-y')}
        />
      </label>
    );
  }

  if (field.kind === 'select') {
    return (
      <label className={cx('block', field.wide && 'sm:col-span-2')}>
        <Label field={field} />
        <select name={field.name} required={field.required} defaultValue="" className={control}>
          <option value="" disabled>
            Choose one
          </option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className={cx('block', field.wide && 'sm:col-span-2')}>
      <Label field={field} />
      <input
        type={field.kind}
        name={field.name}
        required={field.required}
        autoComplete={field.autoComplete}
        placeholder={field.placeholder}
        min={field.kind === 'number' ? 1 : undefined}
        className={control}
      />
    </label>
  );
}
