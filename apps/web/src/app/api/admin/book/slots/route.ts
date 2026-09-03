import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createDb,
  validateSession,
  getBookableCourts,
  getCourtHours,
  getActivePriceRules,
  bookings,
  blackouts,
  sql,
} from '@pavilion/db';
import {
  computeAvailability,
  IST_OFFSET_MINUTES,
  formatPaise,
  minutesToLabel,
  businessDate,
} from '@pavilion/core';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) {
      return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const selectedCourtId = searchParams.get('courtId');

    const now = new Date();
    const todayYmd = businessDate(now, IST_OFFSET_MINUTES, 5);
    const targetDate = dateParam || todayYmd;

    // 1. Fetch courts, hours, price rules
    const courtsList = await getBookableCourts(db);
    const hoursList = await getCourtHours(db);
    const priceRulesList = await getActivePriceRules(db);

    // 2. Fetch existing bookings on that date
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(sql`business_date = ${targetDate}::date AND status IN ('held', 'confirmed')`);

    // 3. Fetch blackouts
    const existingBlackouts = await db.select().from(blackouts);

    // 4. Compute availability through Core engine (R1 rule)
    const allSlots = computeAvailability({
      date: targetDate,
      courts: courtsList.map((c) => ({
        id: c.id,
        name: c.name,
        slotMinutes: c.slotMinutes,
        sortOrder: c.sortOrder,
        isBookable: c.isBookable,
      })),
      hours: hoursList.map((h) => ({
        courtId: h.courtId,
        weekday: h.weekday,
        openMinutes: h.openMinutes,
        closeMinutes: h.closeMinutes,
      })),
      priceRules: priceRulesList.map((r) => ({
        id: r.id,
        name: r.name,
        courtId: r.courtId,
        weekdays: r.weekdays ? (r.weekdays as number[]) : null,
        fromMinutes: r.fromMinutes,
        toMinutes: r.toMinutes,
        validFrom: r.validFrom,
        validTo: r.validTo,
        priority: r.priority,
        pricePaise: r.pricePaise,
        isActive: r.isActive,
        createdAt: r.createdAt.toISOString(),
      })),
      bookings: existingBookings.map((b) => ({
        id: b.id,
        reference: b.reference,
        courtId: b.courtId,
        startsAt: b.startsAt,
        endsAt: b.endsAt,
        status: b.status as 'held' | 'confirmed',
        expiresAt: b.expiresAt,
        channelCode: 'walkin',
        channelName: 'Walk-in',
        channelColourHex: '#000000',
        customerName: null,
        customerPhone: null,
        partnerReference: null,
        amountPaise: b.amountPaise,
        paidPaise: 0,
      })),
      blackouts: existingBlackouts.map((bl) => ({
        id: bl.id,
        courtId: bl.courtId,
        startsAt: bl.startsAt,
        endsAt: bl.endsAt,
        reason: bl.reason,
      })),
      now,
      offsetMinutes: IST_OFFSET_MINUTES,
    });

    // Default court to first if not specified
    const activeCourtId = selectedCourtId || courtsList[0]?.id;

    const filteredSlots = allSlots
      .filter((s) => !activeCourtId || s.courtId === activeCourtId)
      .map((s) => {
        const startMin = s.startMinutes;
        const endMin = s.startMinutes + 60;
        return {
          courtId: s.courtId,
          startMinutes: startMin,
          endMinutes: endMin,
          timeLabel: `${minutesToLabel(startMin)}–${minutesToLabel(endMin)}`,
          state: s.state,
          isFree: s.state === 'free',
          pricePaise: s.pricePaise ?? 80000,
          priceFormatted: s.pricePaise !== null ? formatPaise(s.pricePaise) : '—',
          startsAt: s.startsAt.toISOString(),
          endsAt: s.endsAt.toISOString(),
        };
      });

    return NextResponse.json({
      ok: true,
      targetDate,
      courts: courtsList.map((c) => ({ id: c.id, name: c.name })),
      selectedCourtId: activeCourtId,
      slots: filteredSlots,
      userRole: validated.user.role,
    });
  } catch (err) {
    console.error('Failed to compute book slots:', err);
    return NextResponse.json({ ok: false, error: 'Availability computation failed' }, { status: 500 });
  }
}
