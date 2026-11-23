'use client';

import { submitEnquiry } from './turfos-client';

export interface PickleballEnquiry {
  id: string;
  type: 'pickleball';
  reference: string;
  name: string;
  phone: string;
  email: string;
  plan: string;
  sessions: number;
  sessionsUsed: number;
  lastCheckIn?: string | undefined;
  amountPaise: number;
  amountDisplay: string;
  paymentId: string;
  status: 'Paid & Active' | 'Pending Verification' | 'Active Member (12h Quota)' | 'Pay at Desk';
  notes?: string;
  createdAt: string;
  createdDisplay: string;
}

export interface StudioEnquiry {
  id: string;
  type: 'studio';
  reference: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  cohort: string;
  day: string;
  timeSlot: string;
  level: string;
  notes?: string;
  status: 'New' | 'Contacted' | 'Trial Scheduled' | 'Enrolled';
  createdAt: string;
  createdDisplay: string;
}

const STORAGE_KEY_PICKLEBALL = 'pavilion_pickleball_enquiries_v1';
const STORAGE_KEY_STUDIO = 'pavilion_studio_enquiries_v1';
export const ENQUIRY_UPDATE_EVENT = 'pavilion_enquiry_updated';

// Initial realistic seed records for desk operations
const SEED_PICKLEBALL: PickleballEnquiry[] = [
  {
    id: 'pb-seed-1',
    type: 'pickleball',
    reference: 'PB-MEM-4821',
    name: 'Karthik Narayanan',
    phone: '9840123456',
    email: 'karthik.narayanan@gmail.com',
    plan: 'Inaugural Shared-Play Membership (12 Hours)',
    sessions: 12,
    sessionsUsed: 2,
    lastCheckIn: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    amountPaise: 236000,
    amountDisplay: '₹2,360.00',
    paymentId: 'pay_P192837461',
    status: 'Paid & Active',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    createdDisplay: '45 mins ago',
  },
  {
    id: 'pb-seed-2',
    type: 'pickleball',
    reference: 'PB-MEM-7739',
    name: 'Ananya Sundaram',
    phone: '9962055621',
    email: 'ananya.sundaram@outlook.com',
    plan: 'Inaugural Shared-Play Membership (12 Hours)',
    sessions: 12,
    sessionsUsed: 3,
    lastCheckIn: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    amountPaise: 236000,
    amountDisplay: '₹2,360.00',
    paymentId: 'pay_P284759302',
    status: 'Active Member (12h Quota)',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    createdDisplay: '3 hours ago',
  },
  {
    id: 'pb-seed-3',
    type: 'pickleball',
    reference: 'PB-MEM-9104',
    name: 'Vikram Chandrasekar',
    phone: '9791044521',
    email: 'vikram.c@gmail.com',
    plan: 'Inaugural Shared-Play Membership (12 Hours)',
    sessions: 12,
    sessionsUsed: 0,
    amountPaise: 236000,
    amountDisplay: '₹2,360.00',
    paymentId: 'pay_P394857201',
    status: 'Pending Verification',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    createdDisplay: '6 hours ago',
  },
];

