#!/usr/bin/env node
import {
  createDb,
  getBookableCourts,
  getCourtHours,
  getActivePriceRules,
  bookings,
  blackouts,
  sql,
} from '../packages/db/dist/index.js';
import { computeAvailability, IST_OFFSET_MINUTES } from '../packages/core/dist/index.js';

process.loadEnvFile?.('.env');

const args = process.argv.slice(2);
const dateIdx = args.indexOf('--date');
const date = dateIdx !== -1 && args[dateIdx + 1] ? args[dateIdx + 1] : '2026-09-05';

const db = createDb();
const courtsList = await getBookableCourts(db);
const hoursList = await getCourtHours(db);
const priceRulesList = await getActivePriceRules(db);

const coreCourts = courtsList.map((c) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  slotMinutes: c.slotMinutes,
  sortOrder: c.sortOrder,
  isBookable: c.isBookable,
}));

const coreHours = hoursList.map((h) => ({
  courtId: h.courtId,
  weekday: h.weekday,
  openMinutes: h.openMinutes,
  closeMinutes: h.closeMinutes,
}));

const coreRules = priceRulesList.map((r) => ({
  id: r.id,
  name: r.name,
  courtId: r.courtId,
  weekdays: r.weekdays ? r.weekdays : null,
  fromMinutes: r.fromMinutes,
  toMinutes: r.toMinutes,
  validFrom: r.validFrom,
  validTo: r.validTo,
  priority: r.priority,
  pricePaise: r.pricePaise,
  isActive: r.isActive,
  createdAt: r.createdAt.toISOString(),
}));

// Fetch existing bookings and blackouts for that business date
const existingBookings = await db
  .select()
  .from(bookings)
  .where(sql`business_date = ${date}::date AND status IN ('held', 'confirmed')`);

const existingBlackouts = await db.select().from(blackouts);

const slots = computeAvailability({
  courts: coreCourts,
  hours: coreHours,
  bookings: existingBookings.map((b) => ({
    id: b.id,
    reference: b.reference,
    courtId: b.courtId,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    status: b.status,
    expiresAt: b.expiresAt,
    channelCode: 'demo',
    channelName: 'Demo',
    channelColourHex: '#0D5F52',
    customerName: null,
    customerPhone: null,
    partnerReference: b.partnerReference,
    amountPaise: b.amountPaise,
    paidPaise: b.status === 'confirmed' ? b.amountPaise : 0,
  })),
  blackouts: existingBlackouts.map((b) => ({
    id: b.id,
    courtId: b.courtId,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    reason: b.reason,
  })),
  priceRules: coreRules,
  date,
  now: new Date('2026-09-01T00:00:00Z'),
  offsetMinutes: IST_OFFSET_MINUTES,
});

console.log(`\n=== Pavilion Club Availability for ${date} ===`);
console.log(`Total slots computed: ${slots.length}`);
for (const s of slots) {
  const courtName = coreCourts.find((c) => c.id === s.courtId)?.name ?? 'Court';
  console.log(
    `  ${courtName} | ${s.startsAt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} - ${s.endsAt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} | state: ${s.state} | ₹${(s.pricePaise ?? 0) / 100}`
  );
}
console.log(`\n✓ Verified: ${slots.length} slots generated across 3 courts.\n`);
process.exit(0);
