import { NextResponse } from 'next/server';

const TURFOS_API_URL = process.env.TURFOS_API_URL || 'http://localhost:3000';
const TURFOS_API_KEY = process.env.TURFOS_API_KEY || 'tk_live_lfRJCbZ7byy4us4J8QaxeNH7sJaddAX0';
const TURFOS_VENUE_ID = process.env.TURFOS_VENUE_ID || '98944320-a082-427e-86d8-cbf811c83a1d';

function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]!;
    const activity = searchParams.get('sport') || searchParams.get('activity') || 'Pickleball';
    const filterCourtId = searchParams.get('court_id');

    const res = await fetch(
      `${TURFOS_API_URL}/api/v1/venues/${TURFOS_VENUE_ID}/availability?date=${date}`,
      {
        headers: {
          Authorization: `Bearer ${TURFOS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('TurfOS availability error:', res.status, errText);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch slots from engine' },
        { status: res.status }
      );
    }

    const turfData = await res.json();
    
    // Filter courts by activity
    let matchedCourts = (turfData.courts || []).filter((c: any) => {
      if (activity === 'Pickleball') return c.sport_type === 'Pickleball';
      if (activity === 'Studio') return c.sport_type === 'Studio';
      if (activity === 'Gym') return c.sport_type === 'Gym';
      if (activity === 'Indoor Games') return c.sport_type === 'PlayStation' || c.sport_type === 'Table Tennis';
      return true;
    });

    if (filterCourtId) {
      matchedCourts = matchedCourts.filter((c: any) => c.court_id === filterCourtId);
    }

    const allCourts = matchedCourts.map((c: any) => ({
      id: c.court_id,
      name: c.display_name,
      sport: c.sport_type,
    }));

    // Group distinct slot times across matched courts
    const slotMap = new Map<string, { startsAt: string; endsAt: string; courtSlots: Map<string, any> }>();

    for (const court of matchedCourts) {
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
    const items = [];

    for (const entry of Array.from(slotMap.values())) {
      const startDate = new Date(entry.startsAt);
      const isPast = startDate.getTime() <= now.getTime();

      // Convert to IST minutes (+05:30)
      const istDate = new Date(startDate.getTime() + (5.5 * 60 * 60 * 1000));
      const istHour = istDate.getUTCHours();
      const istMinute = istDate.getUTCMinutes();
      const startMin = istHour * 60 + istMinute;
      const endMin = startMin + 60;

      let period: 'morning' | 'afternoon' | 'evening' = 'morning';
      if (startMin >= 1020) period = 'evening'; // 5:00 PM onwards
      else if (startMin >= 720) period = 'afternoon'; // 12:00 PM onwards

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
      const assignedCourt = availableCourts[0] || allCourts[0] || { id: '', name: 'Main Court' };
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

    return NextResponse.json({
      ok: true,
      date,
      activity,
      slots: items,
      allCourts,
      totalArenas: turfData.courts?.length || 0,
    });
  } catch (err) {
    console.error('Public day slots bridge error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to fetch slots' }, { status: 500 });
  }
}
