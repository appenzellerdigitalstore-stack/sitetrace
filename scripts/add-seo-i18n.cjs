// Add i18n keys for the SEO checker UI to all 8 active languages.
// The check names and pass/fail messages are defined in the function
// itself (functions/api/seo-check.js) and are English-only in v1.
// The keys below cover the page UI: hero, form, result labels, FAQ.

const fs = require('fs');
const path = require('path');

const I18N_PATH = path.join(__dirname, '..', 'js', 'i18n.js');
let src = fs.readFileSync(I18N_PATH, 'utf8');

const TR = {
  en: {
    seo_h1: 'Free SEO checker — analyze any page in seconds',
    seo_subtitle: 'Paste a URL, get a full SEO audit. Title, meta description, headings, Open Graph, image alt text, and more. No login, no tracking.',
    seo_intro_h2: 'What this SEO checker does',
    seo_intro_text: 'This tool fetches the URL you give it and runs 12 standard SEO checks: title, meta description, H1, H2, canonical, meta robots, viewport, Open Graph, Twitter Card, image alt text, HTTPS, and word count. Each check has a weight; the total is your score out of 100. Use it on your own pages to find issues, or on a competitor’s to see what they’re doing.',
    seo_input_label: 'URL to check',
    seo_input_placeholder: 'https://example.com',
    seo_check: 'Check now',
    seo_checking: 'Checking…',
    seo_results_for: 'Results for',
    seo_score_label: 'SEO score',
    seo_status_pass: 'Pass',
    seo_status_warn: 'Warning',
    seo_status_fail: 'Fail',
    seo_passing: 'passing',
    seo_warnings: 'warning',
    seo_issues: 'issue',
    seo_passing_plural: 'passing',
    seo_warnings_plural: 'warnings',
    seo_issues_plural: 'issues',
    seo_status_legend: '0–49 needs work · 50–74 ok · 75–100 good',
    seo_recheck: 'Check another URL',
    seo_loading: 'Fetching the page and running checks…',
    seo_error: 'Could not check that URL.',
    seo_error_invalid: 'Please enter a valid http:// or https:// URL.',
    seo_error_unreachable: 'The page could not be reached (timeout, DNS, or network error).',
    seo_error_blocked: 'The page refused the request or blocked the bot.',
    seo_error_too_large: 'The page response was too large to analyze (over 2 MB).',
    seo_faq_h2: 'Frequently asked questions',
    seo_faq_1_q: 'How does this SEO checker work?',
    seo_faq_1_a: 'It fetches the URL you give it (server-side, so CORS does not get in the way), parses the HTML, and runs 12 SEO checks. Each check has a weight; the total is your score out of 100. The check logic and scoring are open in functions/api/seo-check.js so you can see exactly what is being tested.',
    seo_faq_2_q: 'Do you send the URL to anyone else?',
    seo_faq_2_a: 'No. The URL is fetched from Cloudflare’s edge to the target site, and the result is returned to your browser. SiteTrace does not log URLs, does not share them with any third party, and does not store them.',
    seo_faq_3_q: 'What SEO checks are included?',
    seo_faq_3_a: 'Title tag, meta description, H1 (presence and count), H2, canonical URL, meta robots (not accidentally noindex), viewport meta, Open Graph tags (og:title, og:description, og:image), Twitter Card tags, image alt text coverage, HTTPS, and word count.',
    seo_faq_4_q: 'Can I check any URL?',
    seo_faq_4_a: 'Any public http:// or https:// page. Private IPs, localhost, and other internal addresses are blocked for security. The target site must respond to a normal HTTP GET and return HTML.',
    seo_faq_5_q: 'How do I add my own SEO check?',
    seo_faq_5_a: 'Open functions/api/seo-check.js. Add an object to the CHECKS array with an id, a weight, and a run function that returns { pass, value, message }. The function takes care of HTML parsing, scoring, and rendering — you just describe the check. Deploy and the new check appears on the page automatically.',
  },

  es: {
    seo_h1: 'Verificador SEO gratis — analiza cualquier página en segundos',
    seo_subtitle: 'Pega una URL, obtén una auditoría SEO completa. Título, meta descripción, encabezados, Open Graph, texto alternativo de imágenes y más. Sin inicio de sesión, sin rastreo.',
    seo_intro_h2: 'Qué hace este verificador SEO',
    seo_intro_text: 'Esta herramienta obtiene la URL que le das y ejecuta 12 comprobaciones SEO estándar: título, meta descripción, H1, H2, canónica, meta robots, viewport, Open Graph, Twitter Card, texto alternativo de imágenes, HTTPS y conteo de palabras. Cada comprobación tiene un peso; el total es tu puntuación sobre 100.',
    seo_input_label: 'URL a comprobar',
    seo_input_placeholder: 'https://ejemplo.com',
    seo_check: 'Comprobar ahora',
    seo_checking: 'Comprobando…',
    seo_results_for: 'Resultados para',
    seo_score_label: 'Puntuación SEO',
    seo_status_pass: 'Aprobado',
    seo_status_warn: 'Advertencia',
    seo_status_fail: 'Fallo',
    seo_passing: 'aprobado',
    seo_warnings: 'advertencia',
    seo_issues: 'problema',
    seo_passing_plural: 'aprobados',
    seo_warnings_plural: 'advertencias',
    seo_issues_plural: 'problemas',
    seo_status_legend: '0–49 necesita trabajo · 50–74 ok · 75–100 bien',
    seo_recheck: 'Comprobar otra URL',
    seo_loading: 'Obteniendo la página y ejecutando comprobaciones…',
    seo_error: 'No se pudo comprobar esa URL.',
    seo_error_invalid: 'Por favor, introduce una URL http:// o https:// válida.',
    seo_error_unreachable: 'No se pudo acceder a la página (tiempo de espera, DNS o error de red).',
    seo_error_blocked: 'La página rechazó la solicitud o bloqueó al bot.',
    seo_error_too_large: 'La respuesta de la página es demasiado grande para analizarla (más de 2 MB).',
    seo_faq_h2: 'Preguntas frecuentes',
    seo_faq_1_q: '¿Cómo funciona este verificador SEO?',
    seo_faq_1_a: 'Obtiene la URL que le das (del lado del servidor, por lo que CORS no es un problema), analiza el HTML y ejecuta 12 comprobaciones SEO. Cada comprobación tiene un peso; el total es tu puntuación sobre 100.',
    seo_faq_2_q: '¿Envían la URL a alguien más?',
    seo_faq_2_a: 'No. La URL se obtiene desde el edge de Cloudflare al sitio de destino, y el resultado se devuelve a tu navegador. SiteTrace no registra URLs, no las comparte con terceros y no las almacena.',
    seo_faq_3_q: '¿Qué comprobaciones SEO están incluidas?',
    seo_faq_3_a: 'Etiqueta de título, meta descripción, H1 (presencia y conteo), H2, URL canónica, meta robots (que no sea noindex por accidente), meta viewport, etiquetas Open Graph, Twitter Card, cobertura de texto alternativo de imágenes, HTTPS y conteo de palabras.',
    seo_faq_4_q: '¿Puedo comprobar cualquier URL?',
    seo_faq_4_a: 'Cualquier página pública http:// o https://. Las IP privadas, localhost y otras direcciones internas están bloqueadas por seguridad. El sitio de destino debe responder a un GET HTTP normal y devolver HTML.',
    seo_faq_5_q: '¿Cómo añado mi propia comprobación SEO?',
    seo_faq_5_a: 'Abre functions/api/seo-check.js. Añade un objeto a la matriz CHECKS con un id, un peso y una función run que devuelva { pass, value, message }. La función se encarga del análisis HTML, la puntuación y la representación; tú solo describes la comprobación.',
  },

  pt: {
    seo_h1: 'Verificador de SEO gratuito — analise qualquer página em segundos',
    seo_subtitle: 'Cole uma URL, obtenha uma auditoria SEO completa. Título, meta descrição, cabeçalhos, Open Graph, texto alternativo de imagens e mais. Sem cadastro, sem rastreamento.',
    seo_intro_h2: 'O que este verificador de SEO faz',
    seo_intro_text: 'Esta ferramenta busca a URL que você fornece e executa 12 verificações SEO padrão: título, meta descrição, H1, H2, canônica, meta robots, viewport, Open Graph, Twitter Card, texto alternativo de imagens, HTTPS e contagem de palavras. Cada verificação tem um peso; o total é sua pontuação em 100.',
    seo_input_label: 'URL para verificar',
    seo_input_placeholder: 'https://exemplo.com',
    seo_check: 'Verificar agora',
    seo_checking: 'Verificando…',
    seo_results_for: 'Resultados para',
    seo_score_label: 'Pontuação SEO',
    seo_status_pass: 'Aprovado',
    seo_status_warn: 'Aviso',
    seo_status_fail: 'Falha',
    seo_passing: 'aprovado',
    seo_warnings: 'aviso',
    seo_issues: 'problema',
    seo_passing_plural: 'aprovados',
    seo_warnings_plural: 'avisos',
    seo_issues_plural: 'problemas',
    seo_status_legend: '0–49 precisa de trabalho · 50–74 ok · 75–100 bom',
    seo_recheck: 'Verificar outra URL',
    seo_loading: 'Buscando a página e executando verificações…',
    seo_error: 'Não foi possível verificar essa URL.',
    seo_error_invalid: 'Por favor, insira uma URL http:// ou https:// válida.',
    seo_error_unreachable: 'Não foi possível acessar a página (tempo limite, DNS ou erro de rede).',
    seo_error_blocked: 'A página recusou a solicitação ou bloqueou o bot.',
    seo_error_too_large: 'A resposta da página é grande demais para analisar (mais de 2 MB).',
    seo_faq_h2: 'Perguntas frequentes',
    seo_faq_1_q: 'Como funciona este verificador de SEO?',
    seo_faq_1_a: 'Ele busca a URL que você fornece (do lado do servidor, então CORS não atrapalha), analisa o HTML e executa 12 verificações SEO. Cada verificação tem um peso; o total é sua pontuação em 100.',
    seo_faq_2_q: 'Vocês enviam a URL para outra pessoa?',
    seo_faq_2_a: 'Não. A URL é buscada do edge da Cloudflare para o site de destino, e o resultado é devolvido ao seu navegador. O SiteTrace não registra URLs, não as compartilha com terceiros e não as armazena.',
    seo_faq_3_q: 'Quais verificações SEO estão incluídas?',
    seo_faq_3_a: 'Tag de título, meta descrição, H1 (presença e contagem), H2, URL canônica, meta robots (que não seja noindex por acidente), meta viewport, tags Open Graph, Twitter Card, cobertura de texto alternativo de imagens, HTTPS e contagem de palavras.',
    seo_faq_4_q: 'Posso verificar qualquer URL?',
    seo_faq_4_a: 'Qualquer página pública http:// ou https://. IPs privados, localhost e outros endereços internos são bloqueados por segurança. O site de destino deve responder a um GET HTTP normal e retornar HTML.',
    seo_faq_5_q: 'Como adiciono minha própria verificação SEO?',
    seo_faq_5_a: 'Abra functions/api/seo-check.js. Adicione um objeto à matriz CHECKS com um id, um peso e uma função run que retorne { pass, value, message }. A função cuida da análise HTML, pontuação e renderização; você só descreve a verificação.',
  },

  fr: {
    seo_h1: 'Vérificateur SEO gratuit — analysez n\'importe quelle page en quelques secondes',
    seo_subtitle: 'Collez une URL, obtenez un audit SEO complet. Titre, meta description, titres, Open Graph, texte alternatif des images, et plus. Sans connexion, sans suivi.',
    seo_intro_h2: 'Ce que fait ce vérificateur SEO',
    seo_intro_text: 'Cet outil récupère l\'URL que vous donnez et exécute 12 vérifications SEO standard : titre, meta description, H1, H2, canonique, meta robots, viewport, Open Graph, Twitter Card, texte alternatif des images, HTTPS et nombre de mots. Chaque vérification a un poids ; le total est votre score sur 100.',
    seo_input_label: 'URL à vérifier',
    seo_input_placeholder: 'https://exemple.com',
    seo_check: 'Vérifier maintenant',
    seo_checking: 'Vérification…',
    seo_results_for: 'Résultats pour',
    seo_score_label: 'Score SEO',
    seo_status_pass: 'Réussi',
    seo_status_warn: 'Avertissement',
    seo_status_fail: 'Échec',
    seo_passing: 'réussi',
    seo_warnings: 'avertissement',
    seo_issues: 'problème',
    seo_passing_plural: 'réussis',
    seo_warnings_plural: 'avertissements',
    seo_issues_plural: 'problèmes',
    seo_status_legend: '0–49 à améliorer · 50–74 ok · 75–100 bien',
    seo_recheck: 'Vérifier une autre URL',
    seo_loading: 'Récupération de la page et exécution des vérifications…',
    seo_error: 'Impossible de vérifier cette URL.',
    seo_error_invalid: 'Veuillez entrer une URL http:// ou https:// valide.',
    seo_error_unreachable: 'La page n\'a pas pu être atteinte (délai, DNS ou erreur réseau).',
    seo_error_blocked: 'La page a refusé la demande ou bloqué le bot.',
    seo_error_too_large: 'La réponse de la page est trop volumineuse pour être analysée (plus de 2 Mo).',
    seo_faq_h2: 'Questions fréquentes',
    seo_faq_1_q: 'Comment fonctionne ce vérificateur SEO ?',
    seo_faq_1_a: 'Il récupère l\'URL que vous donnez (côté serveur, donc CORS ne pose pas problème), analyse le HTML et exécute 12 vérifications SEO. Chaque vérification a un poids ; le total est votre score sur 100.',
    seo_faq_2_q: 'Envoyez-vous l\'URL à quelqu\'un d\'autre ?',
    seo_faq_2_a: 'Non. L\'URL est récupérée depuis l\'edge de Cloudflare vers le site cible, et le résultat est renvoyé à votre navigateur. SiteTrace n\'enregistre pas les URL, ne les partage avec aucun tiers et ne les stocke pas.',
    seo_faq_3_q: 'Quelles vérifications SEO sont incluses ?',
    seo_faq_3_a: 'Balise title, meta description, H1 (présence et compte), H2, URL canonique, meta robots (pas accidentellement noindex), meta viewport, balises Open Graph, Twitter Card, couverture du texte alternatif des images, HTTPS et nombre de mots.',
    seo_faq_4_q: 'Puis-je vérifier n\'importe quelle URL ?',
    seo_faq_4_a: 'Toute page publique http:// ou https://. Les IP privées, localhost et autres adresses internes sont bloquées pour des raisons de sécurité. Le site cible doit répondre à un GET HTTP normal et renvoyer du HTML.',
    seo_faq_5_q: 'Comment ajouter ma propre vérification SEO ?',
    seo_faq_5_a: 'Ouvrez functions/api/seo-check.js. Ajoutez un objet au tableau CHECKS avec un id, un poids et une fonction run qui renvoie { pass, value, message }. La fonction gère l\'analyse HTML, la notation et le rendu ; vous décrivez simplement la vérification.',
  },

  de: {
    seo_h1: 'Kostenloser SEO-Checker — analysiere jede Seite in Sekunden',
    seo_subtitle: 'URL einfügen, vollständiges SEO-Audit erhalten. Titel, Meta-Beschreibung, Überschriften, Open Graph, Bild-Alt-Texte und mehr. Keine Anmeldung, kein Tracking.',
    seo_intro_h2: 'Was dieser SEO-Checker tut',
    seo_intro_text: 'Dieses Tool ruft die von dir angegebene URL ab und führt 12 Standard-SEO-Prüfungen durch: Titel, Meta-Beschreibung, H1, H2, Canonical, Meta-Robots, Viewport, Open Graph, Twitter Card, Bild-Alt-Texte, HTTPS und Wortanzahl. Jede Prüfung hat eine Gewichtung; die Gesamtsumme ist deine Bewertung von 100.',
    seo_input_label: 'Zu prüfende URL',
    seo_input_placeholder: 'https://beispiel.com',
    seo_check: 'Jetzt prüfen',
    seo_checking: 'Prüfung läuft…',
    seo_results_for: 'Ergebnisse für',
    seo_score_label: 'SEO-Bewertung',
    seo_status_pass: 'Bestanden',
    seo_status_warn: 'Warnung',
    seo_status_fail: 'Fehler',
    seo_passing: 'bestanden',
    seo_warnings: 'Warnung',
    seo_issues: 'Problem',
    seo_passing_plural: 'bestanden',
    seo_warnings_plural: 'Warnungen',
    seo_issues_plural: 'Probleme',
    seo_status_legend: '0–49 überarbeitungsbedürftig · 50–74 ok · 75–100 gut',
    seo_recheck: 'Andere URL prüfen',
    seo_loading: 'Seite wird abgerufen und Prüfungen laufen…',
    seo_error: 'Diese URL konnte nicht geprüft werden.',
    seo_error_invalid: 'Bitte gib eine gültige http:// oder https:// URL ein.',
    seo_error_unreachable: 'Die Seite konnte nicht erreicht werden (Timeout, DNS oder Netzwerkfehler).',
    seo_error_blocked: 'Die Seite hat die Anfrage abgelehnt oder den Bot blockiert.',
    seo_error_too_large: 'Die Seitenantwort ist zu groß zum Analysieren (über 2 MB).',
    seo_faq_h2: 'Häufig gestellte Fragen',
    seo_faq_1_q: 'Wie funktioniert dieser SEO-Checker?',
    seo_faq_1_a: 'Er ruft die von dir angegebene URL ab (serverseitig, also kein CORS-Problem), analysiert das HTML und führt 12 SEO-Prüfungen durch. Jede Prüfung hat eine Gewichtung; die Gesamtsumme ist deine Bewertung von 100.',
    seo_faq_2_q: 'Wird die URL an jemand anderen gesendet?',
    seo_faq_2_a: 'Nein. Die URL wird vom Cloudflare-Edge zur Zielseite abgerufen, und das Ergebnis wird an deinen Browser zurückgegeben. SiteTrace protokolliert keine URLs, gibt sie nicht an Dritte weiter und speichert sie nicht.',
    seo_faq_3_q: 'Welche SEO-Prüfungen sind enthalten?',
    seo_faq_3_a: 'Title-Tag, Meta-Beschreibung, H1 (Vorhandensein und Anzahl), H2, Canonical-URL, Meta-Robots (nicht versehentlich noindex), Viewport-Meta, Open-Graph-Tags, Twitter-Card-Tags, Bild-Alt-Text-Abdeckung, HTTPS und Wortanzahl.',
    seo_faq_4_q: 'Kann ich jede URL prüfen?',
    seo_faq_4_a: 'Jede öffentliche http:// oder https:// Seite. Private IPs, localhost und andere interne Adressen sind aus Sicherheitsgründen blockiert. Die Zielseite muss auf eine normale HTTP-GET-Anfrage antworten und HTML zurückgeben.',
    seo_faq_5_q: 'Wie füge ich meine eigene SEO-Prüfung hinzu?',
    seo_faq_5_a: 'Öffne functions/api/seo-check.js. Füge dem CHECKS-Array ein Objekt mit einer ID, einer Gewichtung und einer Run-Funktion hinzu, die { pass, value, message } zurückgibt. Die Funktion kümmert sich um HTML-Analyse, Bewertung und Darstellung; du beschreibst nur die Prüfung.',
  },

  it: {
    seo_h1: 'Controllore SEO gratuito — analizza qualsiasi pagina in pochi secondi',
    seo_subtitle: 'Incolla un URL, ottieni un audit SEO completo. Titolo, meta descrizione, intestazioni, Open Graph, testo alternativo delle immagini e altro. Senza login, senza tracciamento.',
    seo_intro_h2: 'Cosa fa questo controllore SEO',
    seo_intro_text: 'Questo strumento recupera l\'URL che gli fornisci ed esegue 12 controlli SEO standard: titolo, meta descrizione, H1, H2, canonica, meta robots, viewport, Open Graph, Twitter Card, testo alternativo delle immagini, HTTPS e conteggio parole. Ogni controllo ha un peso; il totale è il tuo punteggio su 100.',
    seo_input_label: 'URL da controllare',
    seo_input_placeholder: 'https://esempio.com',
    seo_check: 'Controlla ora',
    seo_checking: 'Controllo in corso…',
    seo_results_for: 'Risultati per',
    seo_score_label: 'Punteggio SEO',
    seo_status_pass: 'Superato',
    seo_status_warn: 'Avviso',
    seo_status_fail: 'Fallito',
    seo_passing: 'superato',
    seo_warnings: 'avviso',
    seo_issues: 'problema',
    seo_passing_plural: 'superati',
    seo_warnings_plural: 'avvisi',
    seo_issues_plural: 'problemi',
    seo_status_legend: '0–49 da migliorare · 50–74 ok · 75–100 buono',
    seo_recheck: 'Controlla un altro URL',
    seo_loading: 'Recupero della pagina ed esecuzione dei controlli…',
    seo_error: 'Impossibile controllare quell\'URL.',
    seo_error_invalid: 'Inserisci un URL http:// o https:// valido.',
    seo_error_unreachable: 'Impossibile raggiungere la pagina (timeout, DNS o errore di rete).',
    seo_error_blocked: 'La pagina ha rifiutato la richiesta o bloccato il bot.',
    seo_error_too_large: 'La risposta della pagina è troppo grande da analizzare (oltre 2 MB).',
    seo_faq_h2: 'Domande frequenti',
    seo_faq_1_q: 'Come funziona questo controllore SEO?',
    seo_faq_1_a: 'Recupera l\'URL che fornisci (lato server, quindi CORS non è un problema), analizza l\'HTML ed esegue 12 controlli SEO. Ogni controllo ha un peso; il totale è il tuo punteggio su 100.',
    seo_faq_2_q: 'Invii l\'URL a qualcun altro?',
    seo_faq_2_a: 'No. L\'URL viene recuperato dall\'edge di Cloudflare verso il sito di destinazione, e il risultato viene restituito al tuo browser. SiteTrace non registra URL, non li condivide con terze parti e non li memorizza.',
    seo_faq_3_q: 'Quali controlli SEO sono inclusi?',
    seo_faq_3_a: 'Tag title, meta descrizione, H1 (presenza e conteggio), H2, URL canonica, meta robots (non accidentalmente noindex), meta viewport, tag Open Graph, Twitter Card, copertura del testo alternativo delle immagini, HTTPS e conteggio parole.',
    seo_faq_4_q: 'Posso controllare qualsiasi URL?',
    seo_faq_4_a: 'Qualsiasi pagina pubblica http:// o https://. IP privati, localhost e altri indirizzi interni sono bloccati per sicurezza. Il sito di destinazione deve rispondere a un normale GET HTTP e restituire HTML.',
    seo_faq_5_q: 'Come aggiungo il mio controllo SEO?',
    seo_faq_5_a: 'Apri functions/api/seo-check.js. Aggiungi un oggetto all\'array CHECKS con un id, un peso e una funzione run che restituisce { pass, value, message }. La funzione gestisce l\'analisi HTML, il punteggio e il rendering; tu descrivi solo il controllo.',
  },

  ja: {
    seo_h1: '無料SEOチェッカー — 任意のページを数秒で分析',
    seo_subtitle: 'URLを貼り付けて、完全なSEO監査を取得。タイトル、メタ説明、見出し、Open Graph、画像のaltテキストなど。ログイン不要、追跡なし。',
    seo_intro_h2: 'このSEOチェッカーの機能',
    seo_intro_text: 'このツールは指定されたURLを取得し、12の標準SEOチェックを実行します：タイトル、メタ説明、H1、H2、canonical、meta robots、viewport、Open Graph、Twitter Card、画像のaltテキスト、HTTPS、文字数。各チェックには重みがあり、合計が100点満点のスコアです。',
    seo_input_label: 'チェックするURL',
    seo_input_placeholder: 'https://example.com',
    seo_check: '今すぐチェック',
    seo_checking: 'チェック中…',
    seo_results_for: 'の結果',
    seo_score_label: 'SEOスコア',
    seo_status_pass: '合格',
    seo_status_warn: '警告',
    seo_status_fail: '不合格',
    seo_passing: '合格',
    seo_warnings: '警告',
    seo_issues: '問題',
    seo_passing_plural: '合格',
    seo_warnings_plural: '警告',
    seo_issues_plural: '問題',
    seo_status_legend: '0–49 要改善 · 50–74 OK · 75–100 良好',
    seo_recheck: '別のURLをチェック',
    seo_loading: 'ページを取得してチェックを実行中…',
    seo_error: 'そのURLをチェックできませんでした。',
    seo_error_invalid: '有効なhttp://またはhttps://のURLを入力してください。',
    seo_error_unreachable: 'ページに到達できませんでした（タイムアウト、DNS、またはネットワークエラー）。',
    seo_error_blocked: 'ページがリクエストを拒否したか、ボットをブロックしました。',
    seo_error_too_large: 'ページのレスポンスが大きすぎます（2MB超）。',
    seo_faq_h2: 'よくある質問',
    seo_faq_1_q: 'このSEOチェッカーはどのように動作しますか？',
    seo_faq_1_a: '指定されたURLを取得し（サーバーサイドで、CORSの問題なし）、HTMLを解析して12のSEOチェックを実行します。各チェックには重みがあり、合計が100点満点のスコアです。',
    seo_faq_2_q: 'URLを他の誰かに送信しますか？',
    seo_faq_2_a: 'いいえ。URLはCloudflareのエッジからターゲットサイトに取得され、結果はブラウザに返されます。SiteTraceはURLを記録せず、第三者と共有せず、保存しません。',
    seo_faq_3_q: 'どのようなSEOチェックが含まれていますか？',
    seo_faq_3_a: 'タイトルタグ、メタ説明、H1（有無と数）、H2、正規URL、meta robots（誤ってnoindexになっていないか）、ビューポートメタ、Open Graphタグ、Twitter Cardタグ、画像altテキストの網羅率、HTTPS、文字数。',
    seo_faq_4_q: '任意のURLをチェックできますか？',
    seo_faq_4_a: '任意の公開http://またはhttps://ページ。プライベートIP、localhost、その他の内部アドレスはセキュリティ上の理由でブロックされています。',
    seo_faq_5_q: '独自のSEOチェックを追加するには？',
    seo_faq_5_a: 'functions/api/seo-check.jsを開きます。CHECKS配列にid、重み、run関数を持つオブジェクトを追加します。run関数は{ pass, value, message }を返します。HTML解析、スコアリング、レンダリングは関数が処理します。',
  },

  zh: {
    seo_h1: '免费SEO检查器 — 几秒内分析任何页面',
    seo_subtitle: '粘贴URL,获得完整的SEO审计。标题、meta描述、标题标签、Open Graph、图片alt文本等。无需登录,无跟踪。',
    seo_intro_h2: '这个SEO检查器的作用',
    seo_intro_text: '此工具获取您提供的URL并运行12个标准SEO检查:标题、meta描述、H1、H2、canonical、meta robots、viewport、Open Graph、Twitter Card、图片alt文本、HTTPS和字数。每个检查都有权重;总分是100分制的得分。',
    seo_input_label: '要检查的URL',
    seo_input_placeholder: 'https://example.com',
    seo_check: '立即检查',
    seo_checking: '检查中…',
    seo_results_for: '的结果',
    seo_score_label: 'SEO得分',
    seo_status_pass: '通过',
    seo_status_warn: '警告',
    seo_status_fail: '失败',
    seo_passing: '通过',
    seo_warnings: '警告',
    seo_issues: '问题',
    seo_passing_plural: '通过',
    seo_warnings_plural: '警告',
    seo_issues_plural: '问题',
    seo_status_legend: '0–49 需要改进 · 50–74 良好 · 75–100 优秀',
    seo_recheck: '检查另一个URL',
    seo_loading: '正在获取页面并运行检查…',
    seo_error: '无法检查该URL。',
    seo_error_invalid: '请输入有效的http://或https:// URL。',
    seo_error_unreachable: '无法访问该页面(超时、DNS或网络错误)。',
    seo_error_blocked: '该页面拒绝了请求或阻止了机器人。',
    seo_error_too_large: '页面响应过大,无法分析(超过2MB)。',
    seo_faq_h2: '常见问题',
    seo_faq_1_q: '这个SEO检查器是如何工作的?',
    seo_faq_1_a: '它获取您提供的URL(在服务器端,因此CORS不是问题),解析HTML并运行12个SEO检查。每个检查都有权重;总分是100分制的得分。',
    seo_faq_2_q: '你们会把URL发送给其他人吗?',
    seo_faq_2_a: '不会。URL从Cloudflare边缘获取到目标网站,结果返回到您的浏览器。SiteTrace不记录URL,不与任何第三方共享,也不存储它们。',
    seo_faq_3_q: '包含哪些SEO检查?',
    seo_faq_3_a: '标题标签、meta描述、H1(存在和数量)、H2、规范URL、meta robots(没有意外noindex)、viewport meta、Open Graph标签、Twitter Card标签、图片alt文本覆盖率、HTTPS和字数。',
    seo_faq_4_q: '我可以检查任何URL吗?',
    seo_faq_4_a: '任何公共http://或https://页面。出于安全考虑,私有IP、localhost和其他内部地址被阻止。目标网站必须响应正常的HTTP GET并返回HTML。',
    seo_faq_5_q: '如何添加我自己的SEO检查?',
    seo_faq_5_a: '打开functions/api/seo-check.js。向CHECKS数组添加一个带有id、权重和run函数的对象,该函数返回{ pass, value, message }。函数处理HTML解析、评分和渲染;你只需描述检查。',
  },
};

