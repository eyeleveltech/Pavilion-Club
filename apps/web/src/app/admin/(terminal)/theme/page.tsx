import Link from 'next/link';

export default function ThemePreviewPage() {
  return (
    <div className="max-w-5xl mx-auto p-8 space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent">
            Design System
          </span>
          <h1 className="text-2xl font-bold text-navy mt-1">
            Pavilion Club Theme Preview
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Verified tokens against <code>Brand Guidelines_PC_Apr 26.pdf</code>.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-xs px-3 py-2 border border-border rounded text-ink hover:bg-surface-2 transition"
        >
          ← Back to Admin
        </Link>
      </div>

      {/* 1. Palette */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-ink border-b border-border pb-2">
          1. Brand Palette & Grounds
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
          <div className="p-4 rounded border border-border bg-navy text-white flex flex-col justify-between h-24">
            <span className="font-semibold">MidnightBlue</span>
            <span className="font-mono">var(--navy)</span>
          </div>
          <div className="p-4 rounded border border-border bg-gold text-navy flex flex-col justify-between h-24">
            <span className="font-semibold">DarkKhaki (Gold)</span>
            <span className="font-mono">var(--gold)</span>
          </div>
          <div className="p-4 rounded border border-border bg-ivory text-navy flex flex-col justify-between h-24">
            <span className="font-semibold">Ivory</span>
            <span className="font-mono">var(--ivory)</span>
          </div>
          <div className="p-4 rounded border border-border bg-surface text-ink flex flex-col justify-between h-24">
            <span className="font-semibold">Surface White</span>
            <span className="font-mono">var(--surface)</span>
          </div>
          <div className="p-4 rounded border border-border bg-surface-2 text-ink flex flex-col justify-between h-24">
            <span className="font-semibold">Surface 2</span>
            <span className="font-mono">var(--surface-2)</span>
          </div>
        </div>
      </section>

      {/* 2. Semantic Colors */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-ink border-b border-border pb-2">
          2. Semantic States
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded bg-ok-soft border border-ok/20 text-ok font-medium">
            ✓ OK / Confirmed (var(--ok))
          </div>
          <div className="p-3 rounded bg-warn-soft border border-warn/20 text-warn font-medium">
            ⚠ Warning / Hold (var(--warn))
          </div>
          <div className="p-3 rounded bg-danger-soft border border-danger/20 text-danger font-medium">
            ✕ Danger / Cancelled (var(--danger))
          </div>
          <div className="p-3 rounded bg-info-soft border border-info/20 text-info font-medium">
            ℹ Info / Details (var(--info))
          </div>
        </div>
      </section>

      {/* 3. Channels */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-ink border-b border-border pb-2">
          3. Booking Channels
        </h2>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="px-3 py-1.5 rounded font-medium bg-ch-website text-white">
            Website (var(--ch-website))
          </span>
          <span className="px-3 py-1.5 rounded font-medium bg-ch-walkin text-white">
            Walk-in (var(--ch-walkin))
          </span>
          <span className="px-3 py-1.5 rounded font-medium bg-ch-phone text-white">
            Phone (var(--ch-phone))
          </span>
          <span className="px-3 py-1.5 rounded font-medium bg-ch-partner text-white">
            Turf Town (var(--ch-partner))
          </span>
          <span className="px-3 py-1.5 rounded font-medium bg-ch-admin text-white">
            Admin (var(--ch-admin))
          </span>
        </div>
      </section>

      {/* 4. Button Variants */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-ink border-b border-border pb-2">
          4. Buttons (Height 40px, Radius 6px)
        </h2>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <button className="h-10 px-4 rounded bg-navy text-white hover:opacity-90 transition">
            Primary (Main Action)
          </button>
          <button className="h-10 px-4 rounded bg-gold text-navy hover:opacity-90 transition">
            Gold (Public CTA)
          </button>
          <button className="h-10 px-4 rounded border border-border-strong text-ink hover:bg-surface-2 transition">
            Secondary (Cancel/Back)
          </button>
          <button className="h-10 px-4 rounded text-ink-soft hover:bg-surface-2 transition">
            Ghost
          </button>
          <button className="h-10 px-4 rounded border border-danger text-danger hover:bg-danger-soft transition">
            Danger
          </button>
          <button
            disabled
            className="h-10 px-4 rounded bg-navy text-white opacity-45 cursor-not-allowed"
          >
            Disabled
          </button>
        </div>
      </section>
    </div>
  );
}
