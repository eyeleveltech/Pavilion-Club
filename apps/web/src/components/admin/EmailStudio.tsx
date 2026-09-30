'use client';

import React, { useState, useMemo } from 'react';
import {
  buildMatchPassHtmlEmail,
  buildCancellationReceiptHtmlEmail,
  buildOtpHtmlEmail,
} from '@pavilion/db/email';
import {
  Mail,
  Smartphone,
  Monitor,
  Code,
  Eye,
  Send,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Ticket,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

type EmailTemplateType = 'match-pass' | 'cancellation' | 'otp';

export function EmailStudio() {
  const [template, setTemplate] = useState<EmailTemplateType>('match-pass');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  // Common Customization Fields
  const [venueName, setVenueName] = useState('The Pavilion Club');
  const [venueAddress, setVenueAddress] = useState(
    'The Pavilion Club, 3rd Floor, Lattice Bridge Road, Adyar, Chennai - 600020'
  );
  const [supportPhone, setSupportPhone] = useState('+91 98400 12345');
  const [subjectLine, setSubjectLine] = useState(
    '🏸 Your Badminton Match Pass — Court 2 [PC-8VTDT4]'
  );
  const [customNotice, setCustomNotice] = useState(
    'Non-marking badminton shoes strictly required on court. Racquet & shoe rental available at reception. Please arrive 10 minutes before your slot.'
  );

  // Mock Match Data Fields
  const [reference, setReference] = useState('PC-8VTDT4');
  const [playerName, setPlayerName] = useState('Harish Kumar');
  const [courtName, setCourtName] = useState('Court 2 (BWF Synthetic)');
  const [businessDate, setBusinessDate] = useState('Wed, 30 Sep 2026');
  const [timeLabel, setTimeLabel] = useState('07:00 PM – 08:00 PM');
  const [amountRupees, setAmountRupees] = useState(800);
  const [isPaid, setIsPaid] = useState(false);
  const [otpCode, setOtpCode] = useState('839201');

  // Test Email Dispatch State
  const [testEmailTo, setTestEmailTo] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Dynamically Generate the HTML based on chosen template & live customizer inputs
  const renderedHtml = useMemo(() => {
    if (template === 'match-pass') {
      return buildMatchPassHtmlEmail({
        reference,
        playerName,
        courtName,
        businessDate,
        timeLabel,
        amountRupees,
        isPaid,
        venueName,
        venueAddress,
        customNotice,
        supportPhone,
      });
    }

    if (template === 'cancellation') {
      return buildCancellationReceiptHtmlEmail({
        reference,
        playerName,
        courtName,
        businessDate,
        timeLabel,
        amountRupees,
        refundStatus: 'Zero Deposit Required',
        venueName,
        customNotice: customNotice || 'Your reserved slot has been released back to the arena. You can book a new slot anytime on our portal.',
        supportPhone,
      });
    }

    // OTP Code
    return buildOtpHtmlEmail({
      code: otpCode,
      venueName,
      customNotice,
      supportPhone,
    });
  }, [
    template,
    reference,
    playerName,
    courtName,
    businessDate,
    timeLabel,
    amountRupees,
    isPaid,
    venueName,
    venueAddress,
    customNotice,
    supportPhone,
    otpCode,
  ]);

  // Handle Dispatching Test Email
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailTo || !testEmailTo.includes('@')) {
      setSendResult({ ok: false, msg: 'Please enter a valid recipient email address.' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/admin/email-preview/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmailTo.trim(),
          subject: subjectLine,
          html: renderedHtml,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setSendResult({
          ok: true,
          msg: `✓ Email successfully dispatched to ${testEmailTo}! Check your inbox.`,
        });
      } else {
        setSendResult({
          ok: false,
          msg: json.error || 'Failed to dispatch email. Please check SMTP credentials in .env.',
        });
      }
    } catch (err: any) {
      setSendResult({
        ok: false,
        msg: 'Network error communicating with email dispatch service.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(renderedHtml);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleResetDefaults = () => {
    setVenueName('The Pavilion Club');
    setVenueAddress(
      'The Pavilion Club, 3rd Floor, Lattice Bridge Road, Adyar, Chennai - 600020'
    );
    setSupportPhone('+91 98400 12345');
    setSubjectLine('🏸 Your Badminton Match Pass — Court 2 [PC-8VTDT4]');
    setCustomNotice(
      'Non-marking badminton shoes strictly required on court. Racquet & shoe rental available at reception. Please arrive 10 minutes before your slot.'
    );
    setPlayerName('Harish Kumar');
    setCourtName('Court 2 (BWF Synthetic)');
    setAmountRupees(800);
    setIsPaid(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 bg-surface border border-border rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-navy text-gold">
              <Mail className="w-4 h-4" />
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-navy tracking-tight">
              Email Studio &amp; Live Editor
            </h1>
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Customize copy, live-preview responsive HTML templates, and dispatch test emails to your inbox.
          </p>
        </div>

        {/* Template Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-2 border border-border">
          <button
            type="button"
            onClick={() => {
              setTemplate('match-pass');
              setSubjectLine('🏸 Your Badminton Match Pass — Court 2 [PC-8VTDT4]');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              template === 'match-pass'
                ? 'bg-navy text-white shadow-xs'
                : 'text-ink-soft hover:text-navy'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-gold" />
            <span>Match Pass</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTemplate('cancellation');
              setSubjectLine('✓ Booking Cancellation Receipt [PC-8VTDT4]');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              template === 'cancellation'
                ? 'bg-navy text-white shadow-xs'
                : 'text-ink-soft hover:text-navy'
            }`}
          >
            <span>Cancellation</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTemplate('otp');
              setSubjectLine('Your Pavilion Club Verification Code: 839201');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              template === 'otp'
                ? 'bg-navy text-white shadow-xs'
                : 'text-ink-soft hover:text-navy'
            }`}
          >
            <span>OTP Code</span>
          </button>
        </div>
      </div>

      {/* 2. Main Studio Split Grid: Left Editor | Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Customizer Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-surface border border-border rounded-2xl shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span>Live Content Customizer</span>
              </span>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] text-ink-soft hover:text-navy underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Field: Subject Line */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-ink-soft">
                Email Subject Line
              </label>
              <input
                type="text"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-xs font-medium focus:border-navy outline-hidden"
              />
            </div>

            {/* Field: Venue Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-ink-soft">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-xs font-medium focus:border-navy outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-ink-soft">
                  Support Phone
                </label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-xs font-medium focus:border-navy outline-hidden"
                />
              </div>
            </div>

            {/* Field: Rules / Notice Box */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-ink-soft">
                Court Rules / Player Notice
              </label>
              <textarea
                rows={3}
                value={customNotice}
                onChange={(e) => setCustomNotice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-xs font-medium focus:border-navy outline-hidden resize-none leading-relaxed"
              />
            </div>

            {/* Dynamic Mock Data (Matches Template) */}
            {template === 'otp' ? (
              <div className="space-y-1 pt-2 border-t border-border/80">
                <label className="block text-[11px] font-bold text-ink-soft">
                  Preview 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink font-mono text-center font-bold text-base tracking-widest focus:border-navy outline-hidden"
                />
              </div>
            ) : (
              <div className="space-y-3 pt-2 border-t border-border/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint block">
                  Match Ticket Mock Data
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-ink-soft">Player Name</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-ink-soft">Booking Reference</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-ink-soft">Court</label>
                    <input
                      type="text"
                      value={courtName}
                      onChange={(e) => setCourtName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-ink-soft">Timing</label>
                    <input
                      type="text"
                      value={timeLabel}
                      onChange={(e) => setTimeLabel(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-ink-soft">Amount (₹)</label>
                    <input
                      type="number"
                      value={amountRupees}
                      onChange={(e) => setAmountRupees(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-ink-soft">Payment Mode</label>
                    <select
                      value={isPaid ? 'paid' : 'venue'}
                      onChange={(e) => setIsPaid(e.target.value === 'paid')}
                      className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-xs"
                    >
                      <option value="venue">Pay at Venue</option>
                      <option value="paid">Paid (Online / Counter)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Dispatch Card */}
          <form
            onSubmit={handleSendTestEmail}
            className="p-5 bg-surface border border-border rounded-2xl shadow-xs space-y-3"
          >
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-gold" />
              <h3 className="text-xs font-bold text-navy">Send Test Email to Inbox</h3>
            </div>
            <p className="text-[11px] text-ink-soft">
              Enter any email address to dispatch this exact customized template and verify inbox rendering.
            </p>

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="yourname@gmail.com"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface text-ink text-xs focus:border-navy outline-hidden"
              />
              <button
                type="submit"
                disabled={isSending || !testEmailTo}
                className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy/90 transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 text-gold" />
                    <span>Send Test</span>
                  </>
                )}
              </button>
            </div>

            {sendResult && (
              <div
                className={`p-2.5 rounded-xl text-xs font-medium flex items-start gap-2 ${
                  sendResult.ok
                    ? 'bg-ok-soft text-ok border border-ok/30'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                {sendResult.ok ? (
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                )}
                <span>{sendResult.msg}</span>
              </div>
            )}
          </form>
        </div>

        {/* RIGHT COLUMN: Interactive Live Preview Frame (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Frame Controls Bar */}
          <div className="flex items-center justify-between p-2.5 bg-surface border border-border rounded-xl text-xs">
            {/* View Mode: Visual vs Code */}
            <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-surface text-navy shadow-xs font-bold'
                    : 'text-ink-soft hover:text-navy'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visual</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('code')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'code'
                    ? 'bg-surface text-navy shadow-xs font-bold'
                    : 'text-ink-soft hover:text-navy'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>HTML Code</span>
              </button>
            </div>

            {/* Device Toggle (Desktop 600px vs Mobile 375px) */}
            {viewMode === 'preview' && (
              <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setDevice('desktop')}
                  title="Desktop View (600px)"
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    device === 'desktop'
                      ? 'bg-surface text-navy shadow-xs'
                      : 'text-ink-soft hover:text-navy'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDevice('mobile')}
                  title="Mobile View (375px)"
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    device === 'mobile'
                      ? 'bg-surface text-navy shadow-xs'
                      : 'text-ink-soft hover:text-navy'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Copy HTML Button */}
            {viewMode === 'code' && (
              <button
                type="button"
                onClick={handleCopyHtml}
                className="px-3 py-1 rounded-lg bg-surface border border-border hover:bg-surface-2 text-navy text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-ok" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy HTML</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Preview Container Mockup */}
          {viewMode === 'preview' ? (
            <div className="bg-surface-subtle border border-border rounded-2xl p-4 sm:p-8 flex items-center justify-center min-h-[640px] overflow-auto">
              <div
                style={{
                  width: device === 'mobile' ? '375px' : '600px',
                  maxWidth: '100%',
                  transition: 'width 0.25s ease-in-out',
                }}
                className="bg-white rounded-2xl shadow-xl border border-border/80 overflow-hidden"
              >
                {/* Simulated Email Client Subject Bar */}
                <div className="bg-surface-2 border-b border-border px-4 py-2.5 flex items-center justify-between text-[11px] text-ink-soft">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                    <span className="font-bold text-navy truncate">{subjectLine}</span>
                  </div>
                  <span className="font-mono text-[10px] text-ink-faint shrink-0">
                    {device === 'mobile' ? '375px' : '600px'}
                  </span>
                </div>

                {/* Sandboxed iframe rendering live HTML */}
                <iframe
                  title="Live Email Preview"
                  srcDoc={renderedHtml}
                  className="w-full min-h-[580px] border-0"
                  sandbox="allow-popups allow-same-origin"
                />
              </div>
            </div>
          ) : (
            /* Raw HTML Code View */
            <div className="bg-navy rounded-2xl p-4 border border-border shadow-xs">
              <pre className="text-white/90 font-mono text-[11px] overflow-auto max-h-[600px] leading-relaxed select-all">
                {renderedHtml}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