const SEED_STUDIO: StudioEnquiry[] = [
  {
    id: 'stu-seed-1',
    type: 'studio',
    reference: 'STU-2026-1042',
    name: 'Deepa Rajagopal',
    phone: '9884011223',
    email: 'deepa.rajagopal@gmail.com',
    category: 'Boxing & Combat',
    cohort: 'Teens (Ages 14–18)',
    day: 'Friday',
    timeSlot: '06:00 PM – 07:00 PM · Boxing (Fri Teens)',
    level: 'Beginner',
    notes: 'Interested in teen boxing trial class on Friday evening.',
    status: 'New',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    createdDisplay: '25 mins ago',
  },
  {
    id: 'stu-seed-2',
    type: 'studio',
    reference: 'STU-2026-2189',
    name: 'Rohan Mehra',
    phone: '9600044556',
    email: 'rohan.mehra@yahoo.com',
    category: 'Dance',
    cohort: 'Kids (Ages 4–10)',
    day: 'Monday',
    timeSlot: '04:00 PM – 05:00 PM · Kids Dance (Ages 4–10)',
    level: 'Beginner',
    notes: 'Enquiring for 7-year old daughter after-school batch.',
    status: 'Contacted',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    createdDisplay: '2 hours ago',
  },
  {
    id: 'stu-seed-3',
    type: 'studio',
    reference: 'STU-2026-3401',
    name: 'Pooja Venkatesh',
    phone: '9841099887',
    email: 'pooja.venkatesh@gmail.com',
    category: 'Dance Fitness',
    cohort: 'Adults (18+)',
    day: 'Mon · Wed · Fri (All)',
    timeSlot: '07:00 PM – 08:00 PM · Dance Fitness / Dance (Fri Adults)',
    level: 'Intermediate',
    notes: 'Wants full monthly studio pass for evening cardio sessions.',
    status: 'Trial Scheduled',
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    createdDisplay: '5 hours ago',
  },
  {
    id: 'stu-seed-4',
    type: 'studio',
    reference: 'STU-2026-4552',
    name: 'Senthil Kumar',
    phone: '9444033221',
    email: 'senthil.k@tcs.com',
    category: 'Yoga & Mindful Movement',
    cohort: 'Adults (18+)',
    day: 'Wednesday',
    timeSlot: '07:00 AM – 08:00 AM · Fitness / Yoga (Adults)',
    level: 'Beginner',
    notes: 'Morning yoga session inquiry before work commute.',
    status: 'Enrolled',
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    createdDisplay: '10 hours ago',
  },
];

function notifyEnquiryUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ENQUIRY_UPDATE_EVENT));
    try {
      const bc = new BroadcastChannel('pavilion_channel');
      bc.postMessage({ type: 'ENQUIRY_UPDATED', timestamp: Date.now() });
      bc.close();
    } catch {
      // BroadcastChannel not supported in this environment
    }
  }
}

// -------------------------------------------------------------------
// Pickleball Enquiries
// -------------------------------------------------------------------
export function getPickleballEnquiries(): PickleballEnquiry[] {
  if (typeof window === 'undefined') return SEED_PICKLEBALL;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PICKLEBALL);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PICKLEBALL, JSON.stringify(SEED_PICKLEBALL));
      return SEED_PICKLEBALL;
    }
    return JSON.parse(raw) as PickleballEnquiry[];
  } catch {
    return SEED_PICKLEBALL;
  }
}

export function addPickleballEnquiry(data: {
  reference: string;
  name: string;
  phone: string;
  email: string;
  plan?: string;
  sessions?: number;
  amountPaise?: number;
  paymentId?: string;
  status?: PickleballEnquiry['status'];
  notes?: string;
}): PickleballEnquiry {
  const current = getPickleballEnquiries();
  const now = new Date();
  const newEntry: PickleballEnquiry = {
    id: `pb-${Date.now()}`,
    type: 'pickleball',
    reference: data.reference,
    name: data.name,
    phone: data.phone,
    email: data.email,
    plan: data.plan || 'Inaugural Shared-Play Membership (12 Hours)',
    sessions: data.sessions || 12,
    sessionsUsed: 0,
    amountPaise: data.amountPaise || 236000,
    amountDisplay: '₹2,360.00',
    paymentId: data.paymentId || `pay_${Date.now().toString(36)}`,
    status: data.status || 'Pay at Desk',
    notes: data.notes || '',
    createdAt: now.toISOString(),
    createdDisplay: 'Just now',
  };

  const updated = [newEntry, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_PICKLEBALL, JSON.stringify(updated));
    notifyEnquiryUpdate();
  }

  // Forward to Turf-OS Central Platform
  submitEnquiry({
    type: 'pickleball',
    name: data.name,
    phone: data.phone,
    email: data.email,
    category: data.plan || 'Pickleball Shared-Play (12 Hours)',
    notes: `Enquiry ref ${data.reference} (${data.sessions || 12} hours quota). Status: ${data.status || 'Pay at Desk'}${data.notes ? ` | Notes: ${data.notes}` : ''}`,
  }).catch(() => null);

  return newEntry;
}

