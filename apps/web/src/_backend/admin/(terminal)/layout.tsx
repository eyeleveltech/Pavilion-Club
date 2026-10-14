import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createDb, validateSession } from '@pavilion/db';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminBottomTabs } from '@/components/admin/AdminBottomTabs';
import { KeyboardShortcutsProvider } from '@/components/admin/KeyboardShortcutsProvider';

export default async function AdminTerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('pavilion_session')?.value;

  if (!token) {
    redirect('/admin/login');
  }

  let currentUser = {
    name: 'Suresh Kumar',
    role: 'desk',
    phone: '+919876543210',
  };

  try {
    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) {
      redirect('/admin/login');
    }
    currentUser = {
      name: validated.user.name,
      role: validated.user.role,
      phone: validated.user.phone,
    };
  } catch (err) {
    console.error('Session validation error in admin shell:', err);
    redirect('/admin/login');
  }

  return (
    <KeyboardShortcutsProvider>
      <div className="min-h-screen bg-bg flex text-ink">
        {/* Desktop Left Sidebar (hidden below md) */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-16 md:pb-0">
          <AdminHeader user={currentUser} />
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
        </div>

        {/* Mobile Bottom Tabs (visible below md) */}
        <AdminBottomTabs />
      </div>
    </KeyboardShortcutsProvider>
  );
}
