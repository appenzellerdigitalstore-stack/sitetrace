#!/usr/bin/env node
// Add 10 new landing-page i18n keys to all 6 language blocks in js/i18n.js:
//   front_more_eyebrow
//   front_feature_new
//   front_feature_iprep_title
//   front_feature_iprep_desc
//   front_feature_snc_title
//   front_feature_snc_desc
//   front_feature_emd_title
//   front_feature_emd_desc
//   front_feature_hhd_title
//   front_feature_hhd_desc
//
// Strategy: identify each language block by its `xx: {` opener, find the
// LAST key before the closing `},` of that block, and insert the new keys
// just before the closing `},`. This is the correct per-block pattern
// (see lesson in MEMORY.md) — NOT a global "last key" anchor.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'js', 'i18n.js');
const buf = fs.readFileSync(FILE, 'utf8');
const text = buf.replace(/\r\n/g, '\n');
const lines = text.split('\n');

// All 10 keys with English values
const NEW_KEYS = {
  front_more_eyebrow: 'More tools',
  front_feature_new: 'New',
  front_feature_iprep_title: 'IP reputation check',
  front_feature_iprep_desc: 'Check any IPv4 against 7 major DNS blacklists (Spamhaus, Spamcop, Barracuda, CBL, SORBS, UCEPROTECT, PSBL) plus geolocation, ISP, ASN, and whether the connection looks like a proxy or data center.',
  front_feature_snc_title: 'Subnet calculator',
  front_feature_snc_desc: 'Paste any IPv4 CIDR (e.g. 192.168.1.0/24) and get the network address, broadcast, first/last usable host, subnet and wildcard masks, total address count, IP class, and full binary breakdown. Pure client-side math.',
  front_feature_emd_title: 'Email deliverability check',
  front_feature_emd_desc: 'See if a domain is configured to reach the inbox. We query SPF, DKIM (on 20 common selectors), DMARC, MX, and BIMI in parallel and give you a 0-100 score with a list of what to fix.',
  front_feature_hhd_title: 'HTTP headers viewer',
  front_feature_hhd_desc: 'Paste any URL and get the full set of response headers plus a 0-100 security grade for the six headers that matter (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).',
};

