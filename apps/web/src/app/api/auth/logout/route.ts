import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, destroySession } from '@pavilion/db';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const staffToken = cookieStore.get('pavilion_session')?.value;
    const customerToken = cookieStore.get('pavilion_customer_session')?.value;

    if (staffToken || customerToken) {
      const db = createDb();
      if (staffToken) {
        await destroySession(db, staffToken);
      }
      if (customerToken) {
        await destroySession(db, customerToken);
      }
    }

    cookieStore.delete('pavilion_session');
    cookieStore.delete('pavilion_customer_session');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
