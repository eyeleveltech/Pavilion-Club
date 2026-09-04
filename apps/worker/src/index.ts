import { createDb } from '@pavilion/db';
import { runHoldSweeper } from './jobs/sweeper.js';
import { runMessageOutboxDrain } from './jobs/message-drain.js';
import { runBookingCompletionJob } from './jobs/completion.js';

console.log('---------------------------------------------------------');
console.log(' [Pavilion Worker] Background daemon process starting...');
console.log('---------------------------------------------------------');

const db = createDb();
let isRunning = true;

// Intervals
const SWEEPER_INTERVAL_MS = 30 * 1000;      // 30 seconds
const OUTBOX_INTERVAL_MS = 15 * 1000;       // 15 seconds
const COMPLETION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function tickSweeper() {
  if (!isRunning) return;
  await runHoldSweeper(db);
}

async function tickOutbox() {
  if (!isRunning) return;
  await runMessageOutboxDrain(db);
}

async function tickCompletion() {
  if (!isRunning) return;
  await runBookingCompletionJob(db);
}

// Initial execution
console.log('[Pavilion Worker] Executing initial job ticks...');
await tickSweeper();
await tickOutbox();
await tickCompletion();
console.log('[Pavilion Worker] Schedulers registered and active.');

// Setup timers
const sweeperTimer = setInterval(tickSweeper, SWEEPER_INTERVAL_MS);
const outboxTimer = setInterval(tickOutbox, OUTBOX_INTERVAL_MS);
const completionTimer = setInterval(tickCompletion, COMPLETION_INTERVAL_MS);

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n[Pavilion Worker] Received ${signal}. Shutting down worker cleanly...`);
  isRunning = false;
  clearInterval(sweeperTimer);
  clearInterval(outboxTimer);
  clearInterval(completionTimer);
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));