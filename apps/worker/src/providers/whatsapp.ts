import type { NotificationMessage, DispatchResult } from './types.js';

export function extractTemplateParams(template: string, payload: Record<string, unknown>): string[] {
  switch (template) {
    case 'booking_confirmed':
      return [
        String(payload.customerName || 'Player'),
        String(payload.reference || ''),
        String(payload.courtName || 'Court 1'),
        String(payload.date || ''),
        String(payload.timeSlot || ''),
        String(payload.amountRupees || '800'),
      ];
    case 'booking_reminder':
      return [
        String(payload.customerName || 'Player'),
        String(payload.courtName || 'Court 1'),
        String(payload.timeSlot || ''),
        String(payload.reference || ''),
      ];
    case 'booking_cancelled':
      return [
        String(payload.customerName || 'Player'),
        String(payload.reference || ''),
        String(payload.courtName || 'Court 1'),
        String(payload.date || ''),
      ];
    case 'booking_rescheduled':
      return [
        String(payload.customerName || 'Player'),
        String(payload.reference || ''),
        String(payload.newCourt || 'Court 1'),
        String(payload.newDate || ''),
        String(payload.newTime || ''),
        String(payload.oldSlot || ''),
      ];
    case 'otp_verification':
    case 'otp':
      return [String(payload.code || '')];
    case 'daily_summary':
      return [
        String(payload.date || ''),
        String(payload.totalHours || ''),
        String(payload.cashAmount || ''),
        String(payload.upiAmount || ''),
        String(payload.variance || '0'),
        String(payload.occupancy || ''),
        String(payload.closedBy || 'Desk Staff'),
        String(payload.closedAt || ''),
      ];
    default:
      return Object.values(payload || {}).map(String);
  }
}

export class WhatsAppBSPProvider {
  private apiKey: string;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || '';
    this.endpoint = process.env.WHATSAPP_ENDPOINT || 'https://backend.aisensy.com/campaign/t1/api/v2';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('placeholder'));
  }

  async send(msg: NotificationMessage): Promise<DispatchResult> {
    if (!msg.toPhone) {
      throw new Error('Missing destination phone number for WhatsApp message');
    }

    const cleanedPhone = msg.toPhone.replace(/[^\d]/g, '');
    const phoneWithCountry = cleanedPhone.startsWith('91') ? cleanedPhone : `91${cleanedPhone}`;
    const templateParams = extractTemplateParams(msg.template, msg.payload || {});

    // 1. Live WhatsApp BSP dispatch if configured
    if (this.isConfigured()) {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            apiKey: this.apiKey,
            campaignName: msg.template,
            destination: phoneWithCountry,
            userName: (msg.payload?.customerName as string) || 'Pavilion Player',
            templateParams,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`WhatsApp BSP rejected with status ${response.status}: ${errorText}`);
        }

        const data = (await response.json()) as { messageId?: string };
        return {
          ok: true,
          channel: 'whatsapp',
          provider: 'aisensy-bsp',
          externalMessageId: data.messageId || 'wa_' + Date.now(),
        };
      } catch (err: any) {
        throw new Error(`WhatsApp API network failure: ${err.message}`);
      }
    }

    // 2. Development / Sandbox simulation
    console.log(
      `[WhatsApp BSP (Dev Mode)] Message delivered to +${phoneWithCountry} | Template: ${msg.template} | Params:`,
      JSON.stringify(templateParams)
    );

    return {
      ok: true,
      channel: 'whatsapp',
      provider: 'whatsapp-dev-mock',
      externalMessageId: `mock_wa_${Date.now()}`,
    };
  }
}
