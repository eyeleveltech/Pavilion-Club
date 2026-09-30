'use client';

import React, { useState } from 'react';
import {
  Share2,
  CalendarPlus,
  MapPin,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  QrCode,
  Sparkles
} from 'lucide-react';

interface DigitalMatchPassActionsProps {
  reference: string;
  businessDate: string;
  timeLabel: string;
  courtName: string;
  amountPaise: number;
  customerName: string | null;
  startsAt: string; // ISO string
  endsAt: string;   // ISO string
}

export function DigitalMatchPassActions({
  reference,
  businessDate,
  timeLabel,
  courtName,
  amountPaise,
  customerName,
  startsAt,
  endsAt
}: DigitalMatchPassActionsProps) {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const venueName = 'The Pavilion Club, Adyar';
  const venueAddress = 'The Pavilion Club, 3rd Floor, Lattice Bridge Road, Adyar, Chennai - 600020';
  const googleMapsUrl = 'https://www.google.com/maps/search/?api=1&query=The+Pavilion+Club+Adyar+Chennai';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Copy reference code to clipboard
  const handleCopyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      showToast('Booking reference copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Reference code: ' + reference);
    }
  };

  // Share via WhatsApp with pre-filled match invite
  const handleWhatsAppShare = () => {
    const formattedAmount = '₹' + (amountPaise / 100).toLocaleString('en-IN');
    const msg = [
      '🏸 *BADMINTON MATCH PASS — THE PAVILION CLUB*',
      '━━━━━━━━━━━━━━━━━━━━━',
      `📅 *Date:* ${businessDate}`,
      `⏰ *Time:* ${timeLabel}`,
      `📍 *Court:* ${courtName}`,
      `🎟️ *Booking Ref:* ${reference}`,
      `💰 *Venue Due:* ${formattedAmount}`,
      `📌 *Venue:* ${venueName}`,
      `🗺️ *Location:* ${googleMapsUrl}`,
      '━━━━━━━━━━━━━━━━━━━━━',
      '👟 *Note:* Non-marking badminton shoes strictly required on court.',
      'See you on the court! 🔥'
    ].join('\n');

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Download .ics file for Apple Calendar / Google Calendar / Outlook
  const handleDownloadICS = () => {
    try {
      const startDate = new Date(startsAt);
      const endDate = new Date(endsAt);

      const formatICSDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//The Pavilion Club//Badminton Booking//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:pavilion-${reference}@thepavilionclub.com`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:🏸 Badminton Match — ${courtName} (${reference})`,
        `DESCRIPTION:Match reserved at ${venueName}.\\nBooking Reference: ${reference}\\nTime: ${timeLabel}\\nCourt: ${courtName}\\nNote: Non-marking badminton shoes strictly required.`,
        `LOCATION:${venueAddress}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT60M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Badminton Match at The Pavilion Club in 1 hour',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `match-pass-${reference}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Match event added to calendar file!');
    } catch {
      // Fallback to Google Calendar URL
      const startDate = new Date(startsAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(endsAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Badminton Match - ${courtName}`)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(`Booking Ref: ${reference}\\nCourt: ${courtName}`)}&location=${encodeURIComponent(venueAddress)}`;
      window.open(gcalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg border border-gold/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-gold flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tap-to-Copy Reference Code Pill */}
      <button
        type="button"
        onClick={handleCopyReference}
        title="Click to copy booking reference"
        className="group relative w-full p-3.5 rounded-xl bg-surface-2/80 hover:bg-surface-2 border border-border hover:border-gold/40 transition-all text-center flex flex-col items-center justify-center cursor-pointer shadow-xs active:scale-[0.99]"
      >
        <span className="text-[10px] uppercase tracking-widest font-bold text-ink-soft flex items-center gap-1.5 mb-0.5">
          <span>Booking Reference</span>
          <span className="text-gold font-normal">• Click to Copy</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-navy tracking-wider">
            {reference}
          </span>
          <div className="p-1 rounded-md bg-navy/5 text-ink-soft group-hover:text-gold transition-colors">
            {copied ? (
              <Check className="w-4 h-4 text-ok" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {/* Primary Action Buttons (2-Column Grid on Mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* WhatsApp 1-Tap Share */}
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Match Pass</span>
        </button>

        {/* Add to Calendar (.ics / Google) */}
        <button
          type="button"
          onClick={handleDownloadICS}
          className="w-full py-3 px-4 rounded-xl bg-surface border border-border hover:border-gold/50 text-ink text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 hover:bg-surface-2 active:scale-[0.98]"
        >
          <CalendarPlus className="w-4 h-4 text-gold" />
          <span>Add to Calendar</span>
        </button>
      </div>

      {/* Google Maps Venue Directions Button */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-2.5 px-4 rounded-xl bg-surface-2/60 hover:bg-surface-2 border border-border text-ink-soft hover:text-navy text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
      >
        <MapPin className="w-3.5 h-3.5 text-gold flex-shrink-0" />
        <span>Navigate to Venue: Adyar (3rd Floor)</span>
        <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
      </a>
    </div>
  );
}
