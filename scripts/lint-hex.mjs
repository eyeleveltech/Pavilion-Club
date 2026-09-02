#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const HEX_REGEX = /#([0-9a-fA-F]{3,8})\b/g;

function scanDir(dir, results = []) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (['node_modules', 'dist', '.git', '.next'].includes(entry)) continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath, results);
      } else if (entry.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

const files = [...scanDir('apps'), ...scanDir('packages')];
let errorCount = 0;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Ignore comments or disabled lines if needed
    const match = line.match(HEX_REGEX);
    if (match) {
      console.error(`Lint Error: Raw hex colour "${match.join(', ')}" found in ${file}:${index + 1}`);
      console.error(`  ${line.trim()}`);
      console.error(`  --> Use a design token CSS variable or Tailwind class instead of raw hex.\n`);
      errorCount++;
    }
  });
}

if (errorCount > 0) {
  console.error(`❌ Found ${errorCount} raw hex colour violations in .tsx files.`);
  process.exit(1);
} else {
  console.log(`✓ Lint passed: No raw hex colours found in .tsx files.`);
  process.exit(0);
}
