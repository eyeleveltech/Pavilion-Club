import { redirect } from 'next/navigation';

export default function AdminCashRedirectPage() {
  redirect('/admin/close');
}
