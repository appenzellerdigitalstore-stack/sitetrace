// Update 3 i18n keys across all 8 active languages:
//   - front_hero_title:    cleaner landing-page hero H1
//   - front_hero_subtitle: lists all 5 tools explicitly
//   - seo_faq_1_a:          rewrites the unclear "open" wording with a concrete
//                            example that mentions the CHECKS array structure
//
// Idempotent. CRLF-tolerant. Re-uses the same regex pattern as the other
// i18n scripts (update-about-p2.cjs, add-support-keys.cjs, etc.).

const fs = require('fs');
const path = require('path');

const I18N_PATH = path.join(__dirname, '..', 'js', 'i18n.js');
let src = fs.readFileSync(I18N_PATH, 'utf8');

const TR = {
  en: {
    front_hero_title: 'Network tools & service status',
    front_hero_subtitle: 'Check your IP, measure latency, resolve DNS, see if a service is up, or audit any page’s SEO. Five free tools, in your browser, no account needed.',
    seo_faq_1_a: 'Each check is a small function in functions/api/seo-check.js — the CHECKS array has 12 objects, each with three fields: an id, a weight (out of 100), and a run function that returns { pass, value, message }. Read the file to see exactly what each check looks for, what makes it pass or fail, and how its score is weighted. The comment block at the top of the file documents how to add a new check (append an object, choose a weight, describe the rule). The function takes care of HTML parsing, scoring, and rendering — you just describe the check.',
  },
  es: {
    front_hero_title: 'Herramientas de red y estado de servicios',
    front_hero_subtitle: 'Consulta tu IP, mide la latencia, resuelve DNS, comprueba si un servicio está caído o audita el SEO de cualquier página. Cinco herramientas gratuitas, en tu navegador, sin registro.',
    seo_faq_1_a: 'Cada comprobación es una pequeña función en functions/api/seo-check.js — la matriz CHECKS tiene 12 objetos, cada uno con tres campos: un id, un peso (sobre 100) y una función run que devuelve { pass, value, message }. Lee el archivo para ver exactamente qué busca cada comprobación, qué la hace pasar o fallar, y cómo se pondera su puntuación. El bloque de comentarios al principio del archivo documenta cómo añadir una nueva comprobación (añade un objeto, elige un peso, describe la regla). La función se encarga del análisis HTML, la puntuación y la representación; tú solo describes la comprobación.',
  },
  pt: {
    front_hero_title: 'Ferramentas de rede e status de serviços',
    front_hero_subtitle: 'Consulte seu IP, meça latência, resolva DNS, veja se um serviço está fora do ar ou audite o SEO de qualquer página. Cinco ferramentas gratuitas, no seu navegador, sem cadastro.',
    seo_faq_1_a: 'Cada verificação é uma pequena função em functions/api/seo-check.js — a matriz CHECKS tem 12 objetos, cada um com três campos: um id, um peso (sobre 100) e uma função run que retorna { pass, value, message }. Leia o arquivo para ver exatamente o que cada verificação procura, o que a faz passar ou falhar, e como sua pontuação é ponderada. O bloco de comentários no topo do arquivo documenta como adicionar uma nova verificação (anexe um objeto, escolha um peso, descreva a regra). A função cuida da análise HTML, pontuação e renderização; você só descreve a verificação.',
  },
  fr: {
    front_hero_title: 'Outils réseau et état des services',
    front_hero_subtitle: 'Consultez votre IP, mesurez la latence, résolvez le DNS, vérifiez si un service est en panne, ou auditez le SEO de n’importe quelle page. Cinq outils gratuits, dans votre navigateur, sans inscription.',
    seo_faq_1_a: 'Chaque vérification est une petite fonction dans functions/api/seo-check.js — le tableau CHECKS contient 12 objets, chacun avec trois champs : un id, un poids (sur 100) et une fonction run qui renvoie { pass, value, message }. Lisez le fichier pour voir exactement ce que chaque vérification recherche, ce qui la fait réussir ou échouer, et comment son score est pondéré. Le bloc de commentaires en haut du fichier documente comment ajouter une nouvelle vérification (ajoutez un objet, choisissez un poids, décrivez la règle). La fonction se charge de l’analyse HTML, de la notation et du rendu ; vous décrivez simplement la vérification.',
  },
  de: {
    front_hero_title: 'Netzwerk-Tools und Service-Status',
    front_hero_subtitle: 'Prüfe deine IP, messe die Latenz, löse DNS auf, sieh nach, ob ein Dienst ausgefallen ist, oder prüfe die SEO einer beliebigen Seite. Fünf kostenlose Tools, in deinem Browser, ohne Anmeldung.',
    seo_faq_1_a: 'Jede Prüfung ist eine kleine Funktion in functions/api/seo-check.js — das CHECKS-Array hat 12 Objekte, jeweils mit drei Feldern: einer ID, einer Gewichtung (von 100) und einer Run-Funktion, die { pass, value, message } zurückgibt. Lies die Datei, um genau zu sehen, was jede Prüfung sucht, was sie bestehen oder fehlschlagen lässt und wie ihre Bewertung gewichtet wird. Der Kommentarblock am Anfang der Datei dokumentiert, wie du eine neue Prüfung hinzufügst (Objekt anhängen, Gewichtung wählen, Regel beschreiben). Die Funktion kümmert sich um HTML-Analyse, Bewertung und Darstellung; du beschreibst nur die Prüfung.',
  },
  it: {
    front_hero_title: 'Strumenti di rete e stato dei servizi',
    front_hero_subtitle: 'Controlla il tuo IP, misura la latenza, risolvi il DNS, verifica se un servizio è giù o analizza il SEO di qualsiasi pagina. Cinque strumenti gratuiti, nel tuo browser, senza registrazione.',
    seo_faq_1_a: 'Ogni controllo è una piccola funzione in functions/api/seo-check.js — l’array CHECKS ha 12 oggetti, ciascuno con tre campi: un id, un peso (su 100) e una funzione run che restituisce { pass, value, message }. Leggi il file per vedere esattamente cosa cerca ogni controllo, cosa lo fa passare o fallire, e come è pesato il suo punteggio. Il blocco di commenti all’inizio del file documenta come aggiungere un nuovo controllo (aggiungi un oggetto, scegli un peso, descrivi la regola). La funzione gestisce l’analisi HTML, il punteggio e il rendering; tu descrivi solo il controllo.',
  },
  ja: {
    front_hero_title: 'ネットワークツールとサービスステータス',
    front_hero_subtitle: 'IPの確認、レイテンシの測定、DNSの解決、サービスの稼働確認、任意のページSEO監査。5つの無料ツールをブラウザで、アカウント不要。',
    seo_faq_1_a: '各チェックは functions/api/seo-check.js の小さな関数です。CHECKS配列には12個のオブジェクトがあり、それぞれ3つのフィールドを持ちます: id、重み（100点満点）、{ pass, value, message }を返す run 関数。ファイルを読んで、各チェックが正確に何を探し、何が合格・不合格を決定し、スコアがどのように重み付けされているかを確認してください。ファイル冒頭のコメントブロックには新しいチェックを追加する方法（オブジェクトを追加、重みを選択、ルールを記述）が記載されています。HTML解析、スコアリング、レンダリングは関数が処理します。あなたはチェックを記述するだけです。',
  },
  zh: {
    front_hero_title: '网络工具和服务状态',
    front_hero_subtitle: '检查你的IP、测量延迟、解析DNS、查看服务是否宕机,或审计任何页面的SEO。五个免费工具,在浏览器中,无需注册。',
    seo_faq_1_a: '每个检查都是 functions/api/seo-check.js 中的一个小函数 —— CHECKS 数组有 12 个对象,每个对象有三个字段:id、权重(满分 100)和返回 { pass, value, message } 的 run 函数。阅读该文件即可了解每个检查具体在找什么、什么算通过、什么算失败、分数如何加权。文件开头的注释块记录了如何添加新检查(追加一个对象、选择权重、描述规则)。函数负责 HTML 解析、评分和渲染;你只需要描述检查。',
  },
};

