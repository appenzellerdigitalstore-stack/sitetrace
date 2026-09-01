#!/usr/bin/env node
// Delete misplaced hhd_* blocks from es and pt language blocks.
// The add-hhd-keys.cjs script put Portuguese hhd_* in the es block and
// German hhd_* in the pt block. After deletion, all 6 languages will
// fall back to en for hhd_* keys (via i18n.js t() fallback).

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'js', 'i18n.js');
const buf = fs.readFileSync(FILE);

const lineRanges = [];
let start = 0;
for (let i = 0; i < buf.length; i++) {
  if (buf[i] === 0x0A) {
    lineRanges.push([start, i + 1]);
    start = i + 1;
  }
}
if (start < buf.length) lineRanges.push([start, buf.length]);

console.log(`File: ${FILE}, total ${lineRanges.length} lines`);

// Delete from bottom to top
const deletes = [
  { lang: 'pt', startLine: 2308, endLine: 2349 },
  { lang: 'es', startLine: 1538, endLine: 1579 },
];

for (const d of deletes) {
  const startText = buf.slice(lineRanges[d.startLine - 1][0], lineRanges[d.startLine - 1][1])
    .toString('utf8').replace(/\r?\n$/, '');
  const endText = buf.slice(lineRanges[d.endLine - 1][0], lineRanges[d.endLine - 1][1])
    .toString('utf8').replace(/\r?\n$/, '');
  console.log(`  ${d.lang} hhd block: lines ${d.startLine}..${d.endLine}`);
  console.log(`    start: ${startText.slice(0, 80)}`);
  console.log(`    end:   ${endText}`);
}

let out = buf;
for (const d of deletes) {
  const [startByte] = lineRanges[d.startLine - 1];
  const [, endByte] = lineRanges[d.endLine - 1];
  console.log(`Deleting ${d.lang} hhd: bytes ${startByte}..${endByte} (${endByte - startByte} bytes)`);
  out = Buffer.concat([out.slice(0, startByte), out.slice(endByte)]);
}

console.log(`\nBefore: ${buf.length} bytes`);
console.log(`After:  ${out.length} bytes`);
console.log(`Removed: ${buf.length - out.length} bytes`);

fs.writeFileSync(FILE, out);
console.log(`Wrote: ${FILE}`);

const { execSync } = require('child_process');
try {
  execSync(`node --check "${FILE}"`, { stdio: 'inherit' });
  console.log('✓ node --check passes');
} catch (err) {
  console.log('✗ node --check failed');
  process.exit(1);
}
