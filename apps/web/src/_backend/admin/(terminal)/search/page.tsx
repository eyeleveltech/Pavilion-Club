import { cookies } from 'next/headers';
import { createDb, searchBookings, type SearchBookingResult } from '@pavilion/db';
import { SearchTerminal } from '@/components/admin/search/SearchTerminal';

export const dynamic = 'force-dynamic';

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || '';

  const db = createDb();
  let initialResults: SearchBookingResult[] = [];
  try {
    initialResults = await searchBookings(db, q);
  } catch (err) {
    console.error('Failed to prefetch search results:', err);
  }

  return (
    <SearchTerminal initialQuery={q} initialResults={initialResults} />
  );
}
