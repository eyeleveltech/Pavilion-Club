'use client';

import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { MyBookingsView } from '@/components/public/my-bookings/MyBookingsView';

export default function MyBookingsPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />
      <main className="flex-1">
        <MyBookingsView
          initialCustomer={null}
          initialBookings={[]}
        />
      </main>
      <PublicFooter />
    </div>
  );
}
