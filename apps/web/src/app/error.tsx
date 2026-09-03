'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error caught by ErrorBoundary:', error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-danger-soft text-danger flex items-center justify-center shadow-xs">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h2 className="text-base font-bold text-navy">This page could not load</h2>
        <p className="text-xs text-ink-soft">
          We encountered an unexpected issue while loading this section. Your existing form data is preserved.
        </p>
      </div>

      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold hover:opacity-90 transition shadow-xs"
      >
        <RefreshCw className="w-3.5 h-3.5 text-gold" />
        <span>Try again</span>
      </button>
    </div>
  );
}
