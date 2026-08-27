// Add footer_blog key to all 8 active languages.
const fs = require('fs');
const path = require('path');

const I18N_PATH = path.join(__dirname, '..', 'js', 'i18n.js');
let src = fs.readFileSync(I18N_PATH, 'utf8');

const TR = {
  en: { footer_blog: 'Blog' },
  es: { footer_blog: 'Blog' },
  pt: { footer_blog: 'Blog' },
  fr: { footer_blog: 'Blog' },
  de: { footer_blog: 'Blog' },
  it: { footer_blog: 'Blog' },
  ja: { footer_blog: 'ブログ' },
  zh: { footer_blog: '博客' },
};

function escapeForJS(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

const langReFor = (code) => new RegExp("^    " + code + ":\\s*\\{", "m");
const nextLangRe = /^    (en|es|pt|fr|de|it|ja|zh|nl|pl|ko|ru|tr|id|vi|sv):\s*\{/gm;

let out = src, totalUpdated = 0, totalInserted = 0;

for (const code of Object.keys(TR)) {
  const langMatch = langReFor(code).exec(out);
  if (!langMatch) continue;
  const blockStart = langMatch.index;
  nextLangRe.lastIndex = blockStart + 10;
  const nm = nextLangRe.exec(out);
  const blockEnd = nm ? nm.index : out.length;
  let blockText = out.substring(blockStart, blockEnd);

  // Try update-in-place
  const keyRe = new RegExp("(^|\\r?\\n)([ \\t]+)footer_blog:\\s*'((?:\\\\'|[^'\\r\\n])*)'");
  const m = blockText.match(keyRe);
  if (m) {
    blockText = blockText.replace(m[0], m[1] + m[2] + "footer_blog: '" + escapeForJS(TR[code].footer_blog) + "'");
    totalUpdated++;
  } else {
    // Insert before the closing `    },`
    const closeRe = /\r?\n    \},(?=\r?\n)/g;
    let lastClose = -1, mm;
    while ((mm = closeRe.exec(blockText)) !== null) lastClose = mm.index;
    if (lastClose < 0) continue;
    // Find inner-key indent
    const beforeClose = blockText.substring(0, lastClose);
    const firstNewline = beforeClose.indexOf('\n');
    const afterHeader = firstNewline >= 0 ? beforeClose.substring(firstNewline + 1) : beforeClose;
    const lineMatch = afterHeader.match(/(^|\r?\n)([ \t]{4,})\S+: /);
    const indent = lineMatch ? lineMatch[2] : '      ';
    blockText = blockText.substring(0, lastClose)
      + '\r\n' + indent + "footer_blog: '" + escapeForJS(TR[code].footer_blog) + "',"
      + blockText.substring(lastClose);
    totalInserted++;
  }
  out = out.substring(0, blockStart) + blockText + out.substring(blockEnd);
}

fs.writeFileSync(I18N_PATH, out);
console.log('footer_blog: updated=' + totalUpdated + ' inserted=' + totalInserted);
