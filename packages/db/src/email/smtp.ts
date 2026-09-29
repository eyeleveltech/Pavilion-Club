import nodemailer, { type Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

export function getGmailTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER?.trim();
  const rawPass = process.env.GMAIL_APP_PASSWORD?.trim();
  const pass = rawPass ? rawPass.replace(/\s+/g, '') : ''; // strip any spaces from 16-letter App Password

  if (!user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  return transporter;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();

  // 1. Primary: Use Gmail SMTP if credentials provided
  if (user && pass) {
    try {
      const mailer = getGmailTransporter();
      if (!mailer) throw new Error('Gmail SMTP transporter could not be initialized');

      const info = await mailer.sendMail({
        from: `"The Pavilion Club" <${user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log(`[Gmail SMTP Success] Sent email to ${options.to} (MessageId: ${info.messageId})`);
      return { ok: true, messageId: info.messageId };
    } catch (err: any) {
      console.error('[Gmail SMTP Error]', err.message);
      return { ok: false, error: err.message || 'Gmail SMTP failed' };
    }
  }

  // 2. Secondary fallback: Resend API if configured
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'The Pavilion Club <onboarding@resend.dev>',
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });

      const data = (await res.json()) as any;
      if (res.ok) {
        console.log(`[Resend Success] Sent email to ${options.to} (ID: ${data.id})`);
        return { ok: true, messageId: data.id };
      }
      return { ok: false, error: data.message };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  console.warn('[Email Warning] Neither GMAIL_USER/GMAIL_APP_PASSWORD nor RESEND_API_KEY is configured in .env');
  return { ok: false, error: 'Email service not configured. Please add GMAIL_USER and GMAIL_APP_PASSWORD to .env' };
}
