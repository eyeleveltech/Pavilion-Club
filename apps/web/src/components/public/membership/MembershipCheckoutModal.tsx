'use client';

import { useState, useEffect, useRef, type CSSProperties, type PointerEvent, type MouseEvent } from 'react';
import {
  submitEnquiry,
} from '@/lib/turfos-client';
import { addPickleballEnquiry, addStudioEnquiry } from '@/lib/enquiry-store';
import { CLUB, whatsappUrl } from '@/lib/club';
import { GoldButton } from '@/components/public/site/GoldButton';
import {
  PrintRegistrationSheet,
  type PrintableRegistrationData,
} from '@/components/public/studio/PrintRegistrationSheet';

export interface MembershipCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'details' | 'rules' | 'success';

export interface MemberPass {
  reference: string;
  name: string;
  phone: string;
  email: string;
  category: 'pickleball' | 'studio' | 'academy' | string;
  planTitle: string;
  validFrom: string;
  validUntil: string;
  totalSessions: number;
  amountPaise: number;
  paymentId?: string | undefined;
  studioProgramme?: string | undefined;
  studioCohort?: string | undefined;
}

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

export interface LuxuryMetalPassCardProps {
  memberPass: MemberPass;
  surface?: 'ivory' | 'dark' | undefined;
}

const CARD_FACE_STYLE: CSSProperties = {
  background: 'linear-gradient(145deg, #142233 0%, #0d1825 48%, #071019 100%)',
  boxShadow:
    'inset 0 1px 1.2px rgba(255,255,255,0.24), inset 0 -1.5px 2px rgba(0,0,0,0.9), inset 1px 0 1px rgba(255,255,255,0.08)',
};

/**
 * Shared brushed-metal grain, dynamic glare, and CNC-debossed Pavilion arch PC monogram
 * rendered across both front and back faces of the physical-grade metal card.
 */
