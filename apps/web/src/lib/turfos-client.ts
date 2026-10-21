function sanitizeVenueName(name?: string | null): string {
  if (!name) return 'The Pavilion Club, Mogappair East';
  if (name.includes('Adyar')) return 'The Pavilion Club, Mogappair East';
  return name;
}

// Browser client for the TurfOS keyless public booking API.
//
// This site is a static export: everything here ships to the visitor's
// browser, so NOTHING in this file is secret and there is no API key. TurfOS
// works out which venue this is from the page's Origin (the site must be
// listed under the venue's "Websites allowed to take bookings" in the TurfOS
// admin), and its public endpoints cannot confirm a booking or accept a price.
//
// A booking only becomes "confirmed" when Razorpay's webhook reaches TurfOS.
// The browser's payment callback is a cue to start polling, never proof.

const base = (process.env.NEXT_PUBLIC_TURFOS_API_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

export class TurfApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}/api/public/v1${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new TurfApiError(
      'network',
      'Could not reach the booking system. Check your connection and try again.',
      0,
    );
  }

  const body = (await response.json().catch(() => null)) as
    | (T & { error?: { code: string; message: string } })
    | null;

  if (!response.ok) {
    const error = body?.error;
    throw new TurfApiError(
      error?.code ?? 'unknown',
      error?.message ?? 'Something went wrong. Please try again.',
      response.status,
    );
  }
  return body as T;
}

/* ------------------------------------------------------------------ */
/* Availability                                                        */
/* ------------------------------------------------------------------ */

export interface DaySlot {
  startsAt: string;
  endsAt: string;
  available: boolean;
  /** Indicative. The hold returns the authoritative figure. */
  pricePaise: number;
  feePaise: number;
}

export interface CourtDay {
  id: string;
  label: string;
  name: string;
  sport: string;
  slots: DaySlot[];
}

export interface VenueDay {
  timezone: string;
  courts: CourtDay[];
  /** How this venue takes payment: online (Razorpay) or at the front desk. Set in TurfOS. */
  payment: 'online' | 'at_venue';
}

interface WireAvailability {
  venue: { timezone: string };
  payment?: 'online' | 'at_venue';
  courts: {
    court_id: string;
    label: string;
    display_name: string;
    sport_type: string;
    slots: {
      starts_at: string;
      ends_at: string;
      available: boolean;
      price_paise: number;
      booking_fee_paise: number;
    }[];
  }[];
}

