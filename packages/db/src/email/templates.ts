export interface MatchPassEmailParams {
  reference: string;
  playerName: string;
  courtName: string;
  businessDate: string;
  timeLabel: string;
  amountRupees: number;
  isPaid: boolean;
  venueName?: string;
  venueAddress?: string;
  customNotice?: string;
  supportPhone?: string;
  calendarUrl?: string;
  directionsUrl?: string;
}

export interface CancellationEmailParams {
  reference: string;
  playerName: string;
  courtName: string;
  businessDate: string;
  timeLabel: string;
  amountRupees: number;
  refundStatus?: string;
  venueName?: string;
  customNotice?: string;
  supportPhone?: string;
}

export interface OtpEmailParams {
  code: string;
  venueName?: string;
  customNotice?: string;
  supportPhone?: string;
}

export function buildOtpHtmlEmail(codeOrParams: string | OtpEmailParams): string {
  const code = typeof codeOrParams === 'string' ? codeOrParams : codeOrParams.code;
  const venueName = typeof codeOrParams === 'object' && codeOrParams.venueName ? codeOrParams.venueName : 'The Pavilion Club';
  const customNotice = typeof codeOrParams === 'object' && codeOrParams.customNotice ? codeOrParams.customNotice : '';
  const supportPhone = typeof codeOrParams === 'object' && codeOrParams.supportPhone ? codeOrParams.supportPhone : '+91 98400 12345';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code - ${venueName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 16px rgba(11,25,44,0.06);">
    <!-- Header -->
    <tr>
      <td style="background-color: #0B192C; padding: 28px 24px; text-align: center;">
        <h1 style="color: #D4AF37; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
          ${venueName}
        </h1>
        <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">
          Badminton Arena &bull; Player Verification
        </p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 32px 28px; text-align: center;">
        <h2 style="color: #0B192C; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">
          Your 6-Digit Verification Code
        </h2>
        <p style="color: #64748B; margin: 0 0 24px 0; font-size: 13px; line-height: 1.5;">
          Use the verification code below to verify your account and confirm your court booking.
        </p>
        <!-- OTP Code Box -->
        <div style="background-color: #F8FAFC; border: 2px dashed #D4AF37; border-radius: 12px; padding: 18px 28px; display: inline-block; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0B192C;">
            ${code}
          </span>
        </div>
        <p style="color: #94A3B8; margin: 0; font-size: 11px;">
          ⏱️ This code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.
        </p>
        ${customNotice ? `<div style="margin-top: 18px; padding: 10px 14px; background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; color: #92400E; font-size: 11px; text-align: left;"><strong>Notice:</strong> ${customNotice}</div>` : ''}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px 24px; text-align: center;">
        <p style="color: #64748B; margin: 0; font-size: 11px;">
          ${venueName} &bull; Gandhi Nagar, Adyar, Chennai &bull; Support: ${supportPhone}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildMatchPassHtmlEmail(params: MatchPassEmailParams): string {
  const venue = params.venueName || 'The Pavilion Club';
  const address = params.venueAddress || 'The Pavilion Club, 3rd Floor, Lattice Bridge Road, Adyar, Chennai - 600020';
  const phone = params.supportPhone || '+91 98400 12345';
  const notice = params.customNotice || 'Non-marking badminton shoes strictly required on court. Racquet & shoe rental available at reception.';
  const mapsUrl = params.directionsUrl || 'https://www.google.com/maps/search/?api=1&query=The+Pavilion+Club+Adyar+Chennai';
  const gcalUrl = params.calendarUrl || `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Badminton Match - ${params.courtName}`)}&details=${encodeURIComponent(`Booking Ref: ${params.reference}`)}&location=${encodeURIComponent(address)}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Match Pass - ${params.reference}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px 12px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px rgba(11,25,44,0.08);">
    <!-- Top Navy Brand Header -->
    <tr>
      <td style="background-color: #0B192C; padding: 26px 24px; text-align: center;">
        <h1 style="color: #D4AF37; margin: 0; font-size: 21px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
          ${venue}
        </h1>
        <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">
          Official Badminton Match Pass
        </p>
      </td>
    </tr>

    <!-- Green Confirmed Banner -->
    <tr>
      <td style="background-color: #ECFDF5; border-bottom: 1px solid #A7F3D0; padding: 12px 24px; text-align: center;">
        <span style="color: #065F46; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          ✓ Booking Confirmed &bull; Reserved for ${params.playerName || 'Player'}
        </span>
      </td>
    </tr>

    <!-- Ticket Body -->
    <tr>
      <td style="padding: 28px 24px;">
        <!-- Reference Code Pill -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 12px; margin-bottom: 22px;">
          <tr>
            <td style="padding: 16px; text-align: center;">
              <span style="font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 700; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">
                Booking Reference Code
              </span>
              <span style="font-family: monospace; font-size: 26px; font-weight: 800; color: #0B192C; letter-spacing: 3px;">
                ${params.reference}
              </span>
            </td>
          </tr>
        </table>

        <!-- Match Details Grid -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td width="50%" style="padding: 10px 12px; background-color: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
              <span style="font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 600; display: block;">Court</span>
              <strong style="color: #0B192C; font-size: 15px;">${params.courtName}</strong>
            </td>
            <td width="8"></td>
            <td width="50%" style="padding: 10px 12px; background-color: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
              <span style="font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 600; display: block;">Date</span>
              <strong style="color: #0B192C; font-size: 15px;">${params.businessDate}</strong>
            </td>
          </tr>
          <tr><td height="8"></td></tr>
          <tr>
            <td width="50%" style="padding: 10px 12px; background-color: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
              <span style="font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 600; display: block;">Time Slot</span>
              <strong style="color: #0B192C; font-size: 14px;">${params.timeLabel}</strong>
            </td>
            <td width="8"></td>
            <td width="50%" style="padding: 10px 12px; background-color: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
              <span style="font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 600; display: block;">Tariff &bull; Payment</span>
              <strong style="color: #0B192C; font-size: 14px; font-family: monospace;">₹${params.amountRupees}</strong>
              <span style="font-size: 10px; color: #059669; font-weight: 600; margin-left: 4px;">
                ${params.isPaid ? '(Paid)' : '(Pay at Venue)'}
              </span>
            </td>
          </tr>
        </table>

        <!-- Primary Action Buttons -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td style="text-align: center;">
              <a href="${gcalUrl}" target="_blank" style="display: inline-block; background-color: #0B192C; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; margin: 4px; border: 1px solid #0B192C;">
                🗓️ Add to Google Calendar
              </a>
              <a href="${mapsUrl}" target="_blank" style="display: inline-block; background-color: #ffffff; color: #0B192C; padding: 12px 24px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; margin: 4px; border: 1px solid #CBD5E1;">
                📍 View Venue Directions
              </a>
            </td>
          </tr>
        </table>

        <!-- Venue Guidelines Box -->
        <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 14px 16px; margin-bottom: 18px;">
          <strong style="color: #92400E; font-size: 12px; display: block; margin-bottom: 4px;">
            ⚠️ Court Rules &amp; Guidelines:
          </strong>
          <p style="color: #78350F; font-size: 11px; margin: 0; line-height: 1.5;">
            ${notice}
          </p>
        </div>

        <!-- Venue Location Info -->
        <div style="background-color: #F8FAFC; border-radius: 10px; padding: 12px 16px; border: 1px solid #E2E8F0;">
          <span style="color: #64748B; font-size: 10px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 2px;">
            Venue Address
          </span>
          <p style="color: #0B192C; font-size: 12px; margin: 0; line-height: 1.4;">
            ${address}
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 24px; text-align: center;">
        <p style="color: #64748B; margin: 0 0 4px 0; font-size: 11px;">
          Need assistance or rescheduling? Call reception at <strong>${phone}</strong>
        </p>
        <p style="color: #94A3B8; margin: 0; font-size: 10px;">
          &copy; ${new Date().getFullYear()} ${venue}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildCancellationReceiptHtmlEmail(params: CancellationEmailParams): string {
  const venue = params.venueName || 'The Pavilion Club';
  const phone = params.supportPhone || '+91 98400 12345';
  const notice = params.customNotice || 'Your reserved slot has been released back to the arena. You can book a new slot anytime on our portal.';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancelled - ${params.reference}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px 12px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 16px rgba(11,25,44,0.06);">
    <!-- Header -->
    <tr>
      <td style="background-color: #0B192C; padding: 26px 24px; text-align: center;">
        <h1 style="color: #D4AF37; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
          ${venue}
        </h1>
        <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">
          Booking Cancellation Receipt
        </p>
      </td>
    </tr>

    <!-- Cancellation Status Banner -->
    <tr>
      <td style="background-color: #FEF2F2; border-bottom: 1px solid #FECACA; padding: 12px 24px; text-align: center;">
        <span style="color: #991B1B; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          ✓ Slot Cancelled Successfully
        </span>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 28px 24px;">
        <p style="color: #0B192C; font-size: 14px; margin: 0 0 16px 0;">
          Hello <strong>${params.playerName || 'Player'}</strong>,
        </p>
        <p style="color: #64748B; font-size: 13px; line-height: 1.5; margin: 0 0 20px 0;">
          As requested, your court booking has been cancelled and released for other players.
        </p>

        <!-- Summary Details Box -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 10px; border: 1px solid #E2E8F0; margin-bottom: 22px;">
          <tr>
            <td style="padding: 14px 18px;">
              <div style="font-size: 12px; color: #64748B; margin-bottom: 6px;">
                Reference: <strong style="color: #0B192C; font-family: monospace;">${params.reference}</strong>
              </div>
              <div style="font-size: 12px; color: #64748B; margin-bottom: 6px;">
                Court: <strong style="color: #0B192C;">${params.courtName}</strong>
              </div>
              <div style="font-size: 12px; color: #64748B; margin-bottom: 6px;">
                Date &amp; Time: <strong style="color: #0B192C;">${params.businessDate} &bull; ${params.timeLabel}</strong>
              </div>
              <div style="font-size: 12px; color: #64748B;">
                Amount: <strong style="color: #0B192C; font-family: monospace;">₹${params.amountRupees}</strong>
                <span style="color: #059669; font-weight: 600; margin-left: 4px;">(${params.refundStatus || 'Zero Deposit Required'})</span>
              </div>
            </td>
          </tr>
        </table>

        <div style="background-color: #F1F5F9; border-radius: 8px; padding: 12px 14px; color: #475569; font-size: 11px; line-height: 1.5; margin-bottom: 20px;">
          ${notice}
        </div>

        <div style="text-align: center;">
          <a href="https://trunk-visual-jpg-circus.trycloudflare.com/book" style="display: inline-block; background-color: #0B192C; color: #ffffff; padding: 10px 22px; border-radius: 8px; font-size: 12px; font-weight: 700; text-decoration: none;">
            Book Another Court Slot &rarr;
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px 24px; text-align: center;">
        <p style="color: #64748B; margin: 0; font-size: 11px;">
          ${venue} &bull; Adyar, Chennai &bull; Support: ${phone}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