function CardSurfaceLayers({ glareX, glareY, isActive }: { glareX: number; glareY: number; isActive: boolean }) {
  return (
    <>
      {/* Fine brushed anodized metal micro-grain */}
      <div
        className="absolute inset-0 pointer-events-none z-[1] opacity-70"
        style={{
          backgroundImage:
            'repeating-linear-gradient(118deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Dynamic light-catching metallic glare */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-[3]"
        style={{
          opacity: isActive ? 1 : 0.45,
          background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.16) 0%, rgba(199, 162, 106, 0.06) 28%, transparent 62%)`,
        }}
      />

      {/* Embossed Pavilion Arch + PC Monogram watermark on the right half */}
      <svg
        className="absolute -right-[4%] -top-[10%] h-[120%] w-auto pointer-events-none z-[2] opacity-90"
        viewBox="0 0 64 104"
        fill="none"
        aria-hidden="true"
      >
        {/* Subtle bottom-right specular rim highlight */}
        <g transform="translate(0.55, 0.55)" stroke="rgba(255,255,255,0.14)" strokeWidth="0.95" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="60" height="100" rx="30" />
          <path d="M30 26 L30 78" />
          <path d="M30 26 H37 C43 26 48 30 48 37 C48 42 45 45 42 46" />
          <path d="M42 46 C36 44 32 44.5 30 46 C23 48 18 53 18 61 C18 69 23 75 30 77 C37 79 43 77 47 73" />
        </g>
        {/* Deep milled groove shadow */}
        <g transform="translate(-0.45, -0.45)" stroke="rgba(0,0,0,0.88)" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="60" height="100" rx="30" />
          <path d="M30 26 L30 78" />
          <path d="M30 26 H37 C43 26 48 30 48 37 C48 42 45 45 42 46" />
          <path d="M42 46 C36 44 32 44.5 30 46 C23 48 18 53 18 61 C18 69 23 75 30 77 C37 79 43 77 47 73" />
        </g>
        {/* Crisp matte navy base bevel */}
        <g stroke="#08121d" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="60" height="100" rx="30" />
          <path d="M30 26 L30 78" />
          <path d="M30 26 H37 C43 26 48 30 48 37 C48 42 45 45 42 46" />
          <path d="M42 46 C36 44 32 44.5 30 46 C23 48 18 53 18 61 C18 69 23 75 30 77 C37 79 43 77 47 73" />
        </g>
      </svg>
    </>
  );
}

/** Realistic brushed gold EMV smart chip SVG. */
function GoldEmvChip() {
  return (
    <div
      className="w-10 h-7 sm:w-11 sm:h-[31px] rounded-[5px] p-[1px] shadow-[0_2px_6px_rgba(0,0,0,0.65)] shrink-0"
      style={{
        background: 'linear-gradient(135deg, #f3df9e 0%, #c99e4b 45%, #8b631f 100%)',
      }}
    >
      <svg viewBox="0 0 44 30" className="w-full h-full rounded-[4px]" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="chip-gold" x1="0" y1="0" x2="44" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ecd595" />
            <stop offset="50%" stopColor="#cfa451" />
            <stop offset="100%" stopColor="#a77d32" />
          </linearGradient>
        </defs>
        <rect width="44" height="30" rx="3" fill="url(#chip-gold)" />
        <path
          d="M15 0 V30 M29 0 V30 M0 10 H15 M29 10 H44 M0 20 H15 M29 20 H44 M15 15 H29"
          stroke="rgba(35, 22, 6, 0.55)"
          strokeWidth="1.15"
        />
        <rect x="15" y="7" width="14" height="16" rx="2" stroke="rgba(35, 22, 6, 0.55)" strokeWidth="1.1" fill="none" />
      </svg>
    </div>
  );
}

export function LuxuryMetalPassCard({ memberPass, surface = 'ivory' }: LuxuryMetalPassCardProps) {
  const isDarkSurface = surface === 'dark';
  const cardRef = useRef<HTMLDivElement>(null);
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, []);

  const triggerFlip = () => {
    setIsFlipping(true);
    setIsFlipped((prev) => !prev);
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    flipTimerRef.current = setTimeout(() => setIsFlipping(false), 720);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current || e.pointerType === 'touch') return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setTilt({ x: rotateX, y: rotateY, glareX, glareY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  const copyNumber = (e: MouseEvent) => {
    e.stopPropagation();
    const markCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(memberPass.reference).then(markCopied).catch(() => {});
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = memberPass.reference;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      markCopied();
    } finally {
      document.body.removeChild(ta);
    }
  };

  const formattedNumber = memberPass.reference.replace(/-/g, ' ');

  const untilDate = new Date(memberPass.validUntil);
  const validThru = isNaN(untilDate.getTime())
    ? '12/26'
    : `${String(untilDate.getMonth() + 1).padStart(2, '0')}/${String(untilDate.getFullYear()).slice(-2)}`;

  const isVerified = memberPass.paymentId !== 'PENDING_DESK';
  const catLower = (memberPass.category || '').toLowerCase();
  const isStudio = catLower === 'studio';
  const isAcademy = catLower === 'academy';

  const passSubtitle = isStudio
    ? `STUDIO PASS · ${memberPass.totalSessions || 12} CLASSES`
    : isAcademy
      ? `ACADEMY PASS · ${memberPass.totalSessions || 12} SESSIONS`
      : 'MEMBER PASS · 12H QUOTA';

  const allowanceLabel = isStudio
    ? `${memberPass.totalSessions || 12} Classes`
    : isAcademy
      ? `${memberPass.totalSessions || 12} Sessions`
      : '12 Hours Quota';

  const backTermsHeading = isStudio
    ? 'STUDIO PASS TERMS'
    : isAcademy
      ? 'ACADEMY COACHING TERMS'
      : 'MEMBERSHIP TERMS';

  const backTermsLines = isStudio
    ? [
        'Check in at the front desk before class.',
        'Attend scheduled Mon · Wed · Fri or weekend batches.',
        'Sessions remain valid for 30 days from activation.',
        'Classes are personal, non-transferable, and expire monthly.',
        'Clean non-marking footwear required on studio floor.',
      ]
    : isAcademy
      ? [
          'Check in at the front desk before clinic start.',
          'Attend assigned cohort batch (no beginner/inter mixing).',
          '12 coaching sessions per month (max 1 hr per session).',
          'Demo paddles and Franklin X-40 balls are provided.',
          'Schedule adjustments subject to coach availability.',
        ]
      : [
          'Check in at the front desk.',
          'Mon–Fri, 6 AM–3 PM, except holidays and tournaments.',
          'Up to 12 hrs/month, 1 session/day (max 60 min).',
          'Sessions are non-transferable and expire monthly.',
          'Shared play depends on court availability.',
        ];

  const baseRotateY = (isFlipped ? 180 : 0) + (isFlipped ? -tilt.y : tilt.y);
  const baseRotateX = isHovered && !isFlipping ? tilt.x : 0;
  const scaleFactor = isFlipping ? 1.035 : isHovered ? 1.018 : 1;

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? 'Flip card to view Member Pass front' : 'Flip card to view Membership Terms'}
        onClick={triggerFlip}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerFlip();
          }
        }}
        onPointerMove={handlePointerMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: '1400px',
          aspectRatio: '1.586',
        }}
        className="relative w-full select-none cursor-pointer touch-manipulation active:scale-[0.985] transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#c7a26a] rounded-[20px]"
      >
        {/* 3D Rotating Card Stage */}
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${baseRotateX}deg) rotateY(${baseRotateY}deg) scale3d(${scaleFactor}, ${scaleFactor}, ${scaleFactor})`,
            transition:
              isHovered && !isFlipping
                ? 'transform 0.1s ease-out'
                : 'transform 0.72s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="relative w-full h-full rounded-[20px] shadow-[0_28px_55px_-14px_rgba(4,9,16,0.82),0_10px_22px_-6px_rgba(4,9,16,0.5)]"
        >
          {/* ================= FRONT FACE ================= */}
          <div
            style={{
              ...CARD_FACE_STYLE,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg) translateZ(0.5px)',
              pointerEvents: isFlipped ? 'none' : 'auto',
            }}
            className="absolute inset-0 rounded-[20px] overflow-hidden p-4 sm:p-6 flex flex-col justify-between border border-white/15 text-left"
          >
            <CardSurfaceLayers glareX={tilt.glareX} glareY={tilt.glareY} isActive={isHovered || isFlipping} />

            {/* Top Row: Official White Logo + Verified Badge & Pass Quota Subtitle */}
            <div className="relative z-[4] flex items-start justify-between gap-2">
              <img
                src="/pavilion_logo_reversed.png"
                alt="The Pavilion Club"
                width={120}
                height={42}
                className="h-8 sm:h-10 w-auto object-contain select-none pointer-events-none"
              />

              <div className="flex flex-col items-end text-right">
                <div className="inline-flex items-center border border-[#c7a26a]/80 bg-[#071018]/65 px-2.5 py-0.5 rounded-[5px] text-[8.5px] sm:text-[9.5px] font-semibold tracking-[0.14em] uppercase text-[#e0ad5c] shadow-xs">
                  {isVerified ? 'VERIFIED AT DESK' : 'PENDING DESK'}
                </div>
                <span className="mt-1.5 text-[8.5px] sm:text-[9.5px] font-semibold tracking-[0.14em] uppercase text-white/95">
                  {passSubtitle}
                </span>
              </div>
            </div>

            {/* Middle Row: Gold EMV Chip & Clean Tracked Reference */}
            <div className="relative z-[4] flex items-center gap-3 sm:gap-5 my-auto pt-1">
              <GoldEmvChip />

              <button
                type="button"
                onClick={copyNumber}
                title="Tap to copy Member Reference"
                className="group/code inline-flex items-center gap-2 text-left rounded px-1.5 py-1 -ml-1 hover:bg-white/5 transition-colors cursor-copy min-w-0"
              >
                <span className="font-sans text-[12.5px] sm:text-[17px] tracking-[0.18em] sm:tracking-[0.22em] font-semibold text-[#f9f6ed] uppercase whitespace-nowrap">
                  {formattedNumber}
                </span>
                {copied && (
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#e0ad5c] bg-[#071018]/90 px-1.5 py-0.5 rounded border border-[#c7a26a]/40">
                    Copied
                  </span>
                )}
              </button>
            </div>

            {/* Bottom Row: Divider + Passholder & Monthly Allowance */}
            <div className="relative z-[4] border-t border-white/25 pt-2.5 sm:pt-3 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-[0.15em] text-white/45 block font-medium">
                  Passholder
                </span>
                <span className="text-[13px] sm:text-[15px] font-bold text-white tracking-[0.06em] uppercase block truncate max-w-[175px] mt-0.5">
                  {memberPass.name}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.06em] text-white/75 block">
                  {memberPass.phone}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-[0.15em] text-white/45 block font-medium">
                  Monthly Allowance
                </span>
                <span className="text-[12px] sm:text-[14px] font-bold text-[#e0ad5c] tracking-wide block mt-0.5">
                  {allowanceLabel}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-white/70 block">
                  Thru {validThru}
                </span>
              </div>
            </div>
          </div>

          {/* ================= BACK FACE ================= */}
          <div
            style={{
              ...CARD_FACE_STYLE,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg) translateZ(0.5px)',
              pointerEvents: isFlipped ? 'auto' : 'none',
            }}
            className="absolute inset-0 rounded-[20px] overflow-hidden p-3.5 sm:p-5 flex flex-col justify-between border border-white/15 text-left"
          >
            <CardSurfaceLayers
              glareX={100 - tilt.glareX}
              glareY={tilt.glareY}
              isActive={isHovered || isFlipping}
            />

            {/* Top Logo */}
            <div className="relative z-[4] flex items-center justify-between">
              <img
                src="/pavilion_logo_reversed.png"
                alt="The Pavilion Club"
                width={108}
                height={38}
                className="h-6 sm:h-8 w-auto object-contain select-none pointer-events-none"
              />
            </div>

            {/* Terms Block */}
            <div className="relative z-[4] my-auto pr-4 sm:pr-8">
              <h4 className="text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-[#e0ad5c]">
                {backTermsHeading}
              </h4>
              <ul className="mt-1 sm:mt-1.5 space-y-[1.5px] sm:space-y-[2.5px] text-[8px] sm:text-[10.5px] leading-[1.35] sm:leading-[1.45] text-[#f9f6ed]/90 font-normal">
                {backTermsLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>

            {/* Front Desk Phone, Gold Rule & Full Terms Link */}
            <div className="relative z-[4]">
              <p className="text-[9px] sm:text-[10.5px] font-bold uppercase tracking-[0.14em] text-white">
                FRONT DESK{' '}
                <a
                  href={CLUB.phoneHref}
                  onClick={(e) => e.stopPropagation()}
                  className="ml-1 font-mono font-semibold text-white/95 hover:text-[#e0ad5c] transition-colors"
                >
                  {CLUB.phoneDisplay}
                </a>
              </p>

              <div className="my-1.5 sm:my-2 h-[1.5px] w-[58%] bg-[#e0ad5c]/90" />

              <p className="text-[8.5px] sm:text-[10px] text-white/80">
                Full terms:{' '}
                <a
                  href="/membership/#terms"
                  onClick={(e) => e.stopPropagation()}
                  className="text-white/90 hover:text-[#e0ad5c] underline decoration-white/30 transition-colors"
                >
                  thepavilionclub.com/membership/
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Hairline Pure Controls (aligned to card width) */}
      <div
        className={`mt-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] pb-2.5 border-b ${
          isDarkSurface
            ? 'border-white/15 text-[#C7A26A]'
            : 'border-[#CFC7B2] text-[#8A6223]'
        }`}
      >
        <button
          type="button"
          onClick={triggerFlip}
          className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            isDarkSurface ? 'hover:text-white' : 'hover:text-[#0F1E2E]'
          }`}
        >
          <svg
            className="w-3.5 h-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          <span>{isFlipped ? 'Show Front' : 'Turn Over'}</span>
        </button>

        <button
          type="button"
          onClick={copyNumber}
          title="Tap to copy Member Reference"
          className={`inline-flex items-center gap-1.5 font-mono transition-colors cursor-pointer ${
            isDarkSurface ? 'hover:text-white' : 'hover:text-[#0F1E2E]'
          }`}
        >
          <svg
            className="w-3.5 h-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          <span>{copied ? 'Copied ID' : formattedNumber}</span>
        </button>
      </div>
    </div>
  );
}

export interface EditorialQuotaSectionProps {
  category?: string | undefined;
  sessionsRemaining: number;
  sessionsTotal: number;
  lastCheckIn?: string | null | undefined;
  onPrintDossier: () => void;
  whatsappHref: string;
  surface?: 'ivory' | 'dark' | undefined;
}

/**
 * Shared Sample #05 "Editorial Hairline Pure" quota readout and CTA strip,
 * aligned directly to the 420px card column across both ivory and dark modal grounds.
 */
export function EditorialQuotaSection({
  category,
  sessionsRemaining,
  sessionsTotal,
  lastCheckIn,
  onPrintDossier,
  whatsappHref,
  surface = 'ivory',
}: EditorialQuotaSectionProps) {
  const isDarkSurface = surface === 'dark';
  const catLower = (category || '').toLowerCase();
  const isStudio = catLower === 'studio';
  const isAcademy = catLower === 'academy';

  const unitLabel = isStudio ? 'Classes' : isAcademy ? 'Sessions' : 'Hours';
  const dailyCap = isStudio
    ? 'Scheduled batch'
    : isAcademy
      ? '1 hr / session'
      : '1 hr / weekday';

  const safeTotal = sessionsTotal > 0 ? sessionsTotal : 12;
  const safeRemaining = Math.max(0, Math.min(safeTotal, sessionsRemaining));
  const used = Math.max(0, safeTotal - safeRemaining);
  const pct = Math.min(100, Math.max(0, (safeRemaining / safeTotal) * 100));

  const deductionText = lastCheckIn
    ? `Last check-in: ${new Date(lastCheckIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
    : used > 0
      ? `${used} ${unitLabel.toLowerCase()} used this cycle`
      : isStudio || isAcademy
        ? 'No sessions deducted yet'
        : 'No hours deducted yet';

  return (
    <div className="w-full max-w-[420px] mx-auto text-left">
      <div className={`py-4 border-b space-y-3 ${isDarkSurface ? 'border-white/15' : 'border-[#CFC7B2]'}`}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <span
              className={`block text-[9.5px] font-semibold uppercase tracking-[0.2em] ${
                isDarkSurface ? 'text-white/55' : 'text-[#5E6A78]'
              }`}
            >
              Play Allowance
            </span>
            <div
              className={`font-serif text-3xl font-normal leading-none mt-1.5 tabular-nums ${
                isDarkSurface ? 'text-[#F9F6ED]' : 'text-[#0F1E2E]'
              }`}
            >
              {safeRemaining}{' '}
              <span className={`text-sm ${isDarkSurface ? 'text-white/60' : 'text-[#4A5765]'}`}>
                / {safeTotal} {unitLabel}
              </span>
            </div>
          </div>

          <div className={`text-right text-[11px] leading-snug ${isDarkSurface ? 'text-white/65' : 'text-[#4A5765]'}`}>
            <div>{dailyCap}</div>
            <div className={`font-medium mt-0.5 ${isDarkSurface ? 'text-[#C7A26A]' : 'text-[#8A6223]'}`}>
              {deductionText}
            </div>
          </div>
        </div>

        {/* Minimal 3px architectural quota rule */}
        <div className={`h-[3px] w-full overflow-hidden ${isDarkSurface ? 'bg-white/15' : 'bg-[#E4DFD0]'}`}>
          <div
            className={`h-full transition-all duration-500 ${isDarkSurface ? 'bg-[#C7A26A]' : 'bg-[#0F1E2E]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Sharp Rectangular Editorial Actions */}
      <div className="pt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onPrintDossier}
          className={`h-11 rounded-none text-[10px] font-semibold uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            isDarkSurface
              ? 'bg-[#C7A26A] hover:bg-[#D8B680] text-[#0F1E2E]'
              : 'bg-[#0F1E2E] hover:bg-[#182C42] text-[#F9F6ED]'
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 shrink-0 ${isDarkSurface ? 'text-[#0F1E2E]' : 'text-[#C7A26A]'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect width="12" height="8" x="6" y="14" />
          </svg>
          <span>Print Dossier</span>
        </button>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`h-11 rounded-none border text-[10px] font-semibold uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 transition-colors ${
            isDarkSurface
              ? 'border-[#C7A26A]/55 text-[#F9F6ED] hover:bg-[#C7A26A]/15'
              : 'border-[#0F1E2E] text-[#0F1E2E] hover:bg-[#0F1E2E] hover:text-[#F9F6ED]'
          }`}
        >
          <svg
            className="w-3.5 h-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
          <span>Front Desk</span>
        </a>
      </div>
    </div>
  );
}

export function MembershipCheckoutModal({ isOpen, onClose }: MembershipCheckoutModalProps) {
  const [step, setStep] = useState<Step>('details');

  // Category Toggle: 'pickleball' (12h Quota) vs 'studio' (Dance/Yoga/Boxing)
  const [category, setCategory] = useState<'pickleball' | 'studio'>('pickleball');

  // Shared Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Studio-Specific Form State
  const [studioProgramme, setStudioProgramme] = useState(STUDIO_PROGRAMMES[0] ?? 'Dance');
  const [studioCohort, setStudioCohort] = useState(STUDIO_COHORTS[3] ?? 'Adults (18+)');
  const [studioBatch, setStudioBatch] = useState(STUDIO_BATCH_OPTIONS[0] ?? 'Weekday Batch');

  // Submission & Pass State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberPass, setMemberPass] = useState<MemberPass | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    status: 'active_pass' | 'pending_updated';
    sessionsRemaining?: number | undefined;
  } | null>(null);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  // Load existing pass from storage if any
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (window.location.hash === '#join' || params.get('join') === 'true' || params.get('join') === '1') {
        setStep('details');
        setFormError(null);
        return;
      }

      if (params.get('pass') === 'preview' || window.location.hash === '#pass') {
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + 30);
        setMemberPass({
          reference: 'PAV-MEM-2026-8492',
          name: 'Suresh Kumar',
          email: 'suresh.kumar@example.com',
          phone: '+91 96000 55623',
          category: 'pickleball',
          planTitle: 'Inaugural Shared-Play Membership (12 Hours)',
          validFrom: now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          validUntil: future.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          totalSessions: 12,
          amountPaise: 236000,
        });
        setStep('success');
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as MemberPass;
          if (new Date(parsed.validUntil) > new Date()) {
            setMemberPass(parsed);
            setStep('success');
            return;
          }
        } catch {
          // ignore
        }
      }

      setStep('details');
      setFormError(null);
    }
  }, [isOpen]);

  // Lock body & html scroll and pause Lenis smooth scroll when modal open
  useEffect(() => {
    if (isOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const lenis = (window as { lenis?: { stop(): void; start(): void } | null }).lenis;
      lenis?.stop();

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        lenis?.start();
      };
    }
  }, [isOpen]);

  // Step 1: Validate details and advance to Step 2 (Rules)
  const handleProceedToRules = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setFormError('Please enter your full name.');
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

    setStep('rules');
  };

  // Step 2: Confirm Rules & Issue Digital Pass Directly
  // CRITICAL REQUIREMENT: Payment is completely bypassed / hidden right now!
  const handleConfirmAndIssuePass = async () => {
    if (!agreedTerms) {
      setFormError('Please check the confirmation box to confirm the club terms.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const ref = generateMemberReference(category);
    const now = new Date();
    const validUntilDate = new Date(now.getTime() + 30 * 86400000);

    const planTitle =
      category === 'pickleball'
        ? 'Inaugural Shared-Play Membership (12 Hours)'
        : `Pavilion Studio · ${studioProgramme}`;

    const sessionQuota = category === 'studio' && studioProgramme.toLowerCase().includes('box') ? 8 : 12;

    // 1. Submit to Central Turf-OS Enquiries API (with duplicate & active-pass protection)
    let apiRes: Awaited<ReturnType<typeof submitEnquiry>> | null = null;
    try {
      apiRes = await submitEnquiry({
        type: category === 'pickleball' ? 'membership' : 'studio',
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        category: planTitle,
        notes: `Registration ref: ${ref} (${sessionQuota} Sessions Quota). Payment: Pay at Desk. Notes: ${notes || 'None'}`,
        details: {
          reference: ref,
          category,
          plan: planTitle,
          sessions: sessionQuota,
        },
      });
    } catch (err) {
      console.error('[TURF-OS ENQUIRY SUBMISSION FAILED]:', err);
    }

    const resolvedRef = apiRes?.reference || ref;
    const resolvedPlan = apiRes?.planTitle || planTitle;
    const resolvedTotal = apiRes?.sessionsTotal || sessionQuota;
    setDuplicateInfo(
      apiRes?.duplicateStatus
        ? { status: apiRes.duplicateStatus, sessionsRemaining: apiRes.sessionsRemaining }
        : null,
    );

    const newPass: MemberPass = {
      reference: resolvedRef,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      category,
      planTitle: resolvedPlan,
      validFrom: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      validUntil:
        apiRes?.expiresAt ||
        validUntilDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      totalSessions: resolvedTotal,
      amountPaise: category === 'pickleball' ? MEMBERSHIP_PRICE_PAISE : 0,
      paymentId: apiRes?.duplicateStatus === 'active_pass' ? 'FRONT_DESK_VERIFIED' : 'PAY_AT_DESK',
      studioProgramme: category === 'studio' ? studioProgramme : undefined,
      studioCohort: category === 'studio' ? studioCohort : undefined,
    };

    setMemberPass(newPass);

    if (apiRes?.duplicateStatus !== 'active_pass') {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPass));
      }

      // 2. Add to Local Front Desk Console Cache (skipRemoteSync avoids duplicate second DB insert)
      if (category === 'pickleball') {
        addPickleballEnquiry({
          reference: resolvedRef,
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          plan: 'Inaugural Shared-Play Membership (12 Hours)',
          sessions: sessionQuota,
          amountPaise: MEMBERSHIP_PRICE_PAISE,
          paymentId: 'PAY_AT_DESK',
          status: 'Pay at Desk',
          notes,
          skipRemoteSync: true,
        });
      } else {
        addStudioEnquiry({
          reference: resolvedRef,
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          category: studioProgramme,
          cohort: studioCohort,
          day: studioBatch,
          timeSlot: studioBatch,
          notes,
          skipRemoteSync: true,
        });
      }
    }

    setIsSubmitting(false);
    // Straight to next step: Digital Pass or Duplicate status!
    setStep('success');
  };

  if (!isOpen) return null;

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="membership-modal-title"
      data-lenis-prevent="true"
      className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-[#050b14]/90 backdrop-blur-md animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && step === 'success') onClose();
      }}
    >
      <style>{`
        @keyframes modalBackdropFade {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(12px); }
        }
        @keyframes modalCardPop {
          0% { opacity: 0; transform: scale(0.96) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes stepContentIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(199, 162, 106, 0.25), 0 0 10px rgba(199, 162, 106, 0.35); }
          50% { box-shadow: 0 0 0 4px rgba(199, 162, 106, 0.45), 0 0 16px rgba(199, 162, 106, 0.6); }
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
        .animate-stepper-glow {
          animation: goldPulse 2.2s ease-in-out infinite;
        }
        .modal-body-scroll { overflow-x: hidden !important; }
        .modal-body-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .modal-body-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .modal-body-scroll::-webkit-scrollbar-thumb {
          background: rgba(199, 162, 106, 0.35);
          border-radius: 4px;
        }
      `}</style>

      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 py-2 sm:py-4">
        <div
          data-lenis-prevent="true"
          className="relative w-full max-w-lg max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col rounded-2xl border border-[#c7a26a]/40 bg-[#08111d] px-4 py-3 sm:px-6 sm:py-4 text-[#fbf8f1] shadow-2xl shadow-black/90 z-10 animate-modal-card overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Brand Header Bar */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0 mb-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c7a26a] animate-pulse" />
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-[#c7a26a]">
                The Pavilion Club · Member Onboarding
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-white/50 hover:text-[#c7a26a] hover:bg-white/5 transition-all active:scale-95"
              aria-label="Close dialog"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 2-Step Guided Stepper Bar (Payment bypassed per user request) */}
          {step !== 'success' && (
            <div className="pt-1.5 pb-2 flex items-center justify-between px-1 shrink-0 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step === 'rules'
                      ? 'bg-[#c7a26a] text-[#0b192c]'
                      : 'border-2 border-[#c7a26a] text-[#c7a26a] bg-[#c7a26a]/15 animate-stepper-glow'
                  }`}
                >
                  {step === 'rules' ? '✓' : '1'}
                </div>
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#c7a26a]">
                  Particulars
                </span>
              </div>

              <div
                className={`flex-1 h-px mx-3 transition-all duration-500 ${
                  step === 'rules' ? 'bg-[#c7a26a]' : 'bg-white/10'
                }`}
              />

              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step === 'rules'
                      ? 'border-2 border-[#c7a26a] text-[#c7a26a] bg-[#c7a26a]/15 animate-stepper-glow'
                      : 'border border-white/20 text-white/40'
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-[0.65rem] font-semibold uppercase tracking-wider transition-colors duration-300 ${
                    step === 'rules' ? 'text-[#c7a26a]' : 'text-white/40'
                  }`}
                >
                  Rules &amp; Pass
                </span>
              </div>
            </div>
          )}

          {/* Scrollable Step Body */}
          <div data-lenis-prevent="true" className="overflow-y-auto overflow-x-hidden overscroll-contain flex-1 py-1 modal-body-scroll pr-0.5">
            {/* ======================================================== */}
            {/* STEP 1: Unified Form (Pickleball & Studio) */}
            {/* ======================================================== */}
            {step === 'details' && (
              <div className="animate-step-in">
                <div className="text-center">
                  <h2 id="membership-modal-title" className="font-serif text-2xl font-medium text-[#fbf8f1]">
                    Unified Member Registration
                  </h2>
                  <p className="mt-0.5 text-xs text-[#fbf8f1]/70 max-w-sm mx-auto">
                    Select your programme below and enter your credentials to obtain your member pass.
                  </p>
                </div>

                {/* Category Pill Selector */}
                <div className="mt-3.5 grid grid-cols-2 gap-2 p-1 bg-[#050b14] rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setCategory('pickleball')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all flex flex-col items-center gap-0.5 ${
                      category === 'pickleball'
                        ? 'bg-[#c7a26a] text-[#08111d] shadow-md font-bold'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>🎾 Pickleball Membership</span>
                    <span className="text-[10px] opacity-80 font-mono">12 Hours Monthly Quota</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('studio')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all flex flex-col items-center gap-0.5 ${
                      category === 'studio'
                        ? 'bg-[#c7a26a] text-[#08111d] shadow-md font-bold'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>🧘 Pavilion Studio, Mogappair</span>
                    <span className="text-[10px] opacity-80 font-mono">Dance · Fitness · Yoga</span>
                  </button>
                </div>

                {/* Quota & Pricing Banner */}
                {category === 'pickleball' ? (
                  <div className="mt-3 rounded-xl border border-[#c7a26a]/30 bg-[#0e1a29]/80 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[0.58rem] font-bold uppercase tracking-wider text-[#c7a26a] block">
                        Inaugural Shared-Play Pass · Save ₹1,000
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-serif text-xl sm:text-2xl font-bold text-[#fbf8f1]">₹2,360</span>
                        <span className="text-xs text-white/50">/ mo (₹2,000 + 18% GST)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[0.62rem] font-semibold text-[#c7a26a] bg-[#c7a26a]/15 px-2 py-0.5 rounded border border-[#c7a26a]/30 block font-mono">
                        12 HOURS / MO
                      </span>
                      <span className="text-[0.58rem] text-emerald-400 mt-0.5 block font-semibold">Pay at Club Desk</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-white/10 bg-[#0e1a29]/80 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[0.58rem] font-bold uppercase tracking-wider text-[#c7a26a] block">
                        Pavilion Studio Mogappair
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-serif text-lg font-bold text-[#fbf8f1]">Class &amp; Floor Hire</span>
                        <span className="text-xs text-white/50">· Admission Intake</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[0.62rem] font-semibold text-[#c7a26a] bg-[#c7a26a]/15 px-2 py-0.5 rounded border border-[#c7a26a]/30 block font-mono">
                        12 CLASSES / MO
                      </span>
                      <span className="text-[0.58rem] text-emerald-400 mt-0.5 block font-semibold">Pay at Club Desk</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleProceedToRules} className="mt-3 space-y-3">
                  <div>
                    <label htmlFor="mem-name" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      id="mem-name"
                      type="text"
                      required
                      placeholder="e.g. Suresh Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] placeholder-white/25 text-xs focus:outline-none focus:border-[#c7a26a] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="mem-phone" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                        WhatsApp Mobile *
                      </label>
                      <input
                        id="mem-phone"
                        type="tel"
                        required
                        placeholder="+91 96000 55623"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] placeholder-white/25 text-xs focus:outline-none focus:border-[#c7a26a] transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="mem-email" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                        Email Address *
                      </label>
                      <input
                        id="mem-email"
                        type="email"
                        required
                        placeholder="name@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] placeholder-white/25 text-xs focus:outline-none focus:border-[#c7a26a] transition-all"
                      />
                    </div>
                  </div>

                  {/* Studio Options Dropdowns (When Studio is selected) */}
                  {category === 'studio' && (
                    <div className="space-y-3 pt-1 border-t border-white/10 animate-step-in">
                      <div>
                        <label htmlFor="stu-programme" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                          Select Studio Programme *
                        </label>
                        <select
                          id="stu-programme"
                          value={studioProgramme}
                          onChange={(e) => setStudioProgramme(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] text-xs focus:outline-none focus:border-[#c7a26a] transition-all"
                        >
                          {STUDIO_PROGRAMMES.map((prog) => (
                            <option key={prog} value={prog} className="bg-[#08111d]">
                              {prog}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="stu-cohort" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                            Target Cohort *
                          </label>
                          <select
                            id="stu-cohort"
                            value={studioCohort}
                            onChange={(e) => setStudioCohort(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] text-xs focus:outline-none focus:border-[#c7a26a] transition-all"
                          >
                            {STUDIO_COHORTS.map((coh) => (
                              <option key={coh} value={coh} className="bg-[#08111d]">
                                {coh}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="stu-batch" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                            Preferred Batch *
                          </label>
                          <select
                            id="stu-batch"
                            value={studioBatch}
                            onChange={(e) => setStudioBatch(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] text-xs focus:outline-none focus:border-[#c7a26a] transition-all"
                          >
                            {STUDIO_BATCH_OPTIONS.map((bat) => (
                              <option key={bat} value={bat} className="bg-[#08111d]">
                                {bat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="mem-notes" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                      Notes / Skill Level / Preferences (Optional)
                    </label>
                    <input
                      id="mem-notes"
                      type="text"
                      placeholder="e.g. Beginner level, morning preference"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] placeholder-white/25 text-xs focus:outline-none focus:border-[#c7a26a] transition-all"
                    />
                  </div>

                  {formError && (
                    <p role="alert" className="text-xs text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg p-2 text-center animate-step-in">
                      {formError}
                    </p>
                  )}

                  <GoldButton type="submit" fullWidth className="mt-1.5">
                    Next: Review Guidelines &amp; Issue Pass →
                  </GoldButton>
                </form>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: Timings, Quota & Rules Confirmation */}
            {/* ======================================================== */}
            {step === 'rules' && (
              <div className="animate-step-in">
                <div className="text-center">
                  <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#fbf8f1]">
                    {category === 'pickleball' ? 'Confirm Court Access Hours' : 'Confirm Studio Guidelines'}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#fbf8f1]/70 max-w-sm mx-auto">
                    Step 02: Review the schedule and confirm your admission details.
                  </p>
                </div>

                {/* Rules Table */}
                <div className="mt-2.5 rounded-xl border border-white/10 bg-[#0e1a29]/80 divide-y divide-white/5 overflow-hidden">
                  {category === 'pickleball' ? (
                    <>
                      <div className="flex items-start gap-2.5 py-2 px-3">
                        <div className="w-6 h-6 rounded-md bg-[#c7a26a]/15 border border-[#c7a26a]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          📅
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-white">Monday to Friday Only</span>
                            <span className="text-[10px] text-[#c7a26a] font-mono font-bold bg-[#c7a26a]/15 px-1.5 py-0.5 rounded border border-[#c7a26a]/30">6:00 AM – 3:00 PM</span>
                          </div>
                          <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Shared play sessions start and finish inside this window. Weekends for tournaments &amp; coaching.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 py-2 px-3">
                        <div className="w-6 h-6 rounded-md bg-[#c7a26a]/15 border border-[#c7a26a]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          ⏱️
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-white">12 Hours of Play / Month</span>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">Max 1 hr/day</span>
                          </div>
                          <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Front desk deducts 1 hour per check-in until all 12 hours are utilized.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 py-2 px-3">
                        <div className="w-6 h-6 rounded-md bg-[#c7a26a]/15 border border-[#c7a26a]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          🎾
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-white">Direct Walk-In Access</span>
                            <span className="text-[10px] text-[#c7a26a] font-mono font-bold">No Slot Booking</span>
                          </div>
                          <p className="text-[10px] text-white/50 mt-0.5 leading-tight">No advance booking needed. Present digital pass at front desk for instant entry.</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5 py-2 px-3">
                        <div className="w-6 h-6 rounded-md bg-[#c7a26a]/15 border border-[#c7a26a]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          🧘
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-white">{studioProgramme}</span>
                            <span className="text-[10px] text-[#c7a26a] font-mono font-bold bg-[#c7a26a]/15 px-1.5 py-0.5 rounded border border-[#c7a26a]/30">{studioCohort}</span>
                          </div>
                          <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Scheduled class intake at The Pavilion Studio Mogappair East.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 py-2 px-3">
                        <div className="w-6 h-6 rounded-md bg-[#c7a26a]/15 border border-[#c7a26a]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          👟
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-white">Indoor Footwear Protocol</span>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">Clean Soles Only</span>
                          </div>
                          <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Dedicated clean non-marking indoor shoes or grip socks required on the sprung floor.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Price & Passholder Sync Strip */}
                <div className="mt-2 bg-[#060d15] border border-[#c7a26a]/30 rounded-lg py-1.5 px-3 flex items-center justify-between">
                  <div>
                    <span className="text-[0.52rem] font-bold uppercase tracking-wider text-white/50 block">Payment Status</span>
                    <span className="font-serif text-sm sm:text-base font-bold text-emerald-400">
                      Pay at Club Desk <span className="text-[0.62rem] text-white/50 font-normal">/ Front Desk Verified</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-white/90 block font-semibold truncate max-w-[150px]">{name}</span>
                    <span className="text-[10px] text-white/50 font-mono">{phone}</span>
                  </div>
                </div>

                {/* Interactive Confirmation Checkbox */}
                <label className={`mt-2 flex items-start gap-2 cursor-pointer text-xs text-white/75 leading-tight select-none py-2 px-2.5 rounded-lg border transition-all duration-200 ${
                  agreedTerms ? 'border-[#c7a26a]/60 bg-[#c7a26a]/10 shadow-[0_0_12px_rgba(199,162,106,0.15)]' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                }`}>
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-white/30 bg-[#060d15] text-[#c7a26a] focus:ring-0 shrink-0 accent-[#c7a26a]"
                  />
                  <span>
                    I confirm that I understand this application is for <strong>{category === 'pickleball' ? 'weekday shared-play (6 AM – 3 PM, 12 Hours Quota)' : `${studioProgramme} at The Pavilion Studio`}</strong>.
                  </span>
                </label>

                {formError && (
                  <p role="alert" className="mt-1.5 text-xs text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg p-2 text-center animate-step-in">
                    {formError}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="h-11 border border-white/20 bg-transparent text-white/75 text-xs font-semibold uppercase tracking-[0.2em] hover:border-white/50 hover:text-white active:scale-[0.99] transition-all rounded-none"
                  >
                    ← Edit Details
                  </button>
                  <GoldButton
                    type="button"
                    onClick={() => void handleConfirmAndIssuePass()}
                    disabled={!agreedTerms || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit →'}
                  </GoldButton>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3: Application Submitted (Pending Desk Verification) */}
            {/* ======================================================== */}
            {step === 'success' && memberPass && (
              <div className="animate-step-in text-center space-y-4 py-2">
                {/* Header Title */}
                <div>
                  {duplicateInfo?.status === 'active_pass' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 shadow-sm">
                      ✓ Active Pass Already Registered
                    </span>
                  ) : duplicateInfo?.status === 'pending_updated' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 shadow-sm">
                      ↺ Existing Application Updated
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 shadow-sm">
                      ⏳ Application Submitted · Pending Desk Approval
                    </span>
                  )}
                  <h2 className="font-serif text-2xl font-semibold mt-2 text-[#fbf8f1]">
                    {duplicateInfo?.status === 'active_pass'
                      ? `Welcome Back, ${memberPass.name}`
                      : `Thank You, ${memberPass.name}`}
                  </h2>
                  <p className="text-xs text-white/70 mt-1 max-w-sm mx-auto">
                    {duplicateInfo?.status === 'active_pass'
                      ? 'You already hold an active membership pass with remaining sessions.'
                      : duplicateInfo?.status === 'pending_updated'
                        ? 'Your existing front desk application has been refreshed without creating a duplicate.'
                        : 'Your application has been received and forwarded to our Front Desk team.'}
                  </p>
                </div>

                {/* Status Box */}
                <div className="p-4 rounded-xl border border-[rgba(201,169,110,0.3)] bg-[#07131f] text-left space-y-2.5 max-w-md mx-auto">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Reference ID</span>
                    <span className="font-mono text-xs font-bold text-[#c7a26a] bg-[#c7a26a]/15 px-2 py-0.5 rounded border border-[#c7a26a]/30">
                      {memberPass.reference}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Selected Plan:</span>
                    <span className="font-semibold text-white truncate max-w-[200px]">{memberPass.planTitle}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Digital Card Status:</span>
                    {duplicateInfo?.status === 'active_pass' ? (
                      <span className="font-semibold text-emerald-300 bg-emerald-950/50 border border-emerald-700/60 px-2 py-0.5 rounded">
                        Active · {duplicateInfo.sessionsRemaining ?? memberPass.totalSessions} / {memberPass.totalSessions} Left
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-300 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded">
                        Unlocks upon Desk Approval
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/60 pt-1 border-t border-white/10 leading-relaxed">
                    {duplicateInfo?.status === 'active_pass' ? (
                      <>💡 Open your live Digital Member Pass below to view your 3D Metal Card &amp; remaining quota.</>
                    ) : (
                      <>💡 Our Front Desk team will call you at <strong>+91 {memberPass.phone}</strong>. Once approved &amp; accepted at the club desk, your Official Digital Member Card will be activated.</>
                    )}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  {duplicateInfo?.status === 'active_pass' && (
                    <a
                      href={`/pass/?phone=${memberPass.phone}`}
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg bg-[#c7a26a] hover:bg-[#d8b680] text-[#08111d] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                    >
                      🪪 View Digital Pass →
                    </a>
                  )}
                  <a
                    href={whatsappUrl(
                      `Hi Pavilion Club! Checking my membership pass (Ref: ${memberPass.reference}).`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                  >
                    💬 WhatsApp Front Desk
                  </a>
                  <a
                    href={CLUB.phoneHref}
                    className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    📞 Call Desk
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(STORAGE_KEY);
                      setMemberPass(null);
                      setStep('details');
                    }}
                    className="px-4 py-2 text-xs text-[#c7a26a]/80 hover:text-[#c7a26a] underline transition-colors"
                  >
                    Register Another Member
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs text-white/50 hover:text-white underline transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Application Sheet Modal for Physical Signature / Save PDF */}
      <PrintRegistrationSheet
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
        data={printableData}
      />
    </div>
  );
}
