'use client';

import React, { useState } from 'react';
import { ArrowLink } from '@/components/public/site/SitePage';
import { StudioEnquiryModal, type StudioEnquiryData } from './StudioEnquiryModal';

interface RateCardItem {
  id: string;
  category: string;
  badge?: string;
  title: string;
  description: string;
  features: string[];
  pricing: {
    label: string;
    regularPrice?: number;
    specialPrice: number;
    note?: string;
    days?: string;
  }[];
  accent?: boolean;
}

const STUDIO_PROGRAMMES: RateCardItem[] = [
  {
    id: 'dance',
    category: '01 · Dance Programmes',
    badge: 'Weekday & Weekend Batches',
    title: 'Dance Classes',
    description: 'Applicable to all dance styles: Hip Hop, Commercial, Bollywood, Contemporary & Kids Dance (excluding Salsa).',
    features: [
      'Comprehensive choreography & musicality',
      'Beginner to intermediate progressive coaching',
      'Kids & adult batches available',
    ],
    pricing: [
      {
        label: 'Weekday Batch',
        regularPrice: 2700,
        specialPrice: 2200,
        days: 'Mon · Wed · Fri (12 classes / month)',
        note: '+ GST at applicable rate',
      },
      {
        label: 'Weekend Batch',
        specialPrice: 2000,
        days: 'Saturday & Sunday (8 classes / month)',
        note: '+ GST at applicable rate',
      },
    ],
    accent: true,
  },
  {
    id: 'salsa',
    category: '02 · Latin Social',
    badge: '8 Classes / Package',
    title: 'Salsa & Partnerwork',
    description: 'Master authentic Latin rhythms, partnerwork, footwork, frame connection and musicality.',
    features: [
      'Individual & couple registrations',
      'Progressive level-by-level syllabus',
      'Social dance nights & practice labs',
    ],
    pricing: [
      {
        label: 'Individual Learner',
        specialPrice: 3000,
        days: '8 classes per package',
        note: '+ GST at applicable rate',
      },
      {
        label: 'Couple Package',
        specialPrice: 5000,
        days: '8 classes per package (for 2)',
        note: '+ GST at applicable rate',
      },
    ],
  },
  {
    id: 'gymnastics',
    category: '03 · Movement & Acrobatics',
    badge: '8 Classes / Month',
    title: 'Gymnastics',
    description: 'Build exceptional flexibility, bodyweight strength, core conditioning and aerial spatial awareness.',
    features: [
      'Floor work, flexibility & handstands',
      'Strength conditioning & tumbling safety',
      'Coached by national-level gymnasts',
    ],
    pricing: [
      {
        label: 'Monthly Package',
        regularPrice: 5000,
        specialPrice: 4000,
        days: '8 classes per month',
        note: '+ GST at applicable rate',
      },
    ],
  },
  {
    id: 'boxing',
    category: '04 · Combat & Conditioning',
    badge: '8 Classes / Month',
    title: 'Boxing & Heavy Bag',
    description: 'High-intensity athletic training: authentic punch mechanics, footwork drills, heavy bags and conditioning.',
    features: [
      'Heavy bag rounds & hand-eye reflex drills',
      'Athletic agility & stamina enhancement',
      'Full body combat conditioning',
    ],
    pricing: [
      {
        label: 'Monthly Package',
        regularPrice: 3500,
        specialPrice: 2750,
        days: '8 classes per month',
        note: '+ GST at applicable rate',
      },
    ],
  },
  {
    id: 'yoga',
    category: '05 · Mindful Wellness',
    badge: '12 Classes / Month',
    title: 'Yoga & Mobility',
    description: 'Morning movement reset: Hatha and Vinyasa alignment, breathwork, joint mobility and deep decompression.',
    features: [
      'Morning 6:00 AM – 7:00 AM weekday flow',
      'Breathwork (Pranayama) & somatic release',
      'Ideal active recovery for court athletes',
    ],
    pricing: [
      {
        label: 'Monthly Package',
        regularPrice: 3200,
        specialPrice: 2500,
        days: '12 classes per month (Mon · Wed · Fri)',
        note: '+ GST at applicable rate',
      },
    ],
  },
];

