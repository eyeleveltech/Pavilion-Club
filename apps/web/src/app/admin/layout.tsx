'use client';

import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminBottomTabs } from '@/components/admin/AdminBottomTabs';
import { KeyboardShortcutsProvider } from '@/components/admin/KeyboardShortcutsProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = {
    name: 'Front Desk',
    role: 'desk',
    phone: '+919043222345',
  };

  return (
    <KeyboardShortcutsProvider>
      <div className="min-h-screen bg-[#070e17] flex text-white font-sans antialiased">
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

