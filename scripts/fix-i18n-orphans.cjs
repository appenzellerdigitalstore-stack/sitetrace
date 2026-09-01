#!/usr/bin/env node
// Fix i18n.js: delete the orphan duplicate emd_*/hhd_* key blocks that were
// inserted AFTER each language block's closing `},` by the buggy
// add-emd-keys.cjs / add-hhd-keys.cjs scripts.
//
// Strategy: read the file, identify orphan line ranges, delete them from
// bottom to top so line numbers don't shift. Preserve CRLF endings.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'js', 'i18n.js');
const buf = fs.readFileSync(FILE);

// Find line boundaries (LF, since CRLF means LF is preceded by CR)
// A "line" here is the bytes from one \n to the next \n (inclusive of \n).
const lineRanges = [];
let start = 0;
for (let i = 0; i < buf.length; i++) {
  if (buf[i] === 0x0A) { // \n
    lineRanges.push([start, i + 1]); // [start, end) of bytes for this line (incl. trailing \n)
    start = i + 1;
  }
}
if (start < buf.length) lineRanges.push([start, buf.length]);

console.log(`File: ${FILE}`);
console.log(`Total lines: ${lineRanges.length}`);

// Orphan ranges (1-indexed, inclusive). Identified by manual inspection.
// These are the duplicate emd_*/hhd_* sections that ended up AFTER each
// language block's closing `},` instead of inside it.
const orphans = [
  { start: 811,  end: 918,  lang: 'en' },
  { start: 1689, end: 1796, lang: 'es' },
  { start: 2567, end: 2674, lang: 'pt' },
  { start: 3402, end: 3466, lang: 'fr' },
  { start: 4209, end: 4273, lang: 'de' },
  { start: 5016, end: 5080, lang: 'it' },
];

// Verify each orphan start line is a top-level comment we recognize
const expectedStartPatterns = {
  en: /^[/]\/ Email deliverability/,
  es: /^[/]\/ Verificador de entregabilidad de correo/,
  pt: /^[/]\/ Verificador de entregabilidade de email/,
  fr: /^[/]\/ Vérificateur de délivrabilité/,
  de: /^[/]\/ E-Mail-Zustellbarkeitsprüfung/,
  it: /^[/]\/ Verifica di recapito email/,
};

for (const o of orphans) {
  const lineText = buf.slice(lineRanges[o.start - 1][0], lineRanges[o.start - 1][1])
    .toString('utf8').replace(/\r?\n$/, '');
  const endLineText = buf.slice(lineRanges[o.end - 1][0], lineRanges[o.end - 1][1])
    .toString('utf8').replace(/\r?\n$/, '');
  const startOk = expectedStartPatterns[o.lang].test(lineText);
  const endIsClose = endLineText.trim() === '},';
  console.log(`  ${o.lang}: lines ${o.start}..${o.end} — start "${lineText.slice(0, 60)}" ${startOk ? '✓' : '✗'} | end "${endLineText}" ${endIsClose ? '✓' : '✗'}`);
  if (!startOk || !endIsClose) {
    console.error(`MISMATCH for ${o.lang} orphan. Aborting.`);
    process.exit(1);
  }
}

console.log('');
console.log('All orphan ranges verified. Deleting from bottom to top...');

// Build the new buffer by removing the byte ranges in reverse order.
let out = buf;
for (let i = orphans.length - 1; i >= 0; i--) {
  const o = orphans[i];
  const [startByte, endByte] = lineRanges[o.start - 1];
  const [, endByte2] = lineRanges[o.end - 1];
  console.log(`  Deleting ${o.lang} orphan: bytes ${startByte}..${endByte2} (${endByte2 - startByte} bytes)`);
  out = Buffer.concat([out.slice(0, startByte), out.slice(endByte2)]);
}

const beforeLen = buf.length;
const afterLen = out.length;
console.log('');
console.log(`Before: ${beforeLen} bytes, ${lineRanges.length} lines`);
console.log(`After:  ${afterLen} bytes, ${afterLen} bytes / approx ${Math.round(afterLen / 70)} lines`);
console.log(`Removed: ${beforeLen - afterLen} bytes`);

// Write the result
fs.writeFileSync(FILE, out);
console.log(`Wrote: ${FILE}`);

// Sanity check with node --check
const { execSync } = require('child_process');
try {
  execSync(`node --check "${FILE}"`, { stdio: 'inherit' });
  console.log('✓ node --check passes');
} catch (err) {
  console.log('✗ node --check still fails. Inspect manually.');
  process.exit(1);
}
