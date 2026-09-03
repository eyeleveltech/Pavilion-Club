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
      bookingsList = await getCustomerBookingsList(db, validated.customer.id);
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
