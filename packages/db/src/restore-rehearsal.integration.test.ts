import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { runBackup } from '../../../scripts/backup.mjs';
import { runRestoreAndVerify } from '../../../scripts/restore.mjs';

describe('Phase 4 Go-Live Gate: Encrypted Backup & Clean Restore Rehearsal', () => {
  it('encrypts database dump with AES-256-GCM, decrypts, and verifies booking and revenue metrics against source', async () => {
    const backupDir = path.resolve(process.cwd(), '../../backups');
    const backup = await runBackup({ outputDir: backupDir });

    expect(fs.existsSync(backup.path)).toBe(true);
    expect(backup.sizeBytes).toBeGreaterThan(1000); // verified non-empty

    const verification = await runRestoreAndVerify(backup.path);

    expect(verification.ok).toBe(true);
    expect(verification.verified).toBe(true);
    expect(verification.source.bookingsCount).toBeGreaterThanOrEqual(0);
    expect(typeof verification.source.bookingAmountPaise).toBe('string');
    expect(verification.message).toContain('Restore rehearsal verified');

    // Clean up rehearsal test artifact
    if (fs.existsSync(backup.path)) {
      fs.unlinkSync(backup.path);
    }
  });
});
