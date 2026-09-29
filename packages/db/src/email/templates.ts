export function buildOtpHtmlEmail(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verification Code - The Pavilion Club</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <!-- Header -->
    <tr>
      <td style="background-color: #0F172A; padding: 28px 24px; text-align: center;">
        <h1 style="color: #D4AF37; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
          The Pavilion Club
        </h1>
        <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">
          Badminton Arena &bull; Player Verification
        </p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 32px 28px; text-align: center;">
        <h2 style="color: #0F172A; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">
          Your 6-Digit Verification Code
        </h2>
        <p style="color: #64748B; margin: 0 0 24px 0; font-size: 13px; line-height: 1.5;">
          Use the verification code below to verify your email address and confirm your court booking.
        </p>
        <!-- OTP Code Box -->
        <div style="background-color: #F1F5F9; border: 2px dashed #CBD5E1; border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0F172A;">
            ${code}
          </span>
        </div>
        <p style="color: #94A3B8; margin: 0; font-size: 11px;">
          ⏱️ This code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px 24px; text-align: center;">
        <p style="color: #64748B; margin: 0; font-size: 11px;">
          The Pavilion Club &bull; Gandhi Nagar, Adyar, Chennai
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