// Per-language translations for each new key
const TRANS = {
  en: NEW_KEYS,
  es: {
    front_more_eyebrow: 'Más herramientas',
    front_feature_new: 'Nuevo',
    front_feature_iprep_title: 'Verificación de reputación IP',
    front_feature_iprep_desc: 'Comprueba cualquier IPv4 contra 7 listas negras DNS principales (Spamhaus, Spamcop, Barracuda, CBL, SORBS, UCEPROTECT, PSBL) más geolocalización, ISP, ASN, y si la conexión parece un proxy o centro de datos.',
    front_feature_snc_title: 'Calculadora de subredes',
    front_feature_snc_desc: 'Pega cualquier CIDR IPv4 (p. ej. 192.168.1.0/24) y obtén la dirección de red, broadcast, primer/último host usable, máscaras de subred y wildcard, conteo total de direcciones, clase IP y desglose binario. Cálculo puro del lado del cliente.',
    front_feature_emd_title: 'Verificación de entregabilidad de email',
    front_feature_emd_desc: 'Mira si un dominio está configurado para llegar a la bandeja de entrada. Consultamos SPF, DKIM (en 20 selectores comunes), DMARC, MX y BIMI en paralelo y te damos una puntuación de 0-100 con una lista de qué corregir.',
    front_feature_hhd_title: 'Visor de cabeceras HTTP',
    front_feature_hhd_desc: 'Pega cualquier URL y obtén el conjunto completo de cabeceras de respuesta más una nota de seguridad de 0-100 para las seis cabeceras que importan (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).',
  },
  pt: {
    front_more_eyebrow: 'Mais ferramentas',
    front_feature_new: 'Novo',
    front_feature_iprep_title: 'Verificação de reputação de IP',
    front_feature_iprep_desc: 'Verifique qualquer IPv4 contra 7 listas negras DNS principais (Spamhaus, Spamcop, Barracuda, CBL, SORBS, UCEPROTECT, PSBL) mais geolocalização, ISP, ASN, e se a conexão parece um proxy ou data center.',
    front_feature_snc_title: 'Calculadora de sub-redes',
    front_feature_snc_desc: 'Cole qualquer CIDR IPv4 (ex.: 192.168.1.0/24) e obtenha o endereço de rede, broadcast, primeiro/último host utilizável, máscaras de sub-rede e wildcard, contagem total de endereços, classe IP e detalhamento binário. Cálculo puro do lado do cliente.',
    front_feature_emd_title: 'Verificação de entregabilidade de email',
    front_feature_emd_desc: 'Veja se um domínio está configurado para chegar à caixa de entrada. Consultamos SPF, DKIM (em 20 seletores comuns), DMARC, MX e BIMI em paralelo e damos uma pontuação de 0-100 com uma lista do que corrigir.',
    front_feature_hhd_title: 'Visualizador de cabeçalhos HTTP',
    front_feature_hhd_desc: 'Cole qualquer URL e obtenha o conjunto completo de cabeçalhos de resposta mais uma nota de segurança de 0-100 para os seis cabeçalhos que importam (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).',
  },
  fr: {
    front_more_eyebrow: 'Plus d\u0027outils',
    front_feature_new: 'Nouveau',
    front_feature_iprep_title: 'Vérification de réputation IP',
    front_feature_iprep_desc: 'Vérifiez n\u0027importe quel IPv4 contre 7 principales listes noires DNS (Spamhaus, Spamcop, Barracuda, CBL, SORBS, UCEPROTECT, PSBL) plus la géolocalisation, l\u0027ISP, l\u0027ASN, et si la connexion ressemble à un proxy ou un centre de données.',
    front_feature_snc_title: 'Calculatrice de sous-réseaux',
    front_feature_snc_desc: 'Collez n\u0027importe quel CIDR IPv4 (ex. 192.168.1.0/24) et obtenez l\u0027adresse réseau, broadcast, premier/dernier hôte utilisable, masques de sous-réseau et wildcard, nombre total d\u0027adresses, classe IP, et décomposition binaire complète. Calcul pur côté client.',
    front_feature_emd_title: 'Vérification de délivrabilité des emails',
    front_feature_emd_desc: 'Voyez si un domaine est configuré pour atteindre la boîte de réception. Nous interrogeons SPF, DKIM (sur 20 sélecteurs courants), DMARC, MX et BIMI en parallèle et vous donnons un score de 0-100 avec une liste de ce qu\u0027il faut corriger.',
    front_feature_hhd_title: 'Afficheur d\u0027en-têtes HTTP',
    front_feature_hhd_desc: 'Collez n\u0027importe quelle URL et obtenez l\u0027ensemble complet des en-têtes de réponse plus une note de sécurité de 0-100 pour les six en-têtes qui comptent (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).',
  },
  de: {
    front_more_eyebrow: 'Weitere Tools',
    front_feature_new: 'Neu',
    front_feature_iprep_title: 'IP-Reputationsprüfung',
    front_feature_iprep_desc: 'Prüfe jede IPv4 gegen 7 große DNS-Blacklists (Spamhaus, Spamcop, Barracuda, CBL, SORBS, UCEPROTECT, PSBL) plus Geolokalisierung, ISP, ASN und ob die Verbindung wie ein Proxy oder Rechenzentrum aussieht.',
    front_feature_snc_title: 'Subnetz-Rechner',
    front_feature_snc_desc: 'Füge eine beliebige IPv4-CIDR ein (z. B. 192.168.1.0/24) und erhalte Netzwerkadresse, Broadcast, erste/letzte nutzbare Host-Adresse, Subnetz- und Wildcard-Masken, Gesamtanzahl der Adressen, IP-Klasse und vollständige Binäraufschlüsselung. Reine clientseitige Berechnung.',
    front_feature_emd_title: 'E-Mail-Zustellbarkeitsprüfung',
    front_feature_emd_desc: 'Sieh, ob eine Domain für den Posteingang konfiguriert ist. Wir fragen SPF, DKIM (bei 20 gängigen Selektoren), DMARC, MX und BIMI parallel ab und geben dir eine 0-100-Punktzahl mit einer Liste, was zu reparieren ist.',
    front_feature_hhd_title: 'HTTP-Header-Viewer',
    front_feature_hhd_desc: 'Füge eine beliebige URL ein und erhalte den vollständigen Satz von Antwort-Headern plus eine 0-100-Sicherheitsbewertung für die sechs Header, die zählen (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).',
  },
  it: {
    front_more_eyebrow: 'Altri strumenti',
    front_feature_new: 'Nuovo',
    front_feature_iprep_title: 'Verifica reputazione IP',
    front_feature_iprep_desc: 'Controlla qualsiasi IPv4 contro 7 principali blacklist DNS (Spamhaus, Spamcop, Barracuda, CBL, SORBS, UCEPROTECT, PSBL) più geolocalizzazione, ISP, ASN, e se la connessione sembra un proxy o un data center.',
    front_feature_snc_title: 'Calcolatore di sottoreti',
    front_feature_snc_desc: 'Incolla qualsiasi CIDR IPv4 (es. 192.168.1.0/24) e ottieni indirizzo di rete, broadcast, primo/ultimo host utilizzabile, maschere di sottorete e wildcard, conteggio totale degli indirizzi, classe IP e scomposizione binaria completa. Calcolo puro lato client.',
    front_feature_emd_title: 'Verifica recapito email',
    front_feature_emd_desc: 'Vedi se un dominio è configurato per raggiungere la posta in arrivo. Interroghiamo SPF, DKIM (su 20 selettori comuni), DMARC, MX e BIMI in parallelo e ti diamo un punteggio 0-100 con un elenco di cosa correggere.',
    front_feature_hhd_title: 'Visualizzatore di header HTTP',
    front_feature_hhd_desc: 'Incolla qualsiasi URL e ottieni l\u0027insieme completo di header di risposta più un voto di sicurezza 0-100 per i sei header che contano (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).',
  },
};

