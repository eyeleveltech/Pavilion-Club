import type { NotificationMessage, DispatchResult } from './types.js';

export class SMSFallbackProvider {
  private apiKey: string;
  private senderId: string;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.SMS_API_KEY || '';
    this.senderId = process.env.SMS_SENDER_ID || 'PVLION';
    this.endpoint = process.env.SMS_ENDPOINT || 'https://control.msg91.com/api/v5/flow/';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('placeholder'));
  }

  private buildSmsText(msg: NotificationMessage): string {
    const p = msg.payload || {};
    switch (msg.template) {
      case 'otp':
        return `[The Pavilion Club] Your verification OTP code is ${p.code || '******'}. Valid for 5 mins. Do not share with anyone.`;
      case 'booking_confirmed':
        return `[The Pavilion Club] Booking Confirmed! Ref: ${p.reference || 'PVL'}. Court: ${p.courtName || 'Court'}, Date: ${p.date || 'Today'} at ${p.time || ''}. Venue: Anna Nagar West, Chennai.`;
      case 'booking_reminder':
        return `[The Pavilion Club] Match Reminder: You have a match reserved today at ${p.time || ''} on ${p.courtName || 'Court'}. Report 10 mins early with non-marking shoes!`;
      case 'booking_cancelled':
        return `[The Pavilion Club] Your booking ${p.reference || ''} has been cancelled. If applicable, refund will be processed within policy timeline.`;
      default:
        return `[The Pavilion Club] Update regarding your booking. Reference: ${p.reference || 'PVL'}.`;
    }
  }

  async send(msg: NotificationMessage): Promise<DispatchResult> {
    if (!msg.toPhone) {
      throw new Error('Missing destination phone number for SMS delivery');
    }

    const cleanedPhone = msg.toPhone.replace(/[^\d]/g, '');
    const phoneWithCountry = cleanedPhone.startsWith('91') ? cleanedPhone : `91${cleanedPhone}`;
    const smsText = this.buildSmsText(msg);

    // 1. Live SMS Gateway dispatch if configured
    if (this.isConfigured()) {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authkey': this.apiKey,
          },
          body: JSON.stringify({
            template_id: msg.template,
            sender: this.senderId,
            short_url: '0',
            recipients: [
              {
                mobiles: phoneWithCountry,
                ...msg.payload,
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`SMS Gateway rejected with status ${response.status}: ${errorText}`);
        }

        const data = (await response.json()) as { messageId?: string; request_id?: string };
        return {
          ok: true,
          channel: 'sms',
          provider: 'msg91-sms',
          externalMessageId: data.messageId || data.request_id || 'sms_' + Date.now(),
          fallbackUsed: true,
        };
      } catch (err: any) {
        throw new Error(`SMS Gateway network failure: ${err.message}`);
      }
    }

    // 2. Development / Sandbox simulation
    console.log(
      `[SMS Gateway (Fallback Mode)] SMS delivered to +${phoneWithCountry} | Content: "${smsText}"`
    );

    return {
      ok: true,
      channel: 'sms',
      provider: 'sms-dev-mock',
      externalMessageId: `mock_sms_${Date.now()}`,
      fallbackUsed: true,
    };
  }
}