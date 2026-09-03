import { notFound } from 'next/navigation';
import { createDb, getCustomerDetail } from '@pavilion/db';
import { CustomerDetailView } from '@/components/admin/customers/CustomerDetailView';

export const dynamic = 'force-dynamic';

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = createDb();

  const data = await getCustomerDetail(db, id);
  if (!data) {
    notFound();
  }

  return (
    <CustomerDetailView initialData={data} />
  );
}
