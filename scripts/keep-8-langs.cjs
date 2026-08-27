// One-off: drop 8 language blocks from i18n.js, leaving exactly 8:
// en, es, pt, fr, de, it, ja, zh
// Also updates layout.js LANG_LABELS to match.
const fs = require('fs');
const path = require('path');

const I18N_PATH = path.join(__dirname, '..', 'js', 'i18n.js');
const LAYOUT_PATH = path.join(__dirname, '..', 'js', 'layout.js');

const KEEP = ['en','es','pt','fr','de','it','ja','zh'];
const DROP = ['nl','pl','ko','ru','tr','id','vi','sv'];

// 1. Drop language blocks from i18n.js
{
  let src = fs.readFileSync(I18N_PATH, 'utf8');
  for (const code of DROP) {
    // Match the language block: from "    code: {" up to and including
    // the matching "    },". The file uses CRLF, so use \r?\n.
    const re = new RegExp(
      "^    " + code + ":\\s*\\{[\\s\\S]*?^    \\},\\r?\\n",
      "m"
    );
    const before = src.length;
    src = src.replace(re, '');
    const after = src.length;
    console.log(code + ': removed ' + (before - after) + ' bytes from i18n.js');
  }
  fs.writeFileSync(I18N_PATH, src);
}

// 2. Update LANG_LABELS in layout.js
{
  let src = fs.readFileSync(LAYOUT_PATH, 'utf8');
  // Match the LANG_LABELS object and rewrite the entries (CRLF aware)
  const re = /const LANG_LABELS = \{[\s\S]*?\};\r?\n/m;
  const newLabels = `const LANG_LABELS = {\r\n    en: 'English',\r\n    es: 'Español',\r\n    pt: 'Português',\r\n    fr: 'Français',\r\n    de: 'Deutsch',\r\n    it: 'Italiano',\r\n    ja: '日本語',\r\n    zh: '中文',\r\n  };\r\n`;
  const before = src.length;
  src = src.replace(re, newLabels);
  const after = src.length;
  console.log('layout.js LANG_LABELS: ' + (before - after) + ' byte delta');
  fs.writeFileSync(LAYOUT_PATH, src);
}

console.log('Done.');
