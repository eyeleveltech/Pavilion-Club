/**
 * @pavilion/core — the booking engine.
 *
 * Pure TypeScript. No React, no Next.js, no database driver. Data in,
 * decisions out. That boundary is what lets the website, the front desk and
 * the Turf Town API share one answer to "what is free".
 *
 * If this package's tests are green, the booking logic is correct.
 */
export * from './availability/index.js';
export * from './booking/index.js';
export * from './money/index.js';
export * from './pricing/index.js';
export * from './time/index.js';
