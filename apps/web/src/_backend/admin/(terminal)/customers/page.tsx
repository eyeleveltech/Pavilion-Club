import { cookies } from 'next/headers';
import { createDb, getCustomersList, type CustomerListItem } from '@pavilion/db';
import { CustomersListView } from '@/components/admin/customers/CustomersListView';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || '';

  const db = createDb();
  let initialCustomers: CustomerListItem[] = [];
  try {
    initialCustomers = await getCustomersList(db, q);
  } catch (err) {
    console.error('Failed to prefetch customers list:', err);
  }

  return (
    <CustomersListView initialCustomers={initialCustomers} />
  );
}
