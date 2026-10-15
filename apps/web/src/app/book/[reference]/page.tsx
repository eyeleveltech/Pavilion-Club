import { Suspense } from 'react';

import { BookShell } from '@/components/public/book/BookShell';
import { BookingPassClient } from '@/components/public/BookingPassClient';

// A static export can only serve the paths it was built with. Real pass links
// use /book/pass?ref=<id>; these two keep older links from 404ing.
export function generateStaticParams() {
  return [{ reference: 'pass' }, { reference: 'confirmed' }];
}

export default async function BookingPassPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  return (
    <BookShell active="book">
      <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
        <BookingPassClient initialRef={reference} />
      </Suspense>
    </BookShell>
  );
}
