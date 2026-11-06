'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/enquiries');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-white/60">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#c7a26a] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading Front Desk Operations Console...</p>
      </div>
    </div>
  );
}

