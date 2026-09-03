'use client';

import { useState } from 'react';
import { Handshake, Key, Percent, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface PartnerChannelItem {
  id: string;
  code: string;
  name: string;
  colourHex: string;
  isActive: boolean;
  commissionPercent: number;
  apiKeys: {
    id: string;
    name: string;
    keyPrefix: string;
    requestsPerMinute: number;
    lastUsedAt: string | null;
    revokedAt: string | null;
  }[];
}

interface PartnersSettingsViewProps {
  partners: PartnerChannelItem[];
}

export function PartnersSettingsView({ partners: initialPartners }: PartnersSettingsViewProps) {
  const [partners, setPartners] = useState<PartnerChannelItem[]>(initialPartners);
  const [activePartnerId, setActivePartnerId] = useState(initialPartners[0]?.id || '');
  const [commissionPercent, setCommissionPercent] = useState<number>(
    initialPartners[0]?.commissionPercent ?? 15
  );
  const [isSaving, setIsSaving] = useState(false);
  const [newKeyIssued, setNewKeyIssued] = useState<string | null>(null);

  const activePartner = partners.find((p) => p.id === activePartnerId) || partners[0];

  // Dynamic Commission Example Math
  const exampleBookingPaise = 120000; // ₹1,200
  const partnerCutPaise = Math.round((exampleBookingPaise * commissionPercent) / 100);
  const venueCutPaise = exampleBookingPaise - partnerCutPaise;

  const handleSaveCommission = async () => {
    if (!activePartner) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'commission',
          channelId: activePartner.id,
          commissionPercent,
        }),
      });
      if (res.ok) {
        setPartners((prev) =>
          prev.map((p) => (p.id === activePartner.id ? { ...p, commissionPercent } : p))
        );
      }
    } catch (err) {
      console.error('Failed to save commission:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleIssueKey = async () => {
    if (!activePartner) return;
    try {
      const res = await fetch('/api/admin/settings/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'issue_key',
          channelId: activePartner.id,
          name: `${activePartner.name} Live Integration`,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setNewKeyIssued(json.fullKey);
        // Refresh partner details
        const refreshed = await fetch('/api/admin/settings/partners');
        if (refreshed.ok) {
          const rJson = await refreshed.json();
          setPartners(rJson.partners || []);
        }
      }
    } catch (err) {
      console.error('Failed to issue key:', err);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      const res = await fetch('/api/admin/settings/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_key',
          keyId,
        }),
      });
      if (res.ok) {
        setPartners((prev) =>
          prev.map((p) => ({
            ...p,
            apiKeys: p.apiKeys.map((k) =>
              k.id === keyId ? { ...k, revokedAt: new Date().toISOString() } : k
            ),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to revoke key:', err);
    }
  };

  if (!activePartner) {
    return (
      <div className="p-8 text-center text-xs text-ink-faint">
        No partner channels configured.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-navy">{activePartner.name} Integration</h2>
        <p className="text-xs text-ink-soft mt-0.5">
          Partner channel settings, deducted commission, and secure API keys
        </p>
      </div>

      {/* New Key Alert (Shows Once) */}
      {newKeyIssued && (
        <div className="p-4 rounded-lg bg-ok-soft text-ok border border-ok/30 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>New API Key Generated! Copy it now (will not be displayed again):</span>
          </div>
          <div className="p-2 bg-surface rounded border border-border font-mono text-xs text-navy select-all">
            {newKeyIssued}
          </div>
        </div>
      )}

      {/* Commission Setting */}
      <section className="p-5 rounded-lg bg-surface border border-border shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
          <Percent className="w-4 h-4 text-gold" />
          <span>Partner Commission</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ink-soft">
              Commission they deduct (%):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 0)}
                className="w-32 px-3 py-1.5 rounded border border-border bg-surface text-ink text-sm font-mono font-bold"
              />
              <button
                onClick={handleSaveCommission}
                disabled={isSaving}
                className="px-4 py-1.5 rounded bg-navy text-white text-xs font-bold hover:opacity-90 transition"
              >
                {isSaving ? 'Saving...' : 'Save Rate'}
              </button>
            </div>
          </div>

          <div className="p-4 rounded bg-surface-2 border border-border text-xs text-ink space-y-1">
            <span className="font-semibold text-ink-soft uppercase text-[10px] tracking-wider block">
              Live Settlement Formula:
            </span>
            <div className="font-semibold text-navy">
              A ₹1,200 booking → they keep ₹{(partnerCutPaise / 100).toFixed(0)} → you receive ₹{(venueCutPaise / 100).toFixed(0)}
            </div>
          </div>
        </div>
      </section>

      {/* API Keys */}
      <section className="p-5 rounded-lg bg-surface border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
            <Key className="w-4 h-4 text-gold" />
            <span>Active API Keys</span>
          </h3>

          <button
            onClick={handleIssueKey}
            className="px-3 py-1.5 rounded bg-navy text-white text-xs font-bold hover:opacity-90 transition"
          >
            Issue New Key
          </button>
        </div>

        <div className="divide-y divide-border text-xs">
          {activePartner.apiKeys.length === 0 ? (
            <div className="p-4 text-ink-faint text-center">No API keys issued yet.</div>
          ) : (
            activePartner.apiKeys.map((k) => (
              <div key={k.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-navy">{k.keyPrefix}...</span>
                    <span className="text-ink-soft">({k.name})</span>
                    {k.revokedAt ? (
                      <span className="text-danger font-bold text-[10px]">REVOKED</span>
                    ) : (
                      <span className="text-ok font-bold text-[10px]">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-faint">Rate limit: {k.requestsPerMinute} req/min</p>
                </div>

                {!k.revokedAt && (
                  <button
                    onClick={() => handleRevokeKey(k.id)}
                    className="px-2.5 py-1 rounded border border-danger/30 text-danger text-[11px] font-semibold hover:bg-danger-soft"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
