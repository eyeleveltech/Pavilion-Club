#!/usr/bin/env node
/**
 * Copies the home page markup from public/index.html (the page that is live)
 * into EDITORIAL_MARKUP in EditorialLandingView (the page `next dev` shows),
 * so the two copies cannot drift. Run it after every edit to index.html:
 *
 *   node apps/web/scripts/sync-home-markup.mjs
 *
 * It takes everything in <body> between the Tag Manager <noscript> and the
 * first <script>. Each page loads the styles and scripts itself.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- End Google Tag Manager (noscript) -->';

const html = readFileSync(join(web, 'public/index.html'), 'utf8');
const start = html.indexOf(START);
const end = html.indexOf('<script', start);
if (start < 0 || end < 0) throw new Error('public/index.html: could not find the body markup');
const markup = html.slice(start + START.length, end);

const viewPath = join(web, 'src/components/public/editorial/EditorialLandingView.tsx');
const view = readFileSync(viewPath, 'utf8');
const line = /^const EDITORIAL_MARKUP = ".*";$/m;
if (!line.test(view)) throw new Error('EditorialLandingView.tsx: EDITORIAL_MARKUP line not found');
writeFileSync(viewPath, view.replace(line, () => `const EDITORIAL_MARKUP = ${JSON.stringify(markup)};`));

console.log(`EDITORIAL_MARKUP updated from public/index.html (${markup.length} characters).`);