export function acceptAndOnboardMember(id: string): { success: boolean; message: string } {
  const current = getPickleballEnquiries();
  const member = current.find((m) => m.id === id);
  if (!member) return { success: false, message: 'Member not found.' };

  const updated = current.map((m) => {
    if (m.id === id) {
      return {
        ...m,
        status: 'Active Member (12h Quota)' as const,
      };
    }
    return m;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_PICKLEBALL, JSON.stringify(updated));
    notifyEnquiryUpdate();
  }

  return {
    success: true,
    message: `Accepted ${member.name}! Onboarded to Active Membership with ${member.sessions} Hours Quota.`,
  };
}

export function checkInMember(id: string): { success: boolean; message: string; used?: number; remaining?: number } {
  const current = getPickleballEnquiries();
  const member = current.find((m) => m.id === id);
  if (!member) return { success: false, message: 'Member not found.' };

  const used = member.sessionsUsed || 0;
  if (used >= member.sessions) {
    return { success: false, message: `Quota exhausted: all ${member.sessions} hours of monthly play have been completed.` };
  }

  const now = new Date();
  const todayYMD = now.toISOString().slice(0, 10);
  if (member.lastCheckIn && member.lastCheckIn.slice(0, 10) === todayYMD) {
    return { success: false, message: 'Member has already checked in for today (Max 1 hour session/day).' };
  }

  const newUsed = used + 1;
  const remaining = member.sessions - newUsed;
  const updated = current.map((m) => {
    if (m.id === id) {
      return {
        ...m,
        sessionsUsed: newUsed,
        lastCheckIn: now.toISOString(),
      };
    }
    return m;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_PICKLEBALL, JSON.stringify(updated));
    notifyEnquiryUpdate();
  }
  return {
    success: true,
    message: `Checked-in ${member.name}! Hour ${newUsed}/${member.sessions} recorded (${remaining} hours remaining).`,
    used: newUsed,
    remaining,
  };
}

// -------------------------------------------------------------------
// Studio Enquiries
// -------------------------------------------------------------------
export function getStudioEnquiries(): StudioEnquiry[] {
  if (typeof window === 'undefined') return SEED_STUDIO;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDIO);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_STUDIO, JSON.stringify(SEED_STUDIO));
      return SEED_STUDIO;
    }
    return JSON.parse(raw) as StudioEnquiry[];
  } catch {
    return SEED_STUDIO;
  }
}

export function addStudioEnquiry(data: {
  reference: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  cohort: string;
  day: string;
  timeSlot: string;
  level?: string;
  notes?: string;
}): StudioEnquiry {
  const current = getStudioEnquiries();
  const now = new Date();
  const newEntry: StudioEnquiry = {
    id: `stu-${Date.now()}`,
    type: 'studio',
    reference: data.reference,
    name: data.name,
    phone: data.phone,
    email: data.email,
    category: data.category,
    cohort: data.cohort,
    day: data.day,
    timeSlot: data.timeSlot,
    level: data.level || 'Beginner',
    notes: data.notes || '',
    status: 'New',
    createdAt: now.toISOString(),
    createdDisplay: 'Just now',
  };

  const updated = [newEntry, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_STUDIO, JSON.stringify(updated));
    notifyEnquiryUpdate();
  }

  // Forward to Turf-OS Central Platform
  submitEnquiry({
    type: 'studio',
    name: data.name,
    phone: data.phone,
    email: data.email,
    category: data.category,
    notes: `Studio Enquiry: ${data.cohort} · ${data.day} ${data.timeSlot} · Level: ${data.level || 'Beginner'}. Notes: ${data.notes || 'None'}`,
    details: {
      cohort: data.cohort,
      day: data.day,
      timeSlot: data.timeSlot,
      level: data.level,
    },
  }).catch(() => null);

  return newEntry;
}

