'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('+919876543210');
  const [password, setPassword] = useState('Desk@Pavilion2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      // Success - navigate to admin dashboard
      router.push('/admin');
      router.refresh();
    } catch {
      setError('A network error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-widest font-semibold text-accent mb-1">
          The
        </p>
        <h1 className="text-3xl font-bold tracking-wider text-navy uppercase">
          PAVILION
        </h1>
        <p className="text-sm italic font-medium text-ink-soft">
          Club · Front Desk Terminal
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-surface border border-border rounded-lg shadow-sm p-8">
        <div className="border-b border-border pb-4 mb-6">
          <h2 className="text-lg font-semibold text-navy">Staff Sign In</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Secured terminal with Argon2id encryption & brute-force lock
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded bg-danger-soft border border-danger/30 text-danger text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5"
            >
              Phone or Email
            </label>
            <input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="+919876543210"
              className="w-full h-10 px-3 rounded border border-border text-sm text-ink bg-surface focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10 px-3 rounded border border-border text-sm text-ink bg-surface focus:outline-none focus:border-navy"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded bg-navy text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Terminal'}
          </button>
        </form>

        {/* Quick Fill for Fast Testing */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-ink-soft font-medium mb-2.5">
            Quick fill test accounts:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setIdentifier('+919876543210');
                setPassword('Desk@Pavilion2026');
              }}
              className="p-2 rounded border border-border hover:bg-surface-2 text-ink text-left transition"
            >
              <span className="font-semibold block text-navy">Suresh (Desk)</span>
              <span className="text-ink-soft block font-mono text-[10px]">
                +919876543210
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIdentifier('+919876543212');
                setPassword('Owner@Pavilion2026');
              }}
              className="p-2 rounded border border-border hover:bg-surface-2 text-ink text-left transition"
            >
              <span className="font-semibold block text-navy">Jayaraman (Owner)</span>
              <span className="text-ink-soft block font-mono text-[10px]">
                +919876543212
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
