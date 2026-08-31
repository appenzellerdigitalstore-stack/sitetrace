// Add 4 front_feature_seo_* keys to all 8 languages for the landing page card.
const fs = require('fs');
const path = require('path');

const I18N_PATH = path.join(__dirname, '..', 'js', 'i18n.js');
let src = fs.readFileSync(I18N_PATH, 'utf8');

const TR = {
  en: {
    front_feature_seo_title: 'Free SEO checker',
    front_feature_seo_desc: 'Paste any URL and get a 12-point SEO audit in seconds: title, meta description, H1, canonical, Open Graph, image alt text, and more. No signup.',
    front_feature_seo_eyebrow: 'New',
    front_feature_seo_cta: 'Check any URL →',
  },
  es: {
    front_feature_seo_title: 'Verificador SEO gratis',
    front_feature_seo_desc: 'Pega cualquier URL y obtén una auditoría SEO de 12 puntos en segundos: título, meta descripción, H1, canónica, Open Graph, texto alternativo de imágenes y más. Sin registro.',
    front_feature_seo_eyebrow: 'Nuevo',
    front_feature_seo_cta: 'Comprobar URL →',
  },
  pt: {
    front_feature_seo_title: 'Verificador de SEO gratuito',
    front_feature_seo_desc: 'Cole qualquer URL e obtenha uma auditoria SEO de 12 pontos em segundos: título, meta descrição, H1, canônica, Open Graph, texto alternativo de imagens e mais. Sem cadastro.',
    front_feature_seo_eyebrow: 'Novo',
    front_feature_seo_cta: 'Verificar URL →',
  },
  fr: {
    front_feature_seo_title: 'Vérificateur SEO gratuit',
    front_feature_seo_desc: 'Collez n\'importe quelle URL et obtenez un audit SEO de 12 points en quelques secondes : titre, meta description, H1, canonique, Open Graph, texte alternatif des images, et plus. Sans inscription.',
    front_feature_seo_eyebrow: 'Nouveau',
    front_feature_seo_cta: 'Vérifier une URL →',
  },
  de: {
    front_feature_seo_title: 'Kostenloser SEO-Checker',
    front_feature_seo_desc: 'Füge eine beliebige URL ein und erhalte in Sekunden ein 12-Punkte-SEO-Audit: Titel, Meta-Beschreibung, H1, Canonical, Open Graph, Bild-Alt-Texte und mehr. Keine Anmeldung.',
    front_feature_seo_eyebrow: 'Neu',
    front_feature_seo_cta: 'URL prüfen →',
  },
  it: {
    front_feature_seo_title: 'Controllore SEO gratuito',
    front_feature_seo_desc: 'Incolla qualsiasi URL e ottieni un audit SEO di 12 punti in pochi secondi: titolo, meta descrizione, H1, canonica, Open Graph, testo alternativo delle immagini e altro. Senza registrazione.',
    front_feature_seo_eyebrow: 'Nuovo',
    front_feature_seo_cta: 'Controlla un URL →',
  },
  ja: {
    front_feature_seo_title: '無料SEOチェッカー',
    front_feature_seo_desc: '任意のURLを貼り付けて、12ポイントのSEO監査を数秒で取得:タイトル、メタ説明、H1、正規URL、Open Graph、画像altテキストなど。登録不要。',
    front_feature_seo_eyebrow: '新着',
    front_feature_seo_cta: 'URLをチェック →',
  },
  zh: {
    front_feature_seo_title: '免费SEO检查器',
    front_feature_seo_desc: '粘贴任何URL,几秒钟内获得12点SEO审计:标题、meta描述、H1、规范URL、Open Graph、图片alt文本等。无需注册。',
    front_feature_seo_eyebrow: '新',
    front_feature_seo_cta: '检查URL →',
  },
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

  const closeRe = /\r?\n    \},(?=\r?\n)/g;
  let lastClose = -1, m;
  while ((m = closeRe.exec(blockText)) !== null) lastClose = m.index;
  if (lastClose < 0) continue;

  const missing = [];
  for (const key of Object.keys(TR[code])) {
    const keyRe = new RegExp("(^|\\r?\\n)([ \\t]+)" + key + ":\\s*(?:'((?:\\\\'|[^'\\r\\n])*)'|\"((?:\\\\\"|[^\"\\r\\n])*)\"),?\\s*(?=\\r?\\n)");
    const km = blockText.match(keyRe);
    if (km) {
      const indent = km[2];
      blockText = blockText.replace(km[0], km[1] + indent + key + ": '" + escapeForJS(TR[code][key]) + "',");
      totalUpdated++;
    } else {
      missing.push(key);
    }
  }
  if (missing.length) {
    let closeIdx = -1;
    closeRe.lastIndex = 0;
    while ((m = closeRe.exec(blockText)) !== null) closeIdx = m.index;
    if (closeIdx < 0) continue;
    const beforeClose = blockText.substring(0, closeIdx);
    const firstNewline = beforeClose.indexOf('\n');
    const afterHeader = firstNewline >= 0 ? beforeClose.substring(firstNewline + 1) : beforeClose;
    const lineMatch = afterHeader.match(/(^|\r?\n)([ \t]{4,})\S+: /);
    const indent = lineMatch ? lineMatch[2] : '      ';
    const insertion = '\r\n' + missing.map((k) => indent + k + ": '" + escapeForJS(TR[code][k]) + "',").join('\r\n');
    blockText = blockText.substring(0, closeIdx) + insertion + blockText.substring(closeIdx);
    totalInserted += missing.length;
  }
  out = out.substring(0, blockStart) + blockText + out.substring(blockEnd);
}

fs.writeFileSync(I18N_PATH, out);
console.log('front_feature_seo_*: updated=' + totalUpdated + ' inserted=' + totalInserted);