export function updateStudioEnquiryStatus(
  id: string,
  newStatus: StudioEnquiry['status']
): void {
  const current = getStudioEnquiries();
  const updated = current.map((item) =>
    item.id === id ? { ...item, status: newStatus } : item
  );
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_STUDIO, JSON.stringify(updated));
    notifyEnquiryUpdate();
  }
}

export function deleteEnquiry(id: string, type: 'pickleball' | 'studio'): void {
  if (type === 'pickleball') {
    const current = getPickleballEnquiries();
    const updated = current.filter((item) => item.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PICKLEBALL, JSON.stringify(updated));
      notifyEnquiryUpdate();
    }
  } else {
    const current = getStudioEnquiries();
    const updated = current.filter((item) => item.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STUDIO, JSON.stringify(updated));
      notifyEnquiryUpdate();
    }
  }
}

export interface MemberLookupResult {
  found: boolean;
  isApproved: boolean;
  reference: string;
  name: string;
  phone: string;
  email: string;
  category: 'pickleball' | 'studio';
  planTitle: string;
  status: string;
  sessionsTotal: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  lastCheckIn?: string | undefined;
  createdDisplay: string;
  paymentStatus: string;
}

export function findMemberPassByQuery(query: string): MemberLookupResult | null {
  const cleanQ = query.trim().toLowerCase().replace(/\s+/g, '');
  const digits = query.replace(/\D/g, '');

  if (!cleanQ && !digits) return null;

  // 1. Search in Pickleball Memberships
  const pbList = getPickleballEnquiries();
  const pbMatch = pbList.find((p) => {
    const cleanRef = p.reference.toLowerCase().replace(/[^a-z0-9]/g, '');
    const searchRef = cleanQ.replace(/[^a-z0-9]/g, '');
    if (searchRef && (cleanRef === searchRef || cleanRef.includes(searchRef))) return true;
    if (digits.length >= 10 && p.phone.replace(/\D/g, '').endsWith(digits.slice(-10))) return true;
    return false;
  });

  if (pbMatch) {
    const isApproved =
      pbMatch.status === 'Active Member (12h Quota)' || pbMatch.status === 'Paid & Active';
    const total = pbMatch.sessions || 12;
    const used = pbMatch.sessionsUsed || 0;
    const remaining = Math.max(0, total - used);

    return {
      found: true,
      isApproved,
      reference: pbMatch.reference,
      name: pbMatch.name,
      phone: pbMatch.phone,
      email: pbMatch.email,
      category: 'pickleball',
      planTitle: pbMatch.plan,
      status: pbMatch.status,
      sessionsTotal: total,
      sessionsUsed: used,
      sessionsRemaining: remaining,
      lastCheckIn: pbMatch.lastCheckIn,
      createdDisplay: pbMatch.createdDisplay,
      paymentStatus: isApproved ? 'Front Desk Verified & Paid' : 'Pay at Desk (Pending Verification)',
    };
  }

  // 2. Search in Studio Memberships
  const stList = getStudioEnquiries();
  const stMatch = stList.find((s) => {
    const cleanRef = s.reference.toLowerCase().replace(/[^a-z0-9]/g, '');
    const searchRef = cleanQ.replace(/[^a-z0-9]/g, '');
    if (searchRef && (cleanRef === searchRef || cleanRef.includes(searchRef))) return true;
    if (digits.length >= 10 && s.phone.replace(/\D/g, '').endsWith(digits.slice(-10))) return true;
    return false;
  });

  if (stMatch) {
    const isApproved = stMatch.status === 'Enrolled';
    return {
      found: true,
      isApproved,
      reference: stMatch.reference,
      name: stMatch.name,
      phone: stMatch.phone,
      email: stMatch.email,
      category: 'studio',
      planTitle: `Pavilion Studio · ${stMatch.category} (${stMatch.cohort})`,
      status: stMatch.status,
      sessionsTotal: 12,
      sessionsUsed: 0,
      sessionsRemaining: 12,
      createdDisplay: stMatch.createdDisplay,
      paymentStatus: isApproved ? 'Enrolled & Verified' : 'Pending Desk Review',
    };
  }

  return null;
}