const STUDIO_PHONE = '+91 9884373336';
const STUDIO_PHONE_CLEAN = '919884373336';
const STUDIO_WHATSAPP_URL = `https://wa.me/${STUDIO_PHONE_CLEAN}?text=${encodeURIComponent(
  "Hi Pavilion Studio! I'd like to enquire about the Official Programme Rate Card."
)}`;

export function StudioRateCard() {
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<StudioEnquiryData | null>(null);

  const handleOpenEnquiry = (prog?: RateCardItem) => {
    if (typeof window !== 'undefined') {
      const formEl = document.getElementById('enquire');
      if (formEl) {
        window.dispatchEvent(
          new CustomEvent('pavilion-select-category', {
            detail: {
              category: 'studio',
              programme: prog ? prog.title : undefined,
            },
          })
        );
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.location.hash !== '#enquire') {
          window.history.pushState(null, '', '#enquire');
        }
        setTimeout(() => {
          const nameInput = document.querySelector<HTMLInputElement>('#enquire input[name="name"]');
          nameInput?.focus();
        }, 400);
        return;
      }
    }

    if (prog) {
      const topTier = prog.pricing[0];
      setModalInitialData({
        activity: prog.title,
        programmeTitle: prog.title,
        pricingLabel: topTier ? `${topTier.label} (${topTier.days || ''})` : undefined,
        amountDisplay: topTier ? `₹${topTier.specialPrice.toLocaleString('en-IN')}` : undefined,
      });
    } else {
      setModalInitialData(null);
    }
    setEnquiryModalOpen(true);
  };

  return (
    <div className="mt-16 pt-16 border-t border-[var(--gold-line)]">
      {/* Rate Card Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-[#C9A96E]" />
            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#C9A96E]">
              MOVE · PERFORM · TRANSFORM
            </p>
          </div>
          <h3 className="font-serif text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold text-[var(--ivory)] leading-tight">
            Official Programme Rate Card
          </h3>
          <p className="text-[0.95rem] text-[var(--ivory-70)] mt-2 max-w-xl">
            Premium classes. Exceptional training. One destination at The Pavilion Club, Mogappair.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleOpenEnquiry()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#C9A96E] text-[#0B192C] font-semibold text-[0.82rem] tracking-wider uppercase transition-all hover:bg-[#E5C378] hover:shadow-[0_4px_16px_rgba(201,169,110,0.3)] active:scale-95"
          >
            <span>Enquire &amp; Apply Online</span>
            <span>⟶</span>
          </button>
          <a
            href={STUDIO_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-md border border-[var(--gold-line)] text-[#C9A96E] font-semibold text-[0.82rem] tracking-wider uppercase transition-all hover:border-[#C9A96E] hover:text-[#E5C378]"
          >
            <span>WhatsApp</span>
          </a>
          <a
            href={`tel:${STUDIO_PHONE}`}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-md border border-[var(--gold-line)] text-[var(--ivory)] font-semibold text-[0.82rem] tracking-wider uppercase transition-all hover:border-[#C9A96E] hover:text-[#C9A96E]"
          >
            <span>Call</span>
          </a>
        </div>
      </div>

      {/* Grid of 5 Programmes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {STUDIO_PROGRAMMES.map((prog) => (
          <div
            key={prog.id}
            className={`rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
              prog.accent
                ? 'bg-[rgba(15,30,46,0.92)] border-2 border-[#C9A96E] shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_24px_rgba(201,169,110,0.14)]'
                : 'bg-[rgba(15,30,46,0.7)] border border-[var(--gold-line)] hover:border-[#C9A96E]/70 hover:bg-[rgba(15,30,46,0.85)]'
            }`}
          >
            {prog.accent && (
              <div className="absolute top-0 right-0 bg-[#C9A96E] text-[#0B192C] text-[9px] font-bold tracking-[2px] uppercase py-1 px-4 rounded-bl-lg">
                Most Popular
              </div>
            )}

            <div>
              {/* Category & Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] uppercase tracking-[2px] font-semibold text-[#C9A96E]">
                  {prog.category}
                </span>
                {prog.badge && !prog.accent && (
                  <span className="text-[9px] uppercase tracking-[1px] px-2.5 py-0.5 rounded-full bg-[rgba(201,169,110,0.12)] text-[#E5C378] border border-[rgba(201,169,110,0.25)]">
                    {prog.badge}
                  </span>
                )}
              </div>

              {/* Title & Desc */}
              <h4 className="font-serif text-[1.45rem] font-bold text-[var(--ivory)] mb-2">
                {prog.title}
              </h4>
              <p className="text-[0.84rem] text-[var(--ivory-70)] leading-relaxed mb-6">
                {prog.description}
              </p>

              {/* Features list */}
              <ul className="space-y-2 mb-7 text-[0.8rem] text-[var(--ivory-70)]">
                {prog.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#C9A96E] text-[0.9rem] leading-none mt-0.5">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing Tiers */}
            <div className="pt-5 border-t border-[rgba(201,169,110,0.2)]">
              <div className="space-y-4">
                {prog.pricing.map((tier, pIdx) => (
                  <div key={pIdx} className="bg-[rgba(6,13,23,0.6)] rounded-xl p-3.5 border border-[rgba(201,169,110,0.18)]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[0.78rem] font-semibold text-[var(--ivory)] uppercase tracking-wider">
                        {tier.label}
                      </span>
                      <div className="flex items-baseline gap-2">
                        {tier.regularPrice && (
                          <span className="text-[0.82rem] line-through text-[var(--ivory-45)] decoration-red-400">
                            ₹{tier.regularPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="font-mono text-[1.2rem] font-extrabold text-[#E5C378]">
                          ₹{tier.specialPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    {tier.days && (
                      <p className="text-[0.72rem] text-[#C9A96E] mt-1 font-medium">
                        {tier.days}
                      </p>
                    )}
                    {tier.note && (
                      <p className="text-[0.68rem] text-[var(--ivory-45)] mt-0.5">
                        {tier.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA link per card */}
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() => handleOpenEnquiry(prog)}
                  className="w-full py-2.5 px-4 rounded-lg bg-[rgba(201,169,110,0.18)] hover:bg-[#C9A96E] text-[#C9A96E] hover:text-[#0B192C] font-semibold text-[0.78rem] tracking-wider uppercase text-center block transition-all border border-[rgba(201,169,110,0.35)] hover:border-[#C9A96E] shadow-sm active:scale-95"
                >
                  Apply &amp; Enquire Online ⟶
                </button>
                <div className="text-center">
                  <a
                    href={`https://wa.me/${STUDIO_PHONE_CLEAN}?text=${encodeURIComponent(
                      `Hi Pavilion Studio! I want to enquire about ${prog.title}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.72rem] text-[var(--ivory-45)] hover:text-[#C9A96E] transition-colors inline-block"
                  >
                    or chat on WhatsApp ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Banner Bar */}
      <div className="mt-12 p-6 rounded-2xl bg-[rgba(15,30,46,0.85)] border border-[var(--gold-line)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 rounded-full bg-[rgba(201,169,110,0.15)] border border-[#C9A96E] flex items-center justify-center text-[#C9A96E] text-xl shrink-0">
            📞
          </div>
          <div>
            <p className="font-semibold text-[0.95rem] text-[var(--ivory)]">
              Enquiries &amp; Registrations Desk
            </p>
            <p className="text-[0.8rem] text-[var(--ivory-70)]">
              Official Studio Helpdesk: <strong className="text-[#E5C378]">{STUDIO_PHONE}</strong> · The Pavilion Club, Mogappair East
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleOpenEnquiry()}
            className="px-5 py-2.5 rounded-lg bg-[#C9A96E] text-[#0B192C] font-semibold text-[0.8rem] tracking-wider uppercase hover:bg-[#E5C378] transition-all shadow-sm active:scale-95"
          >
            Enquire Online
          </button>
          <a
            href={`tel:${STUDIO_PHONE}`}
            className="px-4 py-2.5 rounded-lg border border-[var(--gold-line)] text-[var(--ivory)] font-semibold text-[0.8rem] tracking-wider uppercase hover:border-[#C9A96E] transition-all"
          >
            Call Desk
          </a>
          <a
            href={STUDIO_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-lg border border-[var(--gold-line)] text-[#C9A96E] font-semibold text-[0.8rem] tracking-wider uppercase hover:border-[#C9A96E] transition-all"
          >
            WhatsApp
          </a>
        </div>
      </div>

      {/* Dynamic Enquiry Modal */}
      <StudioEnquiryModal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        initialData={modalInitialData}
      />
    </div>
  );
}
