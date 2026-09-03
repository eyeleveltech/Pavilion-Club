import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function PermissionDeniedPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-xl bg-surface border border-border shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-warn-soft text-warn flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-base font-bold text-navy">
            You don&apos;t have access to this page.
          </h1>
          <p className="text-xs text-ink-soft">
            Ask the owner if you need it.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-navy text-white text-xs font-semibold hover:opacity-90 transition shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Now</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
