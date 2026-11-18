'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CopyCodeContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '218176';
  const [copied, setCopied] = useState(false);

  const doCopy = (val: string) => {
    if (!val) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(val).then(() => setCopied(true));
    } else {
      try {
        const el = document.createElement('input');
        el.value = val;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
      } catch {
        // Fallback
      }
    }
  };

  useEffect(() => {
    doCopy(code);
  }, [code]);

  return (
    <div className="w-full max-w-[440px] bg-[#0B192C] border border-[#C9A96E] rounded-[20px] p-9 text-center shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(201,169,110,0.12)] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
      
      <Link href="/" className="inline-block mb-4">
        <img
          src="/pavilion_logo_reversed.png"
          alt="The Pavilion Club"
          className="mx-auto max-w-[160px] h-auto block"
        />
      </Link>
      <div className="w-[60px] h-[1px] bg-[#C9A96E] mx-auto mb-5 opacity-70" />

      <div className="text-[10px] font-bold tracking-[3px] uppercase text-[#C9A96E] mb-2">
        SINGLE-USE PASSCODE
      </div>
      <h1 className="text-[22px] font-bold tracking-tight text-white mb-2">
        Access Code
      </h1>
      <p className="text-[13px] text-[#8E9BAE] leading-relaxed mb-6">
        Use this passcode to sign in on your login screen.
      </p>

      {/* Code box */}
      <button
        type="button"
        onClick={() => doCopy(code)}
        className="w-full bg-[#060C14] border border-[#C9A96E]/60 rounded-[14px] py-5 px-4 mb-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.6),0_0_28px_rgba(201,169,110,0.16)] transition-all hover:border-[#E5C378] hover:shadow-[0_0_32px_rgba(201,169,110,0.28)]"
        title="Click to copy again"
      >
        <span className="font-mono text-[42px] font-extrabold tracking-[12px] text-[#E5C378] ml-3 select-all block drop-shadow-[0_0_16px_rgba(229,195,120,0.45)]">
          {code}
        </span>
      </button>

      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/15 border border-emerald-500/40 rounded-full text-[12px] font-semibold text-emerald-400 mb-6 transition-all">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{copied ? `✓ Code ${code} copied to clipboard!` : 'Copying code…'}</span>
      </div>

      <div className="flex flex-col gap-2.5 mt-2">
        <button
          type="button"
          onClick={() => doCopy(code)}
          className="w-full py-3.5 px-6 bg-gradient-to-br from-[#E5C378] to-[#C9A96E] text-[#0B192C] font-bold text-[13px] rounded-lg tracking-wide shadow-[0_6px_20px_rgba(201,169,110,0.35)] hover:shadow-[0_8px_24px_rgba(201,169,110,0.45)] transition-all"
        >
          📋 Copy Again
        </button>
        <Link
          href="/"
          className="w-full py-3 px-6 bg-[#C9A96E]/10 text-[#C9A96E] font-semibold text-[12px] rounded-lg border border-[#C9A96E]/30 hover:bg-[#C9A96E]/20 transition-all"
        >
          Go to The Pavilion Club ⟶
        </Link>
      </div>

      <p className="mt-6 text-[11px] text-[#5A6B7C] leading-relaxed">
        Paste this code into the verification input.<br />
        The Pavilion Club · Mogappair East, Chennai
      </p>
    </div>
  );
}

export default function CopyCodePage() {
  return (
    <div className="min-h-screen bg-[#060D17] text-white flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-[#C9A96E]">Loading…</div>}>
        <CopyCodeContent />
      </Suspense>
    </div>
  );
}
