'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicBookingFlow } from '@/components/public/PublicBookingFlow';
import { Loader2 } from 'lucide-react';

function BookingContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const now = new Date();
  const todayYmd = now.toISOString().split('T')[0] ?? '';
  const selectedDate: string = (dateParam && dateParam.trim().length > 0) ? dateParam : todayYmd;

  return <PublicBookingFlow initialDate={selectedDate} />;
}

export default function PublicBookingPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />
      <main className="flex-1">
        <Suspense fallback={
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        }>
          <BookingContent />
        </Suspense>
      </main>
      <PublicFooter className="mt-0" />
    </div>
  );
}
