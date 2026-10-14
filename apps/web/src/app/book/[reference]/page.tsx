import { Suspense } from 'react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { BookingPassClient } from '@/components/public/BookingPassClient';
import { Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />
      <main className="flex-1">
        <Suspense fallback={
          <div className="max-w-xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-gold animate-spin" />
            <p className="text-sm text-ink-soft">Loading Match Pass...</p>
          </div>
        }>
          <BookingPassClient initialRef={reference} />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
