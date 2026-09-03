'use client';

import { useState } from 'react';
import { Users, Plus, ShieldCheck, ShieldAlert, Loader2, Key } from 'lucide-react';

interface StaffUserItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  deactivatedAt: string | null;
}

interface StaffSettingsViewProps {
  staff: StaffUserItem[];
  currentUserId: string;
}

export function StaffSettingsView({ staff: initialStaff, currentUserId }: StaffSettingsViewProps) {
  const [staff, setStaff] = useState<StaffUserItem[]>(initialStaff);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'desk' | 'manager' | 'owner'>('desk');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/settings/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email: email || undefined,
          role,
          passwordPlain: password,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        const refreshed = await fetch('/api/admin/settings/staff');
        if (refreshed.ok) {
          const json = await refreshed.json();
          setStaff(json.staff || []);
        }
      }
    } catch (err) {
      console.error('Failed to create staff:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/settings/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentActive }),
      });
      if (res.ok) {
        setStaff((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u))
        );
      }
    } catch (err) {
      console.error('Failed to toggle staff status:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-navy">Staff & Access Permissions</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Reception desk, managers, and venue owners with role-based access control
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-navy text-white text-xs font-bold hover:opacity-90 transition shadow-xs"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {showAddModal && (
        <div className="p-5 rounded-lg border border-navy/30 bg-surface shadow-md space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
            Add New Staff Account
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-ink-soft mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Staff Member Name"
                className="w-full px-3 py-1.5 rounded border border-border bg-surface text-ink"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink-soft mb-1">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-1.5 rounded border border-border bg-surface text-ink font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink-soft mb-1">Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded border border-border bg-surface text-ink"
              >
                <option value="desk">Desk (Front counter & slot booking)</option>
                <option value="manager">Manager (Reports & pricing overrides)</option>
                <option value="owner">Owner (Full admin & settings access)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink-soft mb-1">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@pavilion.club"
                className="w-full px-3 py-1.5 rounded border border-border bg-surface text-ink"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink-soft mb-1">Temporary Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full px-3 py-1.5 rounded border border-border bg-surface text-ink font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 rounded border border-border text-xs text-ink-soft hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting || !name || !phone || !password}
              onClick={handleCreate}
              className="px-4 py-1.5 rounded bg-navy text-white text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Staff Accounts List */}
      <div className="border border-border rounded-lg bg-surface shadow-xs overflow-hidden divide-y divide-border">
        {staff.map((u) => (
          <div
            key={u.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-navy text-sm">{u.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-2 text-ink uppercase">
                  {u.role}
                </span>
                {u.isActive ? (
                  <span className="text-ok font-semibold text-[10px]">Active</span>
                ) : (
                  <span className="text-danger font-semibold text-[10px]">Deactivated</span>
                )}
              </div>
              <p className="text-ink-soft font-mono">{u.phone} {u.email && `· ${u.email}`}</p>
            </div>

            {u.id !== currentUserId && (
              <button
                onClick={() => handleToggleActive(u.id, u.isActive)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                  u.isActive
                    ? 'border border-danger/30 text-danger hover:bg-danger-soft'
                    : 'border border-ok/30 text-ok hover:bg-ok-soft'
                }`}
              >
                {u.isActive ? 'Deactivate' : 'Reactivate'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
