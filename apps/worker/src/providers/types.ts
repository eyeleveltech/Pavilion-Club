export type MessageTemplate =
  | 'otp'
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'daily_summary'
  | string;

export interface NotificationMessage {
  id: string;
  toPhone?: string | null;
  toEmail?: string | null;
  template: MessageTemplate;
  payload: Record<string, unknown>;
}

export interface DispatchResult {
  ok: boolean;
  channel: 'whatsapp' | 'sms';
  provider: string;
  externalMessageId?: string;
  error?: string;
  fallbackUsed?: boolean;
}