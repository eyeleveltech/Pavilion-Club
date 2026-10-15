import { Suspense } from 'react';

import { BookShell } from '@/components/public/book/BookShell';
import { BookingPassClient } from '@/components/public/BookingPassClient';

export default function PassPage() {
  return (
    <BookShell active="book">
      <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
        <BookingPassClient />
      </Suspense>
    </BookShell>
  );
}
