// Add the 3 new i18n keys for the always-visible "Support SiteTrace" donate button
// to all 8 active languages: en, es, pt, fr, de, it, ja, zh
// Keys: support_btn (button text), support_header (header link text), support_tooltip
//
// Idempotent: if a key already exists, it will be updated in place.
//
// File uses CRLF line endings — all regexes are CRLF-tolerant.

const fs = require('fs');
const path = require('path');

const I18N_PATH = path.join(__dirname, '..', 'js', 'i18n.js');
let src = fs.readFileSync(I18N_PATH, 'utf8');

const TR = {
  en: {
    support_btn: 'Support us',
    support_header: 'Support',
    support_tooltip: 'SiteTrace is free. We don\'t run a paywall. If you want to help cover hosting, you can donate via PayPal. No perks, no signup — just optional support.',
  },
  es: {
    support_btn: 'Apóyanos',
    support_header: 'Apoyar',
    support_tooltip: 'SiteTrace es gratis. No hay muro de pago. Si quieres ayudar a cubrir el hosting, puedes donar vía PayPal. Sin beneficios, sin registro: solo apoyo opcional.',
  },
  pt: {
    support_btn: 'Apoie-nos',
    support_header: 'Apoiar',
    support_tooltip: 'O SiteTrace é gratuito. Não temos paywall. Se quiser ajudar a cobrir a hospedagem, pode doar via PayPal. Sem vantagens, sem cadastro — apenas apoio opcional.',
  },
  fr: {
    support_btn: 'Soutenez-nous',
    support_header: 'Soutenir',
    support_tooltip: 'SiteTrace est gratuit. Il n\'y a pas de mur payant. Si vous souhaitez aider à couvrir l\'hébergement, vous pouvez faire un don via PayPal. Aucun avantage, aucune inscription — juste un soutien optionnel.',
  },
  de: {
    support_btn: 'Unterstützen',
    support_header: 'Unterstützen',
    support_tooltip: 'SiteTrace ist kostenlos. Es gibt keine Bezahlschranke. Wenn du helfen möchtest, die Hosting-Kosten zu decken, kannst du über PayPal spenden. Keine Vorteile, keine Anmeldung — nur optionale Unterstützung.',
  },
  it: {
    support_btn: 'Sostenici',
    support_header: 'Sostenere',
    support_tooltip: 'SiteTrace è gratuito. Non c\'è paywall. Se vuoi aiutare a coprire l\'hosting, puoi donare tramite PayPal. Nessun vantaggio, nessuna registrazione — solo supporto opzionale.',
  },
  ja: {
    support_btn: 'ご支援',
    support_header: 'ご支援',
    support_tooltip: 'SiteTraceは無料です。ペイウォールはありません。ホスティング費用の支援にご興味があれば、PayPalで寄付できます。特典なし、サインアップ不要 — 任意の支援のみです。',
  },
  zh: {
    support_btn: '支持我们',
    support_header: '支持',
    support_tooltip: 'SiteTrace 是免费的。我们没有付费墙。如果你想帮助我们覆盖托管费用,可以通过 PayPal 捐款。没有特权,无需注册 — 只是可选的支持。',
  },
};

function escapeForJS(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

let out = src;
let totalInserted = 0;
let totalUpdated = 0;
let totalFailures = 0;

// Match the language block header at the start of a line.
const langReFor = (code) => new RegExp("^    " + code + ":\\s*\\{", "m");
const nextLangRe = /^    (en|es|pt|fr|de|it|ja|zh|nl|pl|ko|ru|tr|id|vi|sv):\s*\{/gm;

for (const code of Object.keys(TR)) {
  const translations = TR[code];
  const langMatch = langReFor(code).exec(out);
  if (!langMatch) { console.error(code + ': no block found'); totalFailures++; continue; }
  const blockStart = langMatch.index;
  nextLangRe.lastIndex = blockStart + 10;
  const nextMatch = nextLangRe.exec(out);
  const blockEnd = nextMatch ? nextMatch.index : out.length;
  const blockText = out.substring(blockStart, blockEnd);

  // Locate the closing `    },` of this block. It's the LAST one in the block.
  // CRLF-tolerant: match either `\r\n    },` or `\n    },` followed by EOL/EOF.
  const closeRe = /\r?\n    \},(?=\r?\n)/g;
  let lastClose = -1, m;
  while ((m = closeRe.exec(blockText)) !== null) lastClose = m.index;
  if (lastClose < 0) {
    console.error(code + ': no closing `    },` found in block');
    totalFailures++;
    continue;
  }

  // Build the per-key regex: matches `<indent>key: 'value',` at start of a line.
  // We do this for each key against the *current* block text, updating in place
  // when a key already exists. After all updates, we insert the missing keys
  // before the closing `    },`.
  let newBlock = blockText;
  const missing = [];

  for (const key of Object.keys(translations)) {
    // Match the key line. The value can be any JS string literal — we accept
    // either single-quoted ('...') or double-quoted ("...") values.
    // The leading indent is captured so we can preserve it on replacement.
    const keyRe = new RegExp("(^|\\r?\\n)([ \\t]+)" + key + ":\\s*(?:'((?:\\\\'|[^'\\r\\n])*)'|\"((?:\\\\\"|[^\"\\r\\n])*)\"),?\\s*(?=\\r?\\n)");
    const km = newBlock.match(keyRe);
    if (km) {
      const indent = km[2];
      newBlock = newBlock.replace(
        km[0],
        km[1] + indent + key + ": '" + escapeForJS(translations[key]) + "',"
      );
      totalUpdated++;
    } else {
      missing.push(key);
    }
  }

  if (missing.length) {
    // Re-locate the closing `    },` inside the (possibly-updated) newBlock.
    let closeIdx = -1;
    closeRe.lastIndex = 0;
    while ((m = closeRe.exec(newBlock)) !== null) closeIdx = m.index;
    if (closeIdx < 0) {
      console.error(code + ': no closing `    },` found in updated block');
      totalFailures++;
      continue;
    }
    // Detect the indent used by inner keys. Skip the block header (the
    // `en: {` line itself) because its indent is `    ` (4 spaces), not
    // the inner key indent. Look for `\n` + 4+ spaces + a key name + `:`.
    // To exclude the block header we skip the first line.
    const beforeClose = newBlock.substring(0, closeIdx);
    const firstNewline = beforeClose.indexOf('\n');
    const afterHeader = firstNewline >= 0 ? beforeClose.substring(firstNewline + 1) : beforeClose;
    // Match at start of a line: 6+ spaces then a letter, then colon-space.
    const lineMatch = afterHeader.match(/(^|\r?\n)([ \t]{4,})\S+: /);
    const indent = lineMatch ? lineMatch[2] : '      ';

    // The closing-brace regex matched at the start of the `\r\n    },` line.
    // We need to insert AFTER the previous line's terminator, so prepend \r\n.
    // The trailing \r\n keeps the `    },` on its own line.
    const insertion = '\r\n' + missing.map((k) =>
      indent + k + ": '" + escapeForJS(translations[k]) + "',"
    ).join('\r\n');
    newBlock = newBlock.substring(0, closeIdx) + insertion + newBlock.substring(closeIdx);
    totalInserted += missing.length;
  }

  out = out.substring(0, blockStart) + newBlock + out.substring(blockEnd);
  const summary = (missing.length ? 'inserted ' + missing.length : 'all present');
  console.log(code + ': ' + summary);
}

fs.writeFileSync(I18N_PATH, out);
console.log('Done. Inserted: ' + totalInserted + ', Updated: ' + totalUpdated + ', Failures: ' + totalFailures);
