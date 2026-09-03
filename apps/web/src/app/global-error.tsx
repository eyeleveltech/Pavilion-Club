'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global root error caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-bg text-ink min-h-screen flex items-center justify-center p-4">
        <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full text-center space-y-5 shadow-lg">
          <div className="w-12 h-12 rounded-full bg-danger-soft text-danger flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h1 className="text-lg font-bold text-navy">The Pavilion Club</h1>
            <p className="text-xs text-ink-soft">
              An unexpected system error occurred. Please refresh or try again.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-navy text-white text-xs font-bold hover:opacity-90 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gold" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
