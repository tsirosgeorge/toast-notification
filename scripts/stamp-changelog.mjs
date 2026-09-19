// Renames the CHANGELOG's "Unreleased" heading to the version being released.
// Left manual, the next release's notes get written over the previous one's, which is
// exactly how the 5.5.0 notes were briefly lost.
import { readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const path = 'CHANGELOG.md';
const src = readFileSync(path, 'utf8');

if (src.includes(`## [${version}]`)) {
  console.log(`CHANGELOG already has a ${version} section`);
  process.exit(0);
}
if (!src.includes('## [Unreleased]')) {
  console.error('CHANGELOG.md: no "## [Unreleased]" section to stamp');
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
writeFileSync(path, src.replace('## [Unreleased]', `## [${version}] - ${date}`));
console.log(`CHANGELOG stamped as ${version} (${date})`);