function escapeForJS(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const langReFor = (code) => new RegExp("^    " + code + ":\\s*\\{", "m");
const nextLangRe = /^    (en|es|pt|fr|de|it|ja|zh|nl|pl|ko|ru|tr|id|vi|sv):\s*\{/gm;

let out = src;
let totalUpdated = 0, totalInserted = 0, totalFailures = 0;

for (const code of Object.keys(TR)) {
  const translations = TR[code];
  const langMatch = langReFor(code).exec(out);
  if (!langMatch) { console.error(code + ': no block found'); totalFailures++; continue; }
  const blockStart = langMatch.index;
  nextLangRe.lastIndex = blockStart + 10;
  const nm = nextLangRe.exec(out);
  const blockEnd = nm ? nm.index : out.length;
  const blockText = out.substring(blockStart, blockEnd);

  let newBlock = blockText;
  const missing = [];

  for (const key of Object.keys(translations)) {
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
    const closeRe = /\r?\n    \},(?=\r?\n)/g;
    let closeIdx = -1, m;
    closeRe.lastIndex = 0;
    while ((m = closeRe.exec(newBlock)) !== null) closeIdx = m.index;
    if (closeIdx < 0) { console.error(code + ': no closing brace'); totalFailures++; continue; }
    const beforeClose = newBlock.substring(0, closeIdx);
    const firstNewline = beforeClose.indexOf('\n');
    const afterHeader = firstNewline >= 0 ? beforeClose.substring(firstNewline + 1) : beforeClose;
    const lineMatch = afterHeader.match(/(^|\r?\n)([ \t]{4,})\S+: /);
    const indent = lineMatch ? lineMatch[2] : '      ';
    const insertion = '\r\n' + missing.map((k) =>
      indent + k + ": '" + escapeForJS(translations[k]) + "',"
    ).join('\r\n');
    newBlock = newBlock.substring(0, closeIdx) + insertion + newBlock.substring(closeIdx);
    totalInserted += missing.length;
  }

  out = out.substring(0, blockStart) + newBlock + out.substring(blockEnd);
  console.log(code + ': updated=' + (3 - missing.length) + ' inserted=' + missing.length);
}

fs.writeFileSync(I18N_PATH, out);
console.log('Done. Updated: ' + totalUpdated + ', Inserted: ' + totalInserted + ', Failures: ' + totalFailures);
