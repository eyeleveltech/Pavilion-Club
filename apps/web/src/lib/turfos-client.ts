// Client-side Direct TurfOS Integration for Static Pavilion Frontend
export const TURFOS_API_URL =
  process.env.NEXT_PUBLIC_TURFOS_API_URL || 'http://localhost:3000';
export const TURFOS_API_KEY =
  process.env.NEXT_PUBLIC_TURFOS_API_KEY || 'tk_live_lfRJCbZ7byy4us4J8QaxeNH7sJaddAX0';
export const TURFOS_VENUE_ID =
  process.env.NEXT_PUBLIC_TURFOS_VENUE_ID || '98944320-a082-427e-86d8-cbf811c83a1d';

export interface PublicDaySlotItem {
  startsAt: string;
  endsAt: string;
  startMinutes: number;
  endMinutes: number;
  timeLabel: string;
  period: 'morning' | 'afternoon' | 'evening';
  pricePaise: number;
  priceRupees: number;
  isPeak: boolean;
  assignedCourtId: string;
  assignedCourtName: string;
  availableCourts: { id: string; name: string }[];
  isAvailable: boolean;
  isPast?: boolean;
}

function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export async function fetchLiveSlots(date: string) {
  const res = await fetch(
    `${TURFOS_API_URL}/api/v1/venues/${TURFOS_VENUE_ID}/availability?date=${date}`,
    {
      headers: {
        Authorization: `Bearer ${TURFOS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch availability from TurfOS engine');
  }

  const turfData = await res.json();
  const allCourts = (turfData.courts || []).map((c: any) => ({
    id: c.court_id,
    name: c.display_name,
  }));

  const slotMap = new Map<string, { startsAt: string; endsAt: string; courtSlots: Map<string, any> }>();

  for (const court of turfData.courts || []) {
    for (const slot of court.slots || []) {
      if (!slotMap.has(slot.starts_at)) {
        slotMap.set(slot.starts_at, {
          startsAt: slot.starts_at,
          endsAt: slot.ends_at,
          courtSlots: new Map(),
        });
      }
      slotMap.get(slot.starts_at)!.courtSlots.set(court.court_id, slot);
    }
  }

  const now = new Date();
  const items: PublicDaySlotItem[] = [];

  for (const entry of Array.from(slotMap.values())) {
    const startDate = new Date(entry.startsAt);
    const isPast = startDate.getTime() <= now.getTime();

    // Convert to IST minutes (+05:30)
    const istDate = new Date(startDate.getTime() + 5.5 * 60 * 60 * 1000);
    const istHour = istDate.getUTCHours();
    const istMinute = istDate.getUTCMinutes();
    const startMin = istHour * 60 + istMinute;
    const endMin = startMin + 60;

    let period: 'morning' | 'afternoon' | 'evening' = 'morning';
    if (startMin >= 1020) period = 'evening';
    else if (startMin >= 720) period = 'afternoon';

    const availableCourts: { id: string; name: string }[] = [];
    let samplePricePaise = 80000;

    for (const court of allCourts) {
      const courtSlot = entry.courtSlots.get(court.id);
      if (courtSlot && courtSlot.available && !isPast) {
        availableCourts.push(court);
        if (courtSlot.price_paise) samplePricePaise = courtSlot.price_paise;
      }
    }

    const isAvailable = availableCourts.length > 0;
    const assignedCourt = availableCourts[0] || allCourts[0] || { id: '', name: 'Court 1' };
    const priceRupees = Math.round(samplePricePaise / 100);

    items.push({
      startsAt: entry.startsAt,
      endsAt: entry.endsAt,
      startMinutes: startMin,
      endMinutes: endMin,
      timeLabel: `${minutesToLabel(startMin)} - ${minutesToLabel(endMin)}`,
      period,
      pricePaise: samplePricePaise,
      priceRupees,
      isPeak: priceRupees > 800,
      assignedCourtId: assignedCourt.id,
      assignedCourtName: assignedCourt.name,
      availableCourts,
      isAvailable,
      isPast,
    });
  }

  items.sort((a, b) => a.startMinutes - b.startMinutes);
  return { ok: true, date, slots: items, allCourts };
}

export async function createHoldLock(params: {
  courtId: string;
  startsAt: string;
  endsAt: string;
  phone?: string;
  name?: string;
}) {
  const durationHours = Math.max(
    1,
    Math.round((new Date(params.endsAt).getTime() - new Date(params.startsAt).getTime()) / (3600 * 1000))
  );

  const res = await fetch(`${TURFOS_API_URL}/api/v1/holds`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TURFOS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      court_id: params.courtId,
      starts_at: new Date(params.startsAt).toISOString(),
      hours: durationHours,
      customer: {
        phone: params.phone || '9999999999',
        name: params.name || 'Guest Player',
      },
    }),
  });

  if (!res.ok) {
    if (res.status === 409) {
      return { ok: false, error: 'That slot is already booked or held. Please choose another slot.' };
    }
    const err = await res.text();
    return { ok: false, error: err || 'Failed to hold slot' };
  }

  const data = await res.json();
  return {
    ok: true,
    reference: data.booking_id,
    holdReference: data.booking_id,
    bookingId: data.booking_id,
    expiresAt: data.expires_at,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    slotAmountPaise: data.slot_amount_paise,
    totalPaise: data.total_paise,
  };
}

export async function confirmBooking(params: {
  bookingId: string;
  name: string;
  phone: string;
  email?: string;
}) {
  const res = await fetch(`${TURFOS_API_URL}/api/v1/bookings/${params.bookingId}/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TURFOS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer_name: params.name,
      customer_phone: params.phone,
      customer_email: params.email || '',
    }),
  });

  if (!res.ok) {
    return { ok: false, error: 'Failed to confirm booking on engine' };
  }

  const data = await res.json();
  return {
    ok: true,
    booking: {
      id: data.booking_id,
      reference: data.booking_id,
      status: data.status,
    },
  };
}

export async function fetchBookingPass(reference: string) {
  const res = await fetch(`${TURFOS_API_URL}/api/v1/bookings/${reference}`, {
    headers: {
      Authorization: `Bearer ${TURFOS_API_KEY}`,
    },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return {
    id: data.booking_id,
    reference: data.booking_id,
    businessDate: data.business_date,
    startsAt: new Date(data.starts_at),
    endsAt: new Date(data.ends_at),
    amountPaise: data.amounts?.slot_paise || 80000,
    status: data.status,
    courtName: data.court?.display_name || 'Court 1',
    customerName: data.customer?.name || 'Player',
    customerPhone: data.customer?.phone || '',
  };
}

export interface PublicMonthDayAvailability {
  date: string;
  dayOfMonth: number;
  weekday: number;
  status: 'available' | 'sold_out' | 'closed' | 'past' | 'free' | 'filling' | string;
  isAvailable?: boolean;
}


