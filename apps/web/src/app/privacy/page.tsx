import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-xs text-ink leading-relaxed">
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          Privacy Policy (Digital Personal Data Protection Act, 2023)
        </h1>
        <p className="text-ink-soft">Last updated: September 2026 · Data Fiduciary Notice</p>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy">1. Who We Are</h2>
          <p>
            The Pavilion Club (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the sports arena located at 42 Club Road, Adyar, Chennai 600020, India.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy">2. What Data We Collect & Sources</h2>
          <p>
            We collect player phone numbers, names, email addresses, match timestamps, and payment records. 
            <strong> We explicitly never see, process, or store credit/debit card numbers or bank credentials</strong> — all payment data is processed directly by RBI-licensed payment aggregators (Razorpay).
          </p>
          <p>
            Data is collected when you book through this website, at our counter desk, or <strong>received from partner platforms such as Turf Town when you book through them</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy">3. Purpose & Data Sharing</h2>
          <p>
            Data is processed solely to fulfill your booking, send OTP authentications, provide WhatsApp match reminders, and comply with mandatory tax and audit accounting laws. We never sell, rent, or trade your personal data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy">4. Grievance Officer</h2>
          <p>
            In accordance with the DPDP Act 2023, for data access, correction, or deletion requests, please contact our designated Grievance Officer:
          </p>
          <div className="p-3 bg-surface-2 rounded border border-border space-y-1 font-mono text-[11px]">
            <p><strong>Name:</strong> Jayaraman R., Managing Director</p>
            <p><strong>Email:</strong> grievance@pavilion.club</p>
            <p><strong>Address:</strong> The Pavilion Club, 42 Club Road, Adyar, Chennai 600020</p>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
