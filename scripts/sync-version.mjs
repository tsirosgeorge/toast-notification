// Keeps the CDN URLs inside toast.js pinned to the version in package.json.
// These used to be six hand-edited string literals, and they had already gone stale
// (a 5.3.3 package was loading 5.3.0 assets).
import { readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const src = readFileSync('toast.js', 'utf8');
const re = /(const TS_TOAST_VERSION = ")[^"]*(")/;

if (!re.test(src)) {
  console.error('toast.js: could not find the TS_TOAST_VERSION declaration');
  process.exit(1);
}

const out = src.replace(re, `$1${version}$2`);
writeFileSync('toast.js', out);
console.log(`toast.js pinned to CDN assets for v${version}`);
