// Generates toast.module.js from toast.js so the ESM and UMD builds can never drift.
// toast.module.js used to be a hand-maintained copy, which meant every fix had to be
// applied twice and stayed one edit away from diverging.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'toast.js';
const OUT = 'toast.module.js';

let src = readFileSync(SRC, 'utf8');

// Drop the CommonJS tail: `module` is not defined in an ES module.
const cjs = /\/\* build:cjs-start[\s\S]*?\/\* build:cjs-end \*\/\n?/;
if (!cjs.test(src)) {
  console.error(`${SRC}: missing build:cjs-start / build:cjs-end markers`);
  process.exit(1);
}
src = src.replace(cjs, '');

writeFileSync(
  OUT,
  `${src.trimEnd()}\n\n// ES module export\nexport default toast;\nexport { toast };\n`
);
console.log(`${OUT} generated from ${SRC}`);