function escapeForJS(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const langReFor = (code) => new RegExp("^    " + code + ":\\s*\\{", "m");
const nextLangRe = /^    (en|es|pt|fr|de|it|ja|zh|nl|pl|ko|ru|tr|id|vi|sv):\s*\{/gm;

let out = src;
let totalInserted = 0, totalUpdated = 0, totalFailures = 0;

for (const code of Object.keys(TR)) {
  const translations = TR[code];
  const langMatch = langReFor(code).exec(out);
  if (!langMatch) { console.error(code + ': no block found'); totalFailures++; continue; }
  const blockStart = langMatch.index;
  nextLangRe.lastIndex = blockStart + 10;
  const nextMatch = nextLangRe.exec(out);
  const blockEnd = nextMatch ? nextMatch.index : out.length;
  const blockText = out.substring(blockStart, blockEnd);

  const closeRe = /\r?\n    \},(?=\r?\n)/g;
  let lastClose = -1, m;
  while ((m = closeRe.exec(blockText)) !== null) lastClose = m.index;
  if (lastClose < 0) {
    console.error(code + ': no closing `    },` found');
    totalFailures++;
    continue;
  }

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
    let closeIdx = -1;
    closeRe.lastIndex = 0;
    while ((m = closeRe.exec(newBlock)) !== null) closeIdx = m.index;
    if (closeIdx < 0) {
      console.error(code + ': no closing brace in updated block');
      totalFailures++;
      continue;
    }
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
  console.log(code + ': inserted=' + missing.length);
}

fs.writeFileSync(I18N_PATH, out);
console.log('Done. Inserted: ' + totalInserted + ', Updated: ' + totalUpdated + ', Failures: ' + totalFailures);
