import { createRequire } from 'node:module';

// Use createRequire to prevent Next.js / Webpack from attempting to bundle native .node binary
const require = createRequire(import.meta.url);

function getArgon2() {
  return require('@node-rs/argon2');
}

/**
 * Hash a staff password using Argon2id.
 * Argon2id is intentionally slow to prevent brute-force cracking.
 * Algorithm 2 = Argon2id.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const argon2 = getArgon2();
  return argon2.hash(plainText, {
    algorithm: 2, // Argon2id
  });
}

/**
 * Verify a plain text password against an Argon2id hash.
 */
export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  try {
    const argon2 = getArgon2();
    return await argon2.verify(hashed, plainText);
  } catch {
    return false;
  }
}
