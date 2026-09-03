'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Keyboard, X } from 'lucide-react';

const SHORTCUTS = [
  { key: '/', desc: 'Focus global search' },
  { key: 'B', desc: 'Book a slot' },
  { key: 'T', desc: 'Today calendar grid' },
  { key: 'N', desc: 'Live Now Board' },
  { key: 'Esc', desc: 'Close dialog / panel' },
  { key: '?', desc: 'Show keyboard shortcuts' },
];

export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in form inputs, do not trigger single-key shortcuts
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target as HTMLElement)?.isContentEditable;

      if (e.key === 'Escape') {
        if (showHelpModal) {
          setShowHelpModal(false);
          e.preventDefault();
        }
        return;
      }

      if (isInput) return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowHelpModal((prev) => !prev);
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('admin-header-search-input') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
        } else {
          router.push('/admin/search');
        }
        return;
      }

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        router.push('/admin/book');
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        router.push('/admin/calendar');
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        router.push('/admin');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, showHelpModal]);

  return (
    <>
      {children}

      {/* Floating Keyboard Shortcuts Trigger in Bottom-Right for mouse users */}
      <button
        onClick={() => setShowHelpModal(true)}
        className="fixed bottom-4 right-4 z-40 hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-navy/80 hover:bg-navy text-gold text-[11px] font-mono shadow-md backdrop-blur-xs transition"
        title="Keyboard Shortcuts (?)"
      >
        <Keyboard className="w-3.5 h-3.5" />
        <span>?</span>
      </button>

      {/* Shortcuts Modal Dialog */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-gold" />
                <h2 className="text-sm font-bold tracking-tight text-navy">
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded text-ink-faint hover:text-ink hover:bg-surface-2 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-border text-xs">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="py-2.5 flex items-center justify-between">
                  <span className="text-ink">{s.desc}</span>
                  <kbd className="px-2 py-1 rounded bg-surface-2 border border-border font-mono font-bold text-navy text-[11px] shadow-xs">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center text-[11px] text-ink-faint">
              Press <kbd className="font-mono text-navy font-bold">Esc</kbd> anytime to dismiss
            </div>
          </div>
        </div>
      )}
    </>
  );
}
