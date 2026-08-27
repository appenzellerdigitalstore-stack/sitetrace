// Update the about_p2 paragraph in all 8 languages.
// The old copy promised "SiteTrace does the opposite" of popups/autoplay/intrusive
// ads, but we run AdSense auto-ads which CAN inject those formats. The new copy
// keeps the honest, true-to-product framing (one tool per page, answer first,
// loads in under a second) and drops the over-promise.
//
// Idempotent: replaces the value of about_p2 in each block if found, inserts
// the new key/value if missing (e.g. if a language was added after the script
// was last run).

const fs = require('fs');
const path = require('path');

const I18N_PATH = path.join(__dirname, '..', 'js', 'i18n.js');
let src = fs.readFileSync(I18N_PATH, 'utf8');

const TR = {
  en: 'We were tired of the popular free network-tool sites: too many ads, too much clutter, too many features hidden behind a signup. SiteTrace keeps it simple — every tool is one page, the answer is the first thing you see, and the page loads in under a second. Bookmark the one you need, share it, or come back whenever something on the internet feels off.',
  es: 'Nos cansamos de los sitios populares de herramientas de red gratuitas: demasiados anuncios, demasiado desorden, demasiadas funciones ocultas tras un registro. SiteTrace lo mantiene simple: cada herramienta es una página, la respuesta es lo primero que ves, y la página carga en menos de un segundo. Guarda en favoritos la que necesites, compártela, o vuelve cuando algo en Internet se sienta mal.',
  pt: 'Cansamos dos sites populares de ferramentas de rede gratuitas: anúncios demais, poluição visual demais, funcionalidades demais escondidas atrás de um cadastro. O SiteTrace mantém a simplicidade — cada ferramenta é uma página, a resposta é a primeira coisa que você vê, e a página carrega em menos de um segundo. Salve a que precisar, compartilhe, ou volte sempre que algo na internet parecer estranho.',
  fr: 'On en avait assez des sites populaires d\'outils réseau gratuits : trop de publicités, trop de désordre, trop de fonctionnalités cachées derrière une inscription. SiteTrace reste simple — chaque outil est une page, la réponse est la première chose que vous voyez, et la page se charge en moins d\'une seconde. Mettez en favori celle dont vous avez besoin, partagez-la, ou revenez quand quelque chose sur Internet semble anormal.',
  de: 'Wir hatten genug von den üblichen kostenlosen Netzwerk-Tool-Seiten: zu viele Anzeigen, zu viel Unordnung, zu viele Funktionen hinter einer Anmeldung versteckt. SiteTrace bleibt einfach — jedes Tool ist eine Seite, die Antwort ist das Erste, was du siehst, und die Seite lädt in unter einer Sekunde. Lesezeichen für das, was du brauchst, teile es, oder komm zurück, wenn etwas im Internet seltsam wirkt.',
  it: 'Ci eravamo stancati dei soliti siti di strumenti di rete gratuiti: troppe pubblicità, troppo disordine, troppe funzioni nascoste dietro un\'iscrizione. SiteTrace resta semplice — ogni strumento è una pagina, la risposta è la prima cosa che vedi, e la pagina si carica in meno di un secondo. Salva tra i preferiti quello che ti serve, condividilo, o torna quando qualcosa su internet sembra strano.',
  ja: '人気の無料ネットワークツールサイトにうんざりしていました: 広告が多すぎ、整理されておらず、機能の多くが登録の背後に隠されている。SiteTraceはシンプルに保ちます — 各ツールは1ページ、答えは最初に表示されるもの、ページは1秒未満で読み込みます。必要なものをブックマークし、共有し、インターネットで何かおかしいと感じたらいつでも戻ってきてください。',
  zh: '我们受够了那些流行的免费网络工具网站: 广告太多,内容杂乱,太多功能藏在注册墙后面。SiteTrace 保持简单 — 每个工具一个页面,答案就是你看到的第一样东西,页面加载不到一秒。收藏你需要的那个,分享它,或者在网络上感觉哪里不对劲时随时回来。',
};

function escapeForJS(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const langReFor = (code) => new RegExp("^    " + code + ":\\s*\\{", "m");
const nextLangRe = /^    (en|es|pt|fr|de|it|ja|zh|nl|pl|ko|ru|tr|id|vi|sv):\s*\{/gm;

let out = src;
let updated = 0;
let inserted = 0;

for (const code of Object.keys(TR)) {
  const value = TR[code];
  const langMatch = langReFor(code).exec(out);
  if (!langMatch) { console.error(code + ': no block found'); continue; }
  const blockStart = langMatch.index;
  nextLangRe.lastIndex = blockStart + 10;
  const nextMatch = nextLangRe.exec(out);
  const blockEnd = nextMatch ? nextMatch.index : out.length;
  const blockText = out.substring(blockStart, blockEnd);

  // Try to match the existing about_p2 line. CRLF-tolerant.
  const keyRe = new RegExp("(^|\\r?\\n)([ \\t]+)about_p2:\\s*'((?:\\\\'|[^'\\r\\n])*)',?\\s*(?=\\r?\\n)");
  const km = blockText.match(keyRe);
  let newBlock;
  if (km) {
    newBlock = blockText.replace(
      km[0],
      km[1] + km[2] + "about_p2: '" + escapeForJS(value) + "',"
    );
    updated++;
  } else {
    // Insert before the closing `    },`
    const closeRe = /\r?\n    \},(?=\r?\n)/g;
    let lastClose = -1, m;
    while ((m = closeRe.exec(blockText)) !== null) lastClose = m.index;
    if (lastClose < 0) { console.error(code + ': no closing brace'); continue; }
    // Use 6-space indent to match the rest of the block.
    newBlock = blockText.substring(0, lastClose)
      + "\r\n      about_p2: '" + escapeForJS(value) + "',"
      + blockText.substring(lastClose);
    inserted++;
  }

  out = out.substring(0, blockStart) + newBlock + out.substring(blockEnd);
  console.log(code + ': ' + (km ? 'updated' : 'inserted'));
}

fs.writeFileSync(I18N_PATH, out);
console.log('Done. Updated: ' + updated + ', Inserted: ' + inserted);
