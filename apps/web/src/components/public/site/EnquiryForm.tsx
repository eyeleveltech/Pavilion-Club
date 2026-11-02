'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';

import { cx } from '@/components/public/book/ui';
import { CLUB, mailtoUrl, whatsappUrl } from '@/lib/club';

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

/**
 * An enquiry form for a static site. Nothing is posted or stored here: the
 * answers are written into a message and handed to WhatsApp or the visitor's
 * email app, addressed to the front desk, and the visitor presses send.
 */
export function EnquiryForm({
  subject,
  fields,
  submitLabel,
}: {
  /** Opens the message, e.g. "Event enquiry". */
  subject: string;
  fields: readonly EnquiryField[];
  submitLabel: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [sentVia, setSentVia] = useState<'whatsapp' | 'email' | null>(null);

  function compose(form: HTMLFormElement): string | null {
    if (!form.reportValidity()) return null;
    const data = new FormData(form);
    const lines = [`${subject} from the website`, ''];
    for (const field of fields) {
      const value =
        field.kind === 'checks'
          ? data.getAll(field.name).map(String).join(', ')
          : String(data.get(field.name) ?? '').trim();
      if (value) lines.push(`${field.label}: ${value}`);
    }
    return lines.join('\n');
  }

  function send(via: 'whatsapp' | 'email') {
    const form = formRef.current;
    if (!form) return;
    const message = compose(form);
    if (!message) return;
    if (via === 'whatsapp') {
      const url = whatsappUrl(message);
      // A new tab on desktop; on phones the app opens in place (popup blockers).
      if (window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches) window.location.href = url;
      else window.open(url, '_blank', 'noopener');
    } else {
      window.location.href = mailtoUrl(`${subject} · The Pavilion Club`, message);
    }
    setSentVia(via);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    send('whatsapp');
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
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
        <span>I agree to The Pavilion Club contacting me about this enquiry.</span>
      </label>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2 sm:col-span-2">
        <button type="submit" className="editorial-btn focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={() => send('email')}
          className="site-link text-navy focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4"
        >
          Send by email instead <i aria-hidden="true" />
        </button>
      </div>

      <p role="status" className="text-[0.88rem] leading-relaxed text-navy sm:col-span-2">
        {sentVia === 'whatsapp'
          ? 'WhatsApp is opening with your enquiry filled in. Press send there to reach the front desk.'
          : sentVia === 'email'
            ? 'Your email app is opening with your enquiry filled in. Press send there to reach the front desk.'
            : null}
        {sentVia ? (
          <>
            {' '}
            Nothing opened? Call <a className="underline" href={CLUB.phoneHref}>{CLUB.phoneDisplay}</a> or write to{' '}
            <a className="underline" href={`mailto:${CLUB.email}`}>{CLUB.email}</a>.
          </>
        ) : null}
      </p>

      <p className="text-[0.78rem] leading-relaxed text-ink-faint sm:col-span-2">
        Your details go straight to our front desk by WhatsApp or email; this website does not store them. Sending
        an enquiry does not reserve a date or a place. See our{' '}
        <Link href="/privacy/" className="underline">
          privacy notice
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