// Find each language block's start line and the line of its closing `},`.
// Pattern:    block starts at line where indent is exactly 4 spaces + `xx: {`.
// Block ends at the FIRST `    },` (4-space indent + },) after the start.
function findLangBlock(lang) {
  let startLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '    ' + lang + ': {') { startLine = i; break; }
  }
  if (startLine === -1) throw new Error('Could not find start of ' + lang + ' block');
  // Find the closing `    },`
  for (let i = startLine + 1; i < lines.length; i++) {
    if (lines[i] === '    },') return { start: startLine, end: i };
  }
  throw new Error('Could not find end of ' + lang + ' block');
}

// Check that a key is NOT already present in a block (defensive — avoid duplicates)
function hasKey(lang, key) {
  const block = findLangBlock(lang);
  for (let i = block.start; i <= block.end; i++) {
    if (lines[i].startsWith('      ' + key + ':')) return true;
  }
  return false;
}

function escapeForSingleQuote(s) {
  // Inside a single-quoted JS string, escape backslashes first, then apostrophes
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Build the new lines to insert for a language block
function buildInsertion(lang) {
  const trans = TRANS[lang];
  if (!trans) throw new Error('No translations for ' + lang);
  const out = [];
  for (const key of Object.keys(NEW_KEYS)) {
    if (hasKey(lang, key)) {
      console.log('  ' + lang + ': skipping ' + key + ' (already present)');
      continue;
    }
    out.push('      ' + key + ": '" + escapeForSingleQuote(trans[key]) + "',");
  }
  return out;
}

// Insert into each block, going bottom-to-top to preserve line numbers
const langs = ['en', 'es', 'pt', 'fr', 'de', 'it'];
const blocks = langs.map((l) => ({ lang: l, block: findLangBlock(l) }));
blocks.sort((a, b) => b.block.end - a.block.end);

let newLines = lines.slice();
for (const b of blocks) {
  const insertion = buildInsertion(b.lang);
  if (insertion.length === 0) continue;
  console.log('  ' + b.lang + ': inserting ' + insertion.length + ' keys at line ' + (b.block.end + 1));
  newLines = newLines.slice(0, b.block.end).concat(insertion, newLines.slice(b.block.end));
}

// Write back, preserving CRLF
const out = newLines.join('\n').replace(/\n/g, '\r\n') + '\r\n';
fs.writeFileSync(FILE, out);
console.log('Wrote: ' + FILE + ' (' + out.length + ' bytes)');

// Sanity check
const { execSync } = require('child_process');
try {
  execSync('node --check "' + FILE + '"', { stdio: 'inherit' });
  console.log('✓ node --check passes');
} catch (err) {
  console.log('✗ node --check failed');
  process.exit(1);
}

// Verify each language now has all 10 keys
const acorn = require('acorn');
const src = fs.readFileSync(FILE, 'utf8');
const vm = require('vm');
const ctx = { window: {}, document: { addEventListener: () => {}, readyState: 'loading' }, navigator: { languages: ['en-US'] }, sessionStorage: { getItem: () => null, setItem: () => {} }, console };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const D = ctx.window.I18N.dictionaries;
for (const lang of langs) {
  for (const key of Object.keys(NEW_KEYS)) {
    if (!(key in D[lang])) {
      console.log('  ✗ ' + lang + '.' + key + ' MISSING');
      process.exit(1);
    }
  }
  console.log('  ✓ ' + lang + ': all 10 new keys present');
}
console.log('Done.');
