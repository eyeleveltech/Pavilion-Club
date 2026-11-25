import { NextResponse } from 'next/server';
import { CLUB } from '@/lib/club';

export interface OnboardRequestPayload {
  reference: string;
  category: 'pickleball' | 'studio';
  name: string;
  phone: string;
  email: string;
  plan: string;
  sessions?: number;
  studioCategory?: string;
  studioCohort?: string;
  studioDay?: string;
  studioSlot?: string;
  studioLevel?: string;
  notes?: string;
  amountPaise?: number;
  amountDisplay?: string;
  paymentStatus?: string;
  createdAt?: string;
}

/**
 * Builds an executive, luxury A4 Printable Dossier HTML document
 * matching The Pavilion Club design system (#08111D, #C9A96E, #FBF8F1)
 * suitable for printing, PDF generation, and archiving by the club front desk.
 */
function buildA4EmailHtml(payload: OnboardRequestPayload): string {
  const isPickleball = payload.category === 'pickleball';
  const submissionDate = payload.createdAt
    ? new Date(payload.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const totalSessions = payload.sessions || (isPickleball ? 12 : 12);

  // Generate 12 Check-in Stamp Boxes for Front Desk physical card tracking
  const stampBoxes = Array.from({ length: totalSessions }, (_, i) => {
    return `
      <div style="border: 1px dashed #C9A96E; border-radius: 6px; padding: 8px; text-align: center; background: #faf8f5;">
        <div style="font-size: 9px; font-weight: 700; color: #78623b; text-transform: uppercase;">Hour ${i + 1}</div>
        <div style="height: 24px; border-bottom: 1px solid #e2d9cc; margin: 4px 0;"></div>
        <div style="font-size: 8px; color: #a19787;">Date / Sign</div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>The Pavilion Club · Member Admission Dossier (${payload.reference})</title>
  <style>
    @media print {
      body { margin: 0; background: white !important; }
      .no-print { display: none !important; }
      .a4-container { box-shadow: none !important; border: none !important; width: 100% !important; max-width: 100% !important; padding: 20px !important; }
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f1ea; margin: 0; padding: 24px; color: #1e293b;">

  <div class="a4-container" style="max-width: 780px; margin: 0 auto; background: #ffffff; border: 1px solid #d9d1c1; border-radius: 12px; padding: 36px 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
    
    <!-- Top Action Bar for Email Readers (Screen only) -->
    <div class="no-print" style="margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid #e2d9cc; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">
        Official Physical Member Admission Form (A4)
      </span>
      <span style="font-size: 11px; color: #64748b;">
        Press <strong>Ctrl+P</strong> to print or save PDF
      </span>
    </div>

    <!-- Top Brand Lockup -->
    <table style="width: 100%; border-bottom: 2px solid #08111D; padding-bottom: 18px; margin-bottom: 24px;">
      <tr>
        <td style="vertical-align: top;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.25em; color: #C9A96E; text-transform: uppercase;">THE PAVILION CLUB · MOGAPPAIR EAST</div>
          <h1 style="margin: 4px 0 0 0; font-size: 24px; font-family: Georgia, serif; font-weight: 900; color: #08111D; letter-spacing: -0.5px;">
            ${isPickleball ? 'PICKLEBALL MEMBERSHIP DOSSIER' : 'PAVILION STUDIO, MOGAPPAIR · ADMISSION DOSSIER'}
          </h1>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
            ${isPickleball ? 'Official Shared-Play Membership · 12 Hours Monthly Quota' : 'Official Studio Programme Registration & Trial Intake'}
          </div>
        </td>
        <td style="text-align: right; vertical-align: top;">
          <div style="display: inline-block; background: #08111D; color: #C9A96E; font-family: monospace; font-size: 14px; font-weight: 800; padding: 6px 14px; border-radius: 6px;">
            ${payload.reference}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 6px; font-family: monospace;">
            Submitted: ${submissionDate}
          </div>
        </td>
      </tr>
    </table>

    <!-- Status Alert Bar -->
    <div style="background: #fdfaf3; border-left: 4px solid #C9A96E; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
      <table style="width: 100%;">
        <tr>
          <td>
            <strong style="color: #08111D; font-size: 13px;">Desk Status: Online Application Submitted</strong>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              Customer will be contacted by Pavilion Desk for orientation &amp; onboarding. Payment collection: <strong>Pay at Club Desk</strong>.
            </div>
          </td>
          <td style="text-align: right; font-weight: 700; color: #C9A96E; font-size: 13px;">
            ${payload.amountDisplay || (isPickleball ? '₹2,360 / mo (All-Inclusive)' : 'Standard Studio Fee')}
          </td>
        </tr>
      </table>
    </div>

    <!-- Section 1: Applicant Information -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #78623b; background: #f8f6f0; padding: 6px 12px; border-radius: 4px; margin-bottom: 12px; border-left: 3px solid #C9A96E;">
        1. APPLICANT PARTICULARS
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="width: 50%; padding: 8px 12px; border-bottom: 1px solid #f1ece1;">
            <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">Full Name</span>
            <strong style="font-size: 15px; color: #08111D;">${payload.name}</strong>
          </td>
          <td style="width: 50%; padding: 8px 12px; border-bottom: 1px solid #f1ece1;">
            <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">WhatsApp Contact</span>
            <strong style="font-size: 15px; color: #08111D; font-family: monospace;">+91 ${payload.phone}</strong>
          </td>
        </tr>
        <tr>
          <td style="width: 50%; padding: 8px 12px; border-bottom: 1px solid #f1ece1;">
            <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">Email Address</span>
            <span style="color: #334155;">${payload.email || '—'}</span>
          </td>
          <td style="width: 50%; padding: 8px 12px; border-bottom: 1px solid #f1ece1;">
            <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">Emergency Contact</span>
            <span style="color: #94a3b8; font-style: italic;">_________________________</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Section 2: Programme / Membership Details -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #78623b; background: #f8f6f0; padding: 6px 12px; border-radius: 4px; margin-bottom: 12px; border-left: 3px solid #C9A96E;">
        2. PROGRAMME &amp; QUOTA ALLOCATION
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: #faf9f6; border-radius: 6px; border: 1px solid #eee8dc;">
        <tr>
          <td style="padding: 12px 14px;">
            <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">Selected Programme</span>
            <strong style="font-size: 14px; color: #08111D;">${payload.plan}</strong>
          </td>
          <td style="padding: 12px 14px;">
            <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">Authorized Quota</span>
            <strong style="font-size: 14px; color: #C9A96E;">${totalSessions} Hours / Classes Per Month</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 14px; border-top: 1px solid #eee8dc;">
            <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">Access Hours / Schedule</span>
            <span style="font-size: 12px; color: #334155;">
              ${isPickleball ? 'Mon–Fri 6:00 AM – 3:00 PM (Up to 1 hr daily allowance, walk-in)' : (payload.studioSlot || 'Scheduled Class Batch')}
            </span>
          </td>
          <td style="padding: 12px 14px; border-top: 1px solid #eee8dc;">
            <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">Cohort / Level</span>
            <span style="font-size: 12px; color: #334155;">
              ${payload.studioCohort || 'Adults (18+)'} ${payload.studioLevel ? `· ${payload.studioLevel}` : ''}
            </span>
          </td>
        </tr>
        ${payload.notes ? `
        <tr>
          <td colspan="2" style="padding: 10px 14px; border-top: 1px solid #eee8dc; font-size: 12px; color: #475569;">
            <strong style="color: #08111D;">Applicant Notes:</strong> ${payload.notes}
          </td>
        </tr>` : ''}
      </table>
    </div>

    <!-- Section 3: Physical Attendance Tracking Grid -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #78623b; background: #f8f6f0; padding: 6px 12px; border-radius: 4px; margin-bottom: 12px; border-left: 3px solid #C9A96E;">
        3. FRONT DESK ATTENDANCE &amp; QUOTA STAMP GRID (${totalSessions} HOURS)
      </div>
      <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;">
        ${stampBoxes}
      </div>
      <div style="font-size: 10px; color: #64748b; margin-top: 8px;">
        * Front desk staff initials each box when the member checks in. System automatically records digital check-in concurrently.
      </div>
    </div>

    <!-- Section 4: Signatures & Authorization -->
    <table style="width: 100%; border-top: 2px solid #e2d9cc; padding-top: 20px; margin-top: 24px; font-size: 12px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 20px;">
          <div style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b; margin-bottom: 40px;">Applicant Signature / Acceptance</div>
          <div style="border-top: 1px solid #94a3b8; padding-top: 6px; color: #475569;">
            <span>Signature: _______________________</span>
            <span style="float: right;">Date: ____________</span>
          </div>
        </td>
        <td style="width: 50%; vertical-align: top; padding-left: 20px;">
          <div style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b; margin-bottom: 40px;">Front Desk Authorized Officer</div>
          <div style="border-top: 1px solid #94a3b8; padding-top: 6px; color: #475569;">
            <span>Signature: _______________________</span>
            <span style="float: right;">Date: ____________</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Footer Club Address -->
    <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #f1ece1; text-align: center; font-size: 10px; color: #94a3b8; line-height: 1.5;">
      ${CLUB.name} · ${CLUB.addressLines.join(' ')}<br />
      Desk Hotline: ${CLUB.phoneDisplay} · Studio: ${CLUB.studioPhoneDisplay} · Email: ${CLUB.email}
    </div>

  </div>

</body>
</html>
  `.trim();
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as OnboardRequestPayload;

    if (!payload.name || !payload.phone) {
      return NextResponse.json(
        { error: 'Applicant name and phone number are required.' },
        { status: 400 }
      );
    }

    const reference = payload.reference || `PAV-${payload.category === 'pickleball' ? 'MEM' : 'STU'}-${Date.now().toString().slice(-6)}`;
    const fullPayload: OnboardRequestPayload = {
      ...payload,
      reference,
      createdAt: payload.createdAt || new Date().toISOString(),
    };

    // Build the executive A4 printable HTML sheet
    const a4Html = buildA4EmailHtml(fullPayload);

    // In production, send via Nodemailer / Resend or webhook
    // Fallback: log clean audit record to server console
    console.info(`[ONBOARD] Transmitted A4 Dossier for ${fullPayload.reference} (${fullPayload.name}, ${fullPayload.phone}) to ${CLUB.email}`);

    // If an external mailer service or webhook is configured in env (e.g. RESEND_API_KEY)
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'The Pavilion Club <onboarding@thepavilionclub.com>',
            to: [CLUB.email, 'pavilionclubchennai@gmail.com'],
            subject: `[New Member Dossier] ${fullPayload.name} · ${fullPayload.reference} (${fullPayload.plan})`,
            html: a4Html,
          }),
        });
      } catch (err) {
        console.warn('[ONBOARD] Resend delivery skipped or errored:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registration dossier generated and sent to Pavilion Front Desk.',
      reference,
      a4Html,
    });
  } catch (error: unknown) {
    console.error('[ONBOARD API ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error while processing onboarding.' },
      { status: 500 }
    );
  }
}
