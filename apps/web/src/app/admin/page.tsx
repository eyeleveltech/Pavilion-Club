import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen flex bg-bg">
      {/* Sidebar */}
      <aside className="w-64 bg-navy text-white flex flex-col justify-between p-6">
        <div>
          <div className="mb-8">
            <span className="text-xs uppercase tracking-widest text-gold font-semibold">
              The
            </span>
            <h1 className="text-xl font-bold tracking-wider uppercase text-white">
              PAVILION
            </h1>
            <p className="text-xs italic text-ink-on-dark/70">Club · Admin</p>
          </div>

          <nav className="space-y-1 text-sm font-medium">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded bg-gold text-navy font-semibold transition"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/admin/book"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-ink-on-dark hover:bg-white/10 transition"
            >
              🎾 Book a slot
            </Link>
            <Link
              href="/admin/calendar"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-ink-on-dark hover:bg-white/10 transition"
            >
              📅 Calendar
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-ink-on-dark hover:bg-white/10 transition"
            >
              📈 Reports
            </Link>
            <Link
              href="/admin/close"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-ink-on-dark hover:bg-white/10 transition"
            >
              🔒 Daily Close
            </Link>
            <Link
              href="/admin/cash"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-ink-on-dark hover:bg-white/10 transition"
            >
              💵 Cash Handover
            </Link>
          </nav>
        </div>

        <div className="border-t border-border-dark pt-4 text-xs space-y-2">
          <Link
            href="/admin/theme"
            className="block text-gold hover:underline font-medium"
          >
            🎨 Design System (_theme)
          </Link>
          <div className="text-ink-on-dark/60">
            Logged in: <span className="text-white font-medium">Front Desk (Suresh)</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-navy">Venue Dashboard</h2>
            <p className="text-xs text-ink-soft">
              Real-time court status & today&apos;s summary
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-ok-soft text-ok border border-ok/30">
              <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
              Engine Online · 3 Courts Active
            </span>
          </div>
        </header>

        {/* 4 Stat Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded bg-surface border border-border shadow-sm">
            <span className="text-xs text-ink-soft uppercase tracking-wider font-semibold">
              Today&apos;s Bookings
            </span>
            <div className="text-3xl font-bold text-navy mt-1">18</div>
            <span className="text-xs text-ok font-medium mt-1 inline-block">
              ↑ 100% capacity in peak hours
            </span>
          </div>

          <div className="p-5 rounded bg-surface border border-border shadow-sm">
            <span className="text-xs text-ink-soft uppercase tracking-wider font-semibold">
              Revenue (Today)
            </span>
            <div className="text-3xl font-bold text-navy mt-1 tabular-nums">
              ₹18,400
            </div>
            <span className="text-xs text-ink-soft mt-1 inline-block">
              UPI, Cash & Turf Town
            </span>
          </div>

          <div className="p-5 rounded bg-surface border border-border shadow-sm">
            <span className="text-xs text-ink-soft uppercase tracking-wider font-semibold">
              Active Holds
            </span>
            <div className="text-3xl font-bold text-warn mt-1">2</div>
            <span className="text-xs text-ink-soft mt-1 inline-block">
              10-min countdown running
            </span>
          </div>

          <div className="p-5 rounded bg-surface border border-border shadow-sm">
            <span className="text-xs text-ink-soft uppercase tracking-wider font-semibold">
              Available Slots
            </span>
            <div className="text-3xl font-bold text-ok mt-1">36</div>
            <span className="text-xs text-ink-soft mt-1 inline-block">
              Out of 54 daily slots
            </span>
          </div>
        </div>

        {/* Courts Overview */}
        <section className="bg-surface rounded border border-border p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-4">
            Courts Live Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded border border-border bg-surface-2 flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy">Court 1</p>
                <p className="text-xs text-ink-soft">Pickleball · 60m slots</p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-semibold bg-ok-soft text-ok border border-ok/20">
                Active
              </span>
            </div>
            <div className="p-4 rounded border border-border bg-surface-2 flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy">Court 2</p>
                <p className="text-xs text-ink-soft">Pickleball · 60m slots</p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-semibold bg-ok-soft text-ok border border-ok/20">
                Active
              </span>
            </div>
            <div className="p-4 rounded border border-border bg-surface-2 flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy">Court 3</p>
                <p className="text-xs text-ink-soft">Pickleball · 60m slots</p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-semibold bg-ok-soft text-ok border border-ok/20">
                Active
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
