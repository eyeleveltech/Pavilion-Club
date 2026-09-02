import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="max-w-md p-8 bg-surface border border-border rounded shadow-sm">
        <p className="text-xs uppercase tracking-widest font-semibold text-accent mb-2">
          The
        </p>
        <h1 className="text-3xl font-bold tracking-wider text-navy uppercase mb-1">
          PAVILION
        </h1>
        <p className="text-sm italic font-medium text-ink-soft mb-6">
          Club · Pickleball Arena
        </p>

        <p className="text-sm text-ink-soft mb-8 leading-relaxed">
          Welcome to the Pavilion Club management system.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-navy hover:opacity-90 rounded transition-opacity"
          >
            Launch Admin Console
          </Link>
          <Link
            href="/admin/_theme"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-ink border border-border-strong hover:bg-surface-2 rounded transition-colors"
          >
            View Design System (_theme)
          </Link>
        </div>
      </div>
    </main>
  );
}
