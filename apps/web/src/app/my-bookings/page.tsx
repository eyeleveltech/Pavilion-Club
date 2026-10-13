import { cookies } from 'next/headers';
import {
  createDb,
  validateCustomerSession,
  getCustomerBookingsList,
} from '@pavilion/db';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { MyBookingsView } from '@/components/public/my-bookings/MyBookingsView';

export const dynamic = 'force-dynamic';

const TURFOS_API_URL = process.env.TURFOS_API_URL || 'http://localhost:3000';
const TURFOS_API_KEY = process.env.TURFOS_API_KEY || 'tk_live_lfRJCbZ7byy4us4J8QaxeNH7sJaddAX0';

export default async function MyBookingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('pavilion_customer_session')?.value;

  let customer = null;
  let bookingsList: any[] = [];

  if (token) {
    const db = createDb();
    const validated = await validateCustomerSession(db, token);
    if (validated) {
      customer = validated.customer;

      // 1. Fetch live bookings from TurfOS engine
      const cleanPhone = (validated.customer.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone) {
        try {
          const res = await fetch(`${TURFOS_API_URL}/api/v1/bookings?phone=${cleanPhone}`, {
            headers: {
              Authorization: `Bearer ${TURFOS_API_KEY}`,
            },
            cache: 'no-store',
          });
          if (res.ok) {
            const json = await res.json();
            if (json.ok && Array.isArray(json.bookings)) {
              bookingsList = json.bookings;
            }
          }
        } catch (err) {
          console.error('Failed to fetch bookings from TurfOS:', err);
        }
      }

      // 2. Fallback to local DB if TurfOS returned no records
      if (bookingsList.length === 0) {
        bookingsList = await getCustomerBookingsList(db, validated.customer.id);
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />
      <main className="flex-1">
        <MyBookingsView
          initialCustomer={customer}
          initialBookings={bookingsList}
        />
      </main>
      <PublicFooter />
    </div>
  );
}
