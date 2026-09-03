import { businessDate, IST_OFFSET_MINUTES } from '@pavilion/core';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicBookingFlow } from '@/components/public/PublicBookingFlow';

export const dynamic = 'force-dynamic';

export default async function PublicBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const todayYmd = businessDate(new Date(), IST_OFFSET_MINUTES, 5);
  const selectedDate = params.date || todayYmd;

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />
      <main className="flex-1">
        <PublicBookingFlow initialDate={selectedDate} />
      </main>
      <PublicFooter />
    </div>
  );
}
