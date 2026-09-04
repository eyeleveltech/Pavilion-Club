import type { NotificationMessage, DispatchResult } from './types.js';
import { WhatsAppBSPProvider } from './whatsapp.js';
import { SMSFallbackProvider } from './sms.js';

export class NotificationDispatcher {
  private whatsapp: WhatsAppBSPProvider;
  private sms: SMSFallbackProvider;

  constructor() {
    this.whatsapp = new WhatsAppBSPProvider();
    this.sms = new SMSFallbackProvider();
  }

  async dispatch(msg: NotificationMessage): Promise<DispatchResult> {
    // 1. Try WhatsApp Primary
    try {
      const result = await this.whatsapp.send(msg);
      return result;
    } catch (waErr: any) {
      console.warn(
        `[NotificationDispatcher] WhatsApp delivery failed for message ${msg.id}: ${waErr.message}. Triggering automatic SMS fallback...`
      );

      // 2. Automatic SMS Fallback
      try {
        const smsResult = await this.sms.send(msg);
        return smsResult;
      } catch (smsErr: any) {
        throw new Error(
          `Both WhatsApp and SMS fallback delivery failed. WhatsApp: ${waErr.message} | SMS: ${smsErr.message}`
        );
      }
    }
  }
}

export const defaultDispatcher = new NotificationDispatcher();