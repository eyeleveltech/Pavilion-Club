'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Download, Smartphone, X, Sparkles, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Do not show install prompt or attach listeners on admin routes
    if (pathname?.startsWith('/admin')) {
      return;
    }

    // 1. Check if already installed in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Already installed, do not show
    }

    // 2. Check if user dismissed it in this session
    const dismissed = sessionStorage.getItem('pavilion_pwa_dismissed');
    if (dismissed === 'true') {
      return;
    }

    // 3. Android / Chrome beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. iOS Safari detection
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIosDevice) {
      setIsIOS(true);
      // Show subtle banner after 3 seconds on iOS
      const timer = setTimeout(() => {
        if (!sessionStorage.getItem('pavilion_pwa_dismissed')) {
          setShowPrompt(true);
        }
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [pathname]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pavilion_pwa_dismissed', 'true');
  };

  // Do not render anything on admin routes or when prompt is inactive
  if (pathname?.startsWith('/admin') || (!showPrompt && !showIOSModal)) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Install Banner (Mobile & Desktop) */}
      {showPrompt && (
        <aside
          aria-label="Install mobile app"
          className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-surface border border-gold/40 shadow-xl rounded-2xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy text-gold flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
              P
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-navy text-xs">The Pavilion Club</span>
                <span className="text-[9px] font-bold text-gold-text bg-gold/15 px-1.5 py-0.2 rounded-full border border-gold/30">
                  App
                </span>
              </div>
              <p className="text-[11px] text-ink-soft mt-0.5">
                Install on your phone for instant 1-tap court booking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-navy hover:bg-navy/90 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span>Install</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close install banner"
              className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-2 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* iOS Safari "How to Add to Home Screen" Dialog */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-gold" />
                <h3 className="text-sm font-bold text-navy">Install on iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="text-ink-soft hover:text-navy p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-soft leading-relaxed">
              Install The Pavilion Club directly onto your home screen for a full-screen app experience:
            </p>

            <div className="p-3.5 bg-surface-2 rounded-xl border border-border space-y-2 text-xs text-ink">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline text-navy mx-0.5" /> at the bottom of Safari.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>Tap <strong>Add</strong> at top right. Done!</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-navy text-white font-bold text-xs hover:bg-navy/90 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
