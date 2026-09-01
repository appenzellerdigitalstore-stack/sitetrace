#!/usr/bin/env node
// scripts/remove-languages.cjs
//
// Idempotent: removes a language block (and any trailing blank line
// before the next language) from js/i18n.js for every language code
// passed on the command line. Designed for the 8→6 trim (drop ja, zh)
// but works for any combination.
//
// Usage: node scripts/remove-languages.cjs ja zh

'use strict';
const fs = require('fs');
const path = require('path');

const I18N_PATH = path.join(__dirname, '..', 'js', 'i18n.js');
const langs = process.argv.slice(2);
if (langs.length === 0) {
  console.error('Usage: node scripts/remove-languages.cjs <lang> [<lang> ...]');
  process.exit(1);
}

const raw = fs.readFileSync(I18N_PATH, 'utf8');
const EOL = raw.indexOf('\r') !== -1 ? '\r\n' : '\n';
const src = raw.replace(/\r/g, '');

let out = src;
let removed = 0;

for (const lang of langs) {
  // Anchor: the 4-space-indented line "<lang>: {" through the matching
  // closing "    }," of the language block. We anchor on the start
  // line and scan forward for the matching close.
  const startRe = new RegExp('    ' + lang + ': \\{\\n');
  const m = startRe.exec(out);
  if (!m) {
    console.log('[' + lang + '] not found (already removed?), skipping');
    continue;
  }
  // Find the matching closing `    },` — for sitetrace's i18n.js the
  // language blocks are flat (no nested braces), so we just look for
  // the next `    },\n` at column 0.
  const closeRe = /\n    \},\n/;
  const closeMatch = closeRe.exec(out.slice(m.index));
  if (!closeMatch) {
    console.error('[' + lang + '] could not find matching close');
    process.exit(1);
  }
  const blockEnd = m.index + closeMatch.index + closeMatch[0].length;
  // Also drop the blank line right after the block, if any, so the
  // next language block stays adjacent (preserves the file's spacing).
  let extra = 0;
  if (out.slice(blockEnd, blockEnd + 1) === '\n') extra = 1;
  out = out.slice(0, m.index) + out.slice(blockEnd + extra);
  removed += 1;
  console.log('[' + lang + '] removed');
}

if (removed === 0) {
  console.log('No changes made.');
} else {
  const outFinal = out.replace(/\n/g, EOL);
  fs.writeFileSync(I18N_PATH, outFinal, 'utf8');
  console.log('\nWrote ' + I18N_PATH + ' (' + removed + ' language(s) removed)');
}
