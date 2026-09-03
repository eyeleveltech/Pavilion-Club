'use client';

import { useState } from 'react';
import { Radio, BarChart3 } from 'lucide-react';
import { NowBoard } from './NowBoard';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import type { NowBoardData, DashboardData } from '@pavilion/db';

interface AdminTerminalViewProps {
  userRole?: string | undefined;
  initialNowData?: NowBoardData | null;
  initialDashboardData?: DashboardData | null;
}

export function AdminTerminalView({
  userRole = 'desk',
  initialNowData,
  initialDashboardData,
}: AdminTerminalViewProps) {
  // Default to Now board for desk staff, Dashboard for managers and owners
  const [activeView, setActiveView] = useState<'now' | 'dashboard'>(
    userRole === 'desk' ? 'now' : 'dashboard'
  );

  return (
    <div className="space-y-6">
      {/* Segmented Top Switcher (Now Board vs Dashboard) */}
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="inline-flex p-1 rounded-lg bg-surface-2 border border-border text-xs font-semibold">
          <button
            onClick={() => setActiveView('now')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md transition ${
              activeView === 'now'
                ? 'bg-surface text-navy shadow-xs border border-border/60'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                activeView === 'now' ? 'text-ok animate-pulse' : 'text-ink-faint'
              }`}
            />
            <span>Live Now Board</span>
          </button>

          <button
            onClick={() => setActiveView('dashboard')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md transition ${
              activeView === 'dashboard'
                ? 'bg-surface text-navy shadow-xs border border-border/60'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <BarChart3
              className={`w-3.5 h-3.5 ${
                activeView === 'dashboard' ? 'text-gold' : 'text-ink-faint'
              }`}
            />
            <span>Executive Dashboard</span>
          </button>
        </div>

        <span className="text-[11px] text-ink-faint hidden sm:inline">
          Signed in as <strong className="uppercase">{userRole}</strong>
        </span>
      </div>

      {/* Render Active View */}
      {activeView === 'now' ? (
        <NowBoard initialData={initialNowData} userRole={userRole} />
      ) : (
        <ExecutiveDashboard initialData={initialDashboardData} />
      )}
    </div>
  );
}
