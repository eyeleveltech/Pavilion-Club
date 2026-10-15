'use client';

import { BookShell } from '@/components/public/book/BookShell';
import { MyBookingsView } from '@/components/public/my-bookings/MyBookingsView';

export default function MyBookingsPage() {
  return (
    <BookShell active="mine">
      <MyBookingsView />
    </BookShell>
  );
}
