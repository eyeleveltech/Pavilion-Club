import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateCustomerSession, createPublicHold } from '@pavilion/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courtId, startsAt, endsAt, pricePaise } = body;

    if (!courtId || !startsAt || !endsAt || !pricePaise) {
      return NextResponse.json({ ok: false, error: 'Slot details are required' }, { status: 400 });
    }

    const db = createDb();
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_customer_session')?.value;
    const validated = token ? await validateCustomerSession(db, token) : null;

    const result = await createPublicHold(db, {
      courtId,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      pricePaise: Number(pricePaise),
      customerId: validated?.customer?.id || undefined,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    if (err.message?.includes('bookings_no_overlap') || err.code === '23P01') {
      return NextResponse.json(
        { ok: false, error: 'That slot is already booked or held. Please choose another slot.' },
        { status: 409 }
      );
    }
    console.error('Hold creation error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to reserve hold' }, { status: 500 });
  }
}