export async function fetchDay(date: string): Promise<VenueDay> {
  const wire = await call<WireAvailability>(`/availability?date=${encodeURIComponent(date)}`);
  return {
    timezone: wire.venue.timezone,
    payment: wire.payment === 'at_venue' ? 'at_venue' : 'online',
    courts: wire.courts.map((court) => ({
      id: court.court_id,
      label: court.label,
      name: court.display_name,
      sport: court.sport_type,
      slots: court.slots.map((slot) => ({
        startsAt: slot.starts_at,
        endsAt: slot.ends_at,
        available: slot.available,
        pricePaise: slot.price_paise,
        feePaise: slot.booking_fee_paise,
      })),
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Hold -> pay -> confirmed                                            */
/* ------------------------------------------------------------------ */

export interface Hold {
  bookingId: string;
  expiresAt: string;
  startsAt: string;
  endsAt: string;
  slotPaise: number;
  feePaise: number;
  totalPaise: number;
}

export async function createHold(input: {
  courtId: string;
  startsAt: string;
  hours: number;
  name: string;
  phone: string;
  email: string;
}): Promise<Hold> {
  const wire = await call<{
    booking_id: string;
    expires_at: string;
    starts_at: string;
    ends_at: string;
    slot_amount_paise: number;
    booking_fee_paise: number;
    total_paise: number;
  }>('/holds', {
    method: 'POST',
    body: JSON.stringify({
      court_id: input.courtId,
      starts_at: input.startsAt,
      hours: input.hours,
      customer: { name: input.name, phone: input.phone, email: input.email },
    }),
  });
  return {
    bookingId: wire.booking_id,
    expiresAt: wire.expires_at,
    startsAt: wire.starts_at,
    endsAt: wire.ends_at,
    slotPaise: wire.slot_amount_paise,
    feePaise: wire.booking_fee_paise,
    totalPaise: wire.total_paise,
  };
}

/**
 * Pay-at-venue venues only: confirm the hold as a booking paid at the desk.
 * TurfOS refuses unless the VENUE is switched to pay-at-venue; the browser
 * cannot choose this.
 */
export async function confirmAtVenue(bookingId: string): Promise<void> {
  await call(`/bookings/${encodeURIComponent(bookingId)}/confirm-at-venue`, { method: 'POST' });
}

export interface PaymentOrder {
  orderId: string;
  keyId: string;
  amountPaise: number;
  currency: string;
  venueName: string;
  prefill: { name: string; email: string; contact: string };
}

export async function startPayment(bookingId: string): Promise<PaymentOrder> {
  const wire = await call<{
    simulate?: boolean;
    order_id?: string;
    key_id?: string;
    amount_paise: number;
    currency?: string;
    venue_name?: string;
    prefill?: { name: string; email: string; contact: string };
  }>(`/bookings/${encodeURIComponent(bookingId)}/pay`, { method: 'POST' });

  if (wire.simulate || !wire.order_id || !wire.key_id) {
    throw new TurfApiError(
      'payments_off',
      'Online payment is not switched on for this venue yet.',
      409,
    );
  }
  return {
    orderId: wire.order_id,
    keyId: wire.key_id,
    amountPaise: wire.amount_paise,
    currency: wire.currency ?? 'INR',
    venueName: sanitizeVenueName(wire.venue_name),
    prefill: wire.prefill ?? { name: '', email: '', contact: '' },
  };
}

/* ------------------------------------------------------------------ */
/* Packs & Hour Credits Redemption                                     */
/* ------------------------------------------------------------------ */

export interface CustomerPack {
  id: string;
  name: string;
  sport: string | null;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  expiresAt: string | null;
}

export interface CustomerPacksResponse {
  found: boolean;
  customer?: { name: string };
  packs: CustomerPack[];
}

export async function checkCustomerPacks(phone: string): Promise<CustomerPacksResponse> {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return { found: false, packs: [] };
  return call<CustomerPacksResponse>(`/customers/${encodeURIComponent(digits)}/packs`);
}

export interface BookingPackOption {
  id: string;
  name: string;
  creditsLeft: number;
  creditsNeeded: number;
  usable: boolean;
  reason?: string;
}

export async function checkBookingPacks(bookingId: string): Promise<{ packs: BookingPackOption[] }> {
  return call<{ packs: BookingPackOption[] }>(`/bookings/${encodeURIComponent(bookingId)}/packs`);
}

export interface RedeemPackResult {
  ok: boolean;
  booking_id: string;
  reference: string;
  status: string;
  credits_left: number;
  message: string;
}

export async function redeemPackBooking(
  bookingId: string,
  packId?: string,
): Promise<RedeemPackResult> {
  return call<RedeemPackResult>(`/bookings/${encodeURIComponent(bookingId)}/redeem-pack`, {
    method: 'POST',
    body: JSON.stringify({ pack_id: packId }),
  });
}

/* ------------------------------------------------------------------ */
/* The booking, for the pass page and the post-payment poll            */
/* ------------------------------------------------------------------ */

export type BookingStatus = 'held' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface BookingView {
  bookingId: string;
  reference: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  expiresAt: string | null;
  businessDate: string;
  courtName: string;
  /** The activity, e.g. "Pickleball" or "Yoga & Aerobics" (TurfOS sport type). */
  sport: string;
  venueName: string;
  venueAddress: string | null;
  timezone: string;
  firstName: string | null;
  phoneLast4: string | null;
  slotPaise: number;
  feePaise: number;
  paidPaise: number;
  totalPaise: number;
  /** True when the booking is settled at the front desk rather than online. */
  payAtVenue: boolean;
  payment: 'online' | 'at_venue' | 'pack';
  isPackRedemption: boolean;
}

export async function fetchBooking(bookingId: string): Promise<BookingView> {
  const wire = await call<{
    booking_id: string;
    reference: string;
    status: BookingStatus;
    starts_at: string;
    ends_at: string;
    expires_at: string | null;
    business_date: string;
    court: { display_name: string; sport_type: string };
    venue: { name: string; address: string | null; timezone: string };
    customer: { first_name: string | null; phone_last4: string | null };
    payment?: 'online' | 'at_venue' | 'pack';
    payment_path?: string;
    amounts: {
      slot_paise: number;
      booking_fee_paise: number;
      paid_paise: number;
      total_paise: number;
    };
  }>(`/bookings/${encodeURIComponent(bookingId)}`);

  const isPack = wire.payment === 'pack' || wire.payment_path === 'redemption';

  return {
    bookingId: wire.booking_id,
    reference: wire.reference,
    status: wire.status,
    startsAt: wire.starts_at,
    endsAt: wire.ends_at,
    expiresAt: wire.expires_at,
    businessDate: wire.business_date,
    courtName: wire.court.display_name,
    sport: wire.court.sport_type,
    venueName: sanitizeVenueName(wire.venue.name),
    venueAddress: wire.venue.address,
    timezone: wire.venue.timezone,
    firstName: wire.customer.first_name,
    phoneLast4: wire.customer.phone_last4,
    slotPaise: wire.amounts.slot_paise,
    feePaise: wire.amounts.booking_fee_paise,
    paidPaise: wire.amounts.paid_paise,
    totalPaise: wire.amounts.total_paise,
    payAtVenue: wire.payment === 'at_venue' && !isPack,
    payment: isPack ? 'pack' : (wire.payment ?? 'online'),
    isPackRedemption: isPack,
  };
}

/* ------------------------------------------------------------------ */
/* My bookings — sign in with an emailed code                          */
/* ------------------------------------------------------------------ */

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function requestLoginCode(email: string): Promise<void> {
  await call('/me/code', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function verifyLoginCode(
  email: string,
  code: string,
): Promise<{ token: string; firstName: string | null }> {
  const wire = await call<{ token: string; customer: { first_name: string | null } }>(
    '/me/verify',
    { method: 'POST', body: JSON.stringify({ email, code }) },
  );
  return { token: wire.token, firstName: wire.customer.first_name };
}

export async function logoutSession(token: string): Promise<void> {
  await call('/me/logout', { method: 'POST', headers: authHeader(token) }).catch(() => undefined);
}

export interface MyBooking {
  bookingId: string;
  reference: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  courtName: string;
  venueName: string;
  timezone: string;
  paidPaise: number;
  totalPaise: number;
  payAtVenue: boolean;
  canCancel: boolean;
  refund: { totalPaise: number; percent: number; explanation: string } | null;
}

export async function fetchMyBookings(
  token: string,
): Promise<{ firstName: string | null; bookings: MyBooking[] }> {
  const wire = await call<{
    customer: { first_name: string | null };
    bookings: {
      booking_id: string;
      reference: string;
      status: BookingStatus;
      starts_at: string;
      ends_at: string;
      court_name: string;
      venue_name: string;
      timezone: string;
      paid_paise: number;
      total_paise?: number;
      payment?: 'online' | 'at_venue';
      can_cancel: boolean;
      refund_if_cancelled: { total_paise: number; percent: number; explanation: string } | null;
    }[];
  }>('/me/bookings', { headers: authHeader(token) });

  return {
    firstName: wire.customer.first_name,
    bookings: wire.bookings.map((b) => ({
      bookingId: b.booking_id,
      reference: b.reference,
      status: b.status,
      startsAt: b.starts_at,
      endsAt: b.ends_at,
      courtName: b.court_name,
      venueName: sanitizeVenueName(b.venue_name),
      timezone: b.timezone,
      paidPaise: b.paid_paise,
      totalPaise: b.total_paise ?? b.paid_paise,
      payAtVenue: b.payment === 'at_venue',
      canCancel: b.can_cancel,
      refund: b.refund_if_cancelled
        ? {
            totalPaise: b.refund_if_cancelled.total_paise,
            percent: b.refund_if_cancelled.percent,
            explanation: b.refund_if_cancelled.explanation,
          }
        : null,
    })),
  };
}

export async function cancelMyBooking(
  token: string,
  bookingId: string,
): Promise<{ refundPaise: number; explanation: string }> {
  const wire = await call<{ refund: { total_paise: number; explanation: string } }>(
    `/me/bookings/${encodeURIComponent(bookingId)}/cancel`,
    { method: 'POST', headers: authHeader(token) },
  );
  return { refundPaise: wire.refund.total_paise, explanation: wire.refund.explanation };
}

/* ------------------------------------------------------------------ */
/* Formatting — money and time are formatted here, at the UI edge only */
/* ------------------------------------------------------------------ */

export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: rupees % 1 ? 2 : 0 })}`;
}

/** "6:00 PM" — no leading zero, which is how people say it. */
export function formatClock(iso: string, timeZone = 'Asia/Kolkata'): string {
  return new Date(iso)
    .toLocaleTimeString('en-IN', { timeZone, hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s+/g, ' ') // browsers differ: some put a narrow no-break space before "pm"
    .toUpperCase();
}

/** "6:00 – 8:00 PM", or "11:00 AM – 1:00 PM" when the range crosses noon. */
export function formatRange(startIso: string, endIso: string, timeZone = 'Asia/Kolkata'): string {
  const start = formatClock(startIso, timeZone);
  const end = formatClock(endIso, timeZone);
  const [startTime, startHalf] = start.split(' ');
  const [, endHalf] = end.split(' ');
  return startHalf === endHalf ? `${startTime} – ${end}` : `${start} – ${end}`;
}

/** Hour of day (0-23) in the venue's zone, for grouping into morning/afternoon/evening. */
export function hourIn(iso: string, timeZone = 'Asia/Kolkata'): number {
  const hour = new Date(iso).toLocaleTimeString('en-GB', { timeZone, hour: '2-digit', hour12: false });
  return Number(hour.slice(0, 2)) % 24;
}

export function formatShortDate(iso: string, timeZone = 'Asia/Kolkata'): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatLongDate(iso: string, timeZone = 'Asia/Kolkata'): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
