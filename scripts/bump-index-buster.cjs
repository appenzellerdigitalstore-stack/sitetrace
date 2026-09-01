#!/usr/bin/env node
// Bump cache buster from ?v=25 to ?v=26 in index.html only.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'index.html');
const s = fs.readFileSync(FILE, 'utf8');
const m = s.match(/i18n\.js\?v=(\d+)/);
console.log('Current version:', m ? m[1] : 'not found');

const NEW_V = '26';
const ns = s.replace(/(\?v=)25/g, '$1' + NEW_V);

if (ns === s) {
  console.log('No replacements made');
  process.exit(1);
}

fs.writeFileSync(FILE, ns);
console.log('Bumped to v=' + NEW_V + ', file size:', ns.length);
