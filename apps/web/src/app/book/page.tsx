'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { BookShell } from '@/components/public/book/BookShell';
import { PublicBookingFlow } from '@/components/public/PublicBookingFlow';

function BookingContent() {
  const params = useSearchParams();
  return <PublicBookingFlow initialDate={params.get('date') ?? ''} />;
}

export default function PublicBookingPage() {
  return (
    <BookShell active="book">
      <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
        <BookingContent />
      </Suspense>
    </BookShell>
  );
}
