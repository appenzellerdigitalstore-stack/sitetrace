#!/usr/bin/env node
// scripts/add-hhd-keys.cjs
// Idempotent: adds hhd_* (http headers) key block to every language in
// js/i18n.js after the existing emd_* block.

'use strict';
const fs = require('fs');
const path = require('path');

const I18N_PATH = path.join(__dirname, '..', 'js', 'i18n.js');

const BLOCKS = {
  en: `      // HTTP headers viewer
      hhd_h1: 'HTTP headers viewer — see any URL’s response headers',
      hhd_subtitle: 'Paste any URL and get the full set of response headers plus a security-header grade (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Free, instant, no login.',
      hhd_intro_h2: 'What this HTTP headers viewer does',
      hhd_intro_text: 'Every HTTP response comes with a set of headers — key-value pairs the server sends before the page body. They tell your browser how to handle the response: how long to cache it, whether to allow scripts, where to redirect, what content type the body is, and so on. Some headers are security-critical (CSP, HSTS, X-Frame-Options); others leak information about the server (Server, X-Powered-By) and should be removed. This tool fetches any public URL, dumps the full response header set, and grades the security headers on a 0–100 scale.',
      hhd_form_label: 'URL to check',
      hhd_form_button: 'Fetch headers',
      hhd_form_hint: 'Or try:',
      hhd_loading: 'Fetching headers…',
      hhd_error: 'Could not fetch that URL.',
      hhd_error_hint: 'Use a full URL starting with http:// or https://. Private IPs and localhost are blocked.',
      hhd_error_invalid: 'Please enter a valid http:// or https:// URL.',
      hhd_error_unreachable: 'The URL could not be reached (timeout, DNS, or network error).',
      hhd_error_too_large: 'The server response was over 2 MB.',
      hhd_results_for: 'Results for',
      hhd_redirected_from: 'Redirected from',
      hhd_grade_label: 'Security grade',
      hhd_present_of_total: '{p} of {t} security headers present',
      hhd_check_pass: 'Present',
      hhd_check_fail: 'Missing',
      hhd_info_leaks_h3: 'Information leaks',
      hhd_info_leaks_desc: 'These headers tell an attacker what stack you run. Most security guides recommend stripping them.',
      hhd_no_info_leaks: 'No information-leaking headers found.',
      hhd_checks_h2: 'Security headers',
      hhd_checks_desc: 'Weighted score: CSP 25, HSTS 20, X-Frame-Options 15, X-Content-Type-Options 10, Referrer-Policy 10, Permissions-Policy 10.',
      hhd_all_headers_h2: 'All response headers',
      hhd_recheck: 'Check another URL',
      hhd_copy: 'Copy as text',
      hhd_how_h2: 'How the security-header grade works',
      hhd_how_text: 'The grade is a 0–100 score built from six weighted security headers. Content-Security-Policy is worth 25 points and is the most commonly missed; Strict-Transport-Security is worth 20; X-Frame-Options is worth 15; X-Content-Type-Options and Referrer-Policy and Permissions-Policy are worth 10 each. A+ means 95+, A is 85–94, B is 70–84, C is 55–69, D is 40–54, and F is below 40. The grade also surfaces any Server, X-Powered-By, or version-leaking headers — these are not scored against you, but they tell an attacker what stack you run, and most security guides recommend stripping them.',
      hhd_related: 'Related tools',
      hhd_faq_h2: 'Frequently asked questions',
      hhd_faq_1_q: 'What are HTTP response headers?',
      hhd_faq_1_a: 'HTTP response headers are key-value pairs the server sends back with every page load, before the page content. They tell your browser how to handle the response: how long to cache it, whether to allow scripts, where to redirect, what content type the body is, and so on. Some headers are security-critical (CSP, HSTS, X-Frame-Options); others leak information about the server (Server, X-Powered-By) and should be removed.',
      hhd_faq_2_q: 'What is the Content-Security-Policy header?',
      hhd_faq_2_a: 'Content-Security-Policy (CSP) is a header that tells the browser which sources of scripts, styles, images, and connections are allowed to load on the page. A well-configured CSP prevents most XSS attacks because even if an attacker injects a script tag, the browser refuses to load the source. A missing or weak CSP is one of the most common security gaps on production sites.',
      hhd_faq_3_q: 'What is Strict-Transport-Security (HSTS)?',
      hhd_faq_3_a: 'Strict-Transport-Security (HSTS) is a header that tells the browser to always use HTTPS for this domain, even if the user types http:// or follows an http:// link. The header includes a max-age in seconds (commonly 31536000, which is one year) and an optional includeSubDomains flag. HSTS prevents downgrade attacks and cookie theft.',
      hhd_faq_4_q: 'Why does my site get a bad grade?',
      hhd_faq_4_a: 'Most production sites miss one or more of the high-weight security headers. The score is a rough guide — a site with no CSP is genuinely at higher risk for XSS, but a site with a strong CSP that breaks half the page is also not safe.',
      hhd_faq_5_q: 'Is this tool safe to use on any URL?',
      hhd_faq_5_a: 'You can use it on any public http:// or https:// URL. Private IPs, localhost, and .local / .internal hostnames are blocked to prevent the tool from being used to scan internal infrastructure.',
`,
  es: `      // Visor de cabeceras HTTP
      hhd_h1: 'Visor de cabeceras HTTP — ve las cabeceras de respuesta de cualquier URL',
      hhd_subtitle: 'Pega cualquier URL y obtén el conjunto completo de cabeceras de respuesta más una calificación de seguridad (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Gratis, instantáneo, sin inicio de sesión.',
      hhd_intro_h2: 'Qué hace este visor de cabeceras HTTP',
      hhd_intro_text: 'Cada respuesta HTTP viene con un conjunto de cabeceras — pares clave-valor que el servidor envía antes del cuerpo de la página. Le dicen a tu navegador cómo manejar la respuesta: cuánto tiempo cachearla, si permite scripts, adónde redirigir, qué tipo de contenido tiene el cuerpo, etc. Algunas cabeceras son críticas para la seguridad (CSP, HSTS, X-Frame-Options); otras filtran información sobre el servidor (Server, X-Powered-By) y conviene eliminar. Esta herramienta obtiene cualquier URL pública, muestra el conjunto completo de cabeceras de respuesta y califica las cabeceras de seguridad en una escala de 0 a 100.',
      hhd_form_label: 'URL a verificar',
      hhd_form_button: 'Obtener cabeceras',
      hhd_form_hint: 'O prueba:',
      hhd_loading: 'Obteniendo cabeceras…',
      hhd_error: 'No se pudo obtener esa URL.',
      hhd_error_hint: 'Usa una URL completa que empiece con http:// o https://. Las IPs privadas y localhost están bloqueadas.',
      hhd_error_invalid: 'Introduce una URL http:// o https:// válida.',
      hhd_error_unreachable: 'No se pudo alcanzar la URL (timeout, DNS o error de red).',
      hhd_error_too_large: 'La respuesta del servidor superó los 2 MB.',
      hhd_results_for: 'Resultados para',
      hhd_redirected_from: 'Redirigido desde',
      hhd_grade_label: 'Calificación de seguridad',
      hhd_present_of_total: '{p} de {t} cabeceras de seguridad presentes',
      hhd_check_pass: 'Presente',
      hhd_check_fail: 'Ausente',
      hhd_info_leaks_h3: 'Filtraciones de información',
      hhd_info_leaks_desc: 'Estas cabeceras le dicen a un atacante qué stack usas. La mayoría de las guías de seguridad recomiendan eliminarlas.',
      hhd_no_info_leaks: 'No se encontraron cabeceras que filtren información.',
      hhd_checks_h2: 'Cabeceras de seguridad',
      hhd_checks_desc: 'Puntuación ponderada: CSP 25, HSTS 20, X-Frame-Options 15, X-Content-Type-Options 10, Referrer-Policy 10, Permissions-Policy 10.',
      hhd_all_headers_h2: 'Todas las cabeceras de respuesta',
      hhd_recheck: 'Verificar otra URL',
      hhd_copy: 'Copiar como texto',
      hhd_how_h2: 'Cómo funciona la calificación de cabeceras de seguridad',
      hhd_how_text: 'La calificación es una puntuación de 0 a 100 construida a partir de seis cabeceras de seguridad ponderadas. Content-Security-Policy vale 25 puntos y es la que más se suele olvidar; Strict-Transport-Security vale 20; X-Frame-Options vale 15; X-Content-Type-Options, Referrer-Policy y Permissions-Policy valen 10 cada una. A+ significa 95+, A es 85–94, B es 70–84, C es 55–69, D es 40–54, y F es menos de 40. La calificación también muestra cualquier cabecera Server, X-Powered-By o que filtre versiones — no se puntúan en contra, pero le dicen a un atacante qué stack usas.',
      hhd_related: 'Herramientas relacionadas',
      hhd_faq_h2: 'Preguntas frecuentes',
      hhd_faq_1_q: '¿Qué son las cabeceras de respuesta HTTP?',
      hhd_faq_1_a: 'Las cabeceras de respuesta HTTP son pares clave-valor que el servidor envía con cada carga de página, antes del contenido. Le dicen a tu navegador cómo manejar la respuesta: cuánto tiempo cachearla, si permite scripts, adónde redirigir, qué tipo de contenido tiene el cuerpo, etc.',
      hhd_faq_2_q: '¿Qué es la cabecera Content-Security-Policy?',
      hhd_faq_2_a: 'Content-Security-Policy (CSP) es una cabecera que le dice al navegador qué fuentes de scripts, estilos, imágenes y conexiones están permitidas en la página. Una CSP bien configurada previene la mayoría de los ataques XSS porque aunque un atacante inyecte un script, el navegador se niega a cargarlo.',
      hhd_faq_3_q: '¿Qué es Strict-Transport-Security (HSTS)?',
      hhd_faq_3_a: 'Strict-Transport-Security (HSTS) es una cabecera que le dice al navegador que use siempre HTTPS para este dominio, incluso si el usuario escribe http://. Incluye un max-age en segundos (comúnmente 31536000, un año) y una opción includeSubDomains. HSTS previene ataques de downgrade y robo de cookies.',
      hhd_faq_4_q: '¿Por qué mi sitio obtiene una mala calificación?',
      hhd_faq_4_a: 'La mayoría de los sitios en producción omiten una o más cabeceras de seguridad de alto peso. La puntuación es una guía aproximada — un sitio sin CSP está en mayor riesgo de XSS, pero un sitio con un CSP fuerte que rompe la mitad de la página tampoco es seguro.',
      hhd_faq_5_q: '¿Es seguro usar esta herramienta con cualquier URL?',
      hhd_faq_5_a: 'Puedes usarla con cualquier URL pública http:// o https://. Las IPs privadas, localhost y los hostnames .local / .internal están bloqueados para evitar que la herramienta se use para escanear infraestructura interna.',
`,
  pt: `      // Visualizador de cabeçalhos HTTP
      hhd_h1: 'Visualizador de cabeçalhos HTTP — veja os cabeçalhos de resposta de qualquer URL',
      hhd_subtitle: 'Cole qualquer URL e obtenha o conjunto completo de cabeçalhos de resposta mais uma nota de segurança (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Grátis, instantâneo, sem cadastro.',
      hhd_intro_h2: 'O que este visualizador de cabeçalhos HTTP faz',
      hhd_intro_text: 'Cada resposta HTTP vem com um conjunto de cabeçalhos — pares chave-valor que o servidor envia antes do corpo da página. Dizem ao seu navegador como tratar a resposta: quanto tempo cachear, se permite scripts, para onde redirecionar, qual o tipo de conteúdo do corpo, e assim por diante. Alguns cabeçalhos são críticos para a segurança (CSP, HSTS, X-Frame-Options); outros vazam informações sobre o servidor (Server, X-Powered-By) e devem ser removidos. Esta ferramenta busca qualquer URL pública, despeja o conjunto completo de cabeçalhos de resposta e dá uma nota de 0 a 100 para os cabeçalhos de segurança.',
      hhd_form_label: 'URL a verificar',
      hhd_form_button: 'Buscar cabeçalhos',
      hhd_form_hint: 'Ou tente:',
      hhd_loading: 'Buscando cabeçalhos…',
      hhd_error: 'Não consegui buscar essa URL.',
      hhd_error_hint: 'Use uma URL completa começando com http:// ou https://. IPs privadas e localhost estão bloqueados.',
      hhd_error_invalid: 'Digite uma URL http:// ou https:// válida.',
      hhd_error_unreachable: 'A URL não pôde ser alcançada (timeout, DNS ou erro de rede).',
      hhd_error_too_large: 'A resposta do servidor passou de 2 MB.',
      hhd_results_for: 'Resultados para',
      hhd_redirected_from: 'Redirecionado de',
      hhd_grade_label: 'Nota de segurança',
      hhd_present_of_total: '{p} de {t} cabeçalhos de segurança presentes',
      hhd_check_pass: 'Presente',
      hhd_check_fail: 'Ausente',
      hhd_info_leaks_h3: 'Vazamentos de informação',
      hhd_info_leaks_desc: 'Esses cabeçalhos dizem a um atacante qual stack você usa. A maioria dos guias de segurança recomenda removê-los.',
      hhd_no_info_leaks: 'Nenhum cabeçalho que vaze informação encontrado.',
      hhd_checks_h2: 'Cabeçalhos de segurança',
      hhd_checks_desc: 'Pontuação ponderada: CSP 25, HSTS 20, X-Frame-Options 15, X-Content-Type-Options 10, Referrer-Policy 10, Permissions-Policy 10.',
      hhd_all_headers_h2: 'Todos os cabeçalhos de resposta',
      hhd_recheck: 'Verificar outra URL',
      hhd_copy: 'Copiar como texto',
      hhd_how_h2: 'Como a nota de cabeçalhos de segurança funciona',
      hhd_how_text: 'A nota é uma pontuação de 0 a 100 construída a partir de seis cabeçalhos de segurança ponderados. Content-Security-Policy vale 25 pontos e é o mais comumente esquecido; Strict-Transport-Security vale 20; X-Frame-Options vale 15; X-Content-Type-Options, Referrer-Policy e Permissions-Policy valem 10 cada um. A+ significa 95+, A é 85–94, B é 70–84, C é 55–69, D é 40–54, e F é menos de 40. A nota também expõe quaisquer cabeçalhos Server, X-Powered-By ou que vazam versão.',
      hhd_related: 'Ferramentas relacionadas',
      hhd_faq_h2: 'Perguntas frequentes',
      hhd_faq_1_q: 'O que são cabeçalhos de resposta HTTP?',
      hhd_faq_1_a: 'Os cabeçalhos de resposta HTTP são pares chave-valor que o servidor envia com cada carregamento de página, antes do conteúdo. Dizem ao seu navegador como tratar a resposta: quanto tempo cachear, se permite scripts, para onde redirecionar, qual o tipo de conteúdo do corpo, e assim por diante.',
      hhd_faq_2_q: 'O que é o cabeçalho Content-Security-Policy?',
      hhd_faq_2_a: 'Content-Security-Policy (CSP) é um cabeçalho que diz ao navegador quais fontes de scripts, estilos, imagens e conexões são permitidas na página. Um CSP bem configurado previne a maioria dos ataques XSS porque mesmo que um atacante injete um script, o navegador se recusa a carregá-lo.',
      hhd_faq_3_q: 'O que é Strict-Transport-Security (HSTS)?',
      hhd_faq_3_a: 'Strict-Transport-Security (HSTS) é um cabeçalho que diz ao navegador para sempre usar HTTPS neste domínio, mesmo que o usuário digite http://. Inclui um max-age em segundos (comumente 31536000, um ano) e uma opção includeSubDomains. HSTS previne ataques de downgrade e roubo de cookies.',
      hhd_faq_4_q: 'Por que meu site tem uma nota ruim?',
      hhd_faq_4_a: 'A maioria dos sites em produção deixa passar um ou mais cabeçalhos de segurança de alto peso. A pontuação é um guia aproximado — um site sem CSP tem risco real de XSS, mas um site com CSP forte que quebra metade da página também não é seguro.',
      hhd_faq_5_q: 'É seguro usar esta ferramenta em qualquer URL?',
      hhd_faq_5_a: 'Pode usar com qualquer URL pública http:// ou https://. IPs privadas, localhost e hostnames .local / .internal são bloqueados para evitar que a ferramenta seja usada para escanear infraestrutura interna.',
`,
  fr: `      // Afficheur d'en-têtes HTTP
      hhd_h1: 'Afficheur d'en-têtes HTTP — voyez les en-têtes de réponse de n'importe quelle URL',
      hhd_subtitle: 'Collez n'importe quelle URL et obtenez l'ensemble complet des en-têtes de réponse plus une note de sécurité (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Gratuit, instantané, sans connexion.',
      hhd_intro_h2: 'Ce que fait cet afficheur d'en-têtes HTTP',
      hhd_intro_text: 'Chaque réponse HTTP est accompagnée d'un jeu d'en-têtes — des paires clé-valeur que le serveur envoie avant le corps de la page. Elles indiquent à votre navigateur comment traiter la réponse : durée de cache, autorisation des scripts, redirection, type de contenu du corps, etc. Certaines en-têtes sont critiques pour la sécurité (CSP, HSTS, X-Frame-Options) ; d'autres fuient des informations sur le serveur (Server, X-Powered-By) et devraient être supprimées. Cet outil récupère n'importe quelle URL publique, affiche l'ensemble des en-têtes de réponse et note les en-têtes de sécurité sur une échelle de 0 à 100.',
      hhd_form_label: 'URL à vérifier',
      hhd_form_button: 'Récupérer les en-têtes',
      hhd_form_hint: 'Ou essayez :',
      hhd_loading: 'Récupération des en-têtes…',
      hhd_error: 'Impossible de récupérer cette URL.',
      hhd_error_hint: 'Utilisez une URL complète commençant par http:// ou https://. Les IP privées et localhost sont bloquées.',
      hhd_error_invalid: 'Veuillez saisir une URL http:// ou https:// valide.',
      hhd_error_unreachable: 'L'URL est injoignable (timeout, DNS ou erreur réseau).',
      hhd_error_too_large: 'La réponse du serveur dépasse 2 Mo.',
      hhd_results_for: 'Résultats pour',
      hhd_redirected_from: 'Redirigé depuis',
      hhd_grade_label: 'Note de sécurité',
      hhd_present_of_total: '{p} en-têtes de sécurité sur {t} présents',
      hhd_check_pass: 'Présent',
      hhd_check_fail: 'Absent',
      hhd_info_leaks_h3: 'Fuites d'informations',
      hhd_info_leaks_desc: 'Ces en-têtes indiquent à un attaquant la stack que vous utilisez. La plupart des guides de sécurité recommandent de les supprimer.',
      hhd_no_info_leaks: 'Aucune en-tête ne fuite d'information.',
      hhd_checks_h2: 'En-têtes de sécurité',
      hhd_checks_desc: 'Score pondéré : CSP 25, HSTS 20, X-Frame-Options 15, X-Content-Type-Options 10, Referrer-Policy 10, Permissions-Policy 10.',
      hhd_all_headers_h2: 'Toutes les en-têtes de réponse',
      hhd_recheck: 'Vérifier une autre URL',
      hhd_copy: 'Copier en texte',
      hhd_how_h2: 'Comment fonctionne la note des en-têtes de sécurité',
      hhd_how_text: 'La note est un score de 0 à 100 construit à partir de six en-têtes de sécurité pondérées. Content-Security-Policy vaut 25 points et est la plus souvent oubliée ; Strict-Transport-Security vaut 20 ; X-Frame-Options vaut 15 ; X-Content-Type-Options, Referrer-Policy et Permissions-Policy valent 10 chacune. A+ signifie 95+, A est 85–94, B est 70–84, C est 55–69, D est 40–54, et F est sous 40.',
      hhd_related: 'Outils associés',
      hhd_faq_h2: 'Questions fréquentes',
      hhd_faq_1_q: 'Que sont les en-têtes de réponse HTTP ?',
      hhd_faq_1_a: 'Les en-têtes de réponse HTTP sont des paires clé-valeur que le serveur envoie à chaque chargement de page, avant le contenu. Elles indiquent à votre navigateur comment traiter la réponse : durée de cache, autorisation des scripts, redirection, type de contenu du corps, etc.',
      hhd_faq_2_q: 'Qu'est-ce que l'en-tête Content-Security-Policy ?',
      hhd_faq_2_a: 'Content-Security-Policy (CSP) est une en-tête qui indique au navigateur quelles sources de scripts, styles, images et connexions sont autorisées sur la page. Une CSP bien configurée prévient la plupart des attaques XSS car même si un attaquant injecte un script, le navigateur refuse de le charger.',
      hhd_faq_3_q: 'Qu'est-ce que Strict-Transport-Security (HSTS) ?',
      hhd_faq_3_a: 'Strict-Transport-Security (HSTS) est une en-tête qui indique au navigateur de toujours utiliser HTTPS pour ce domaine, même si l'utilisateur saisit http://. L'en-tête inclut un max-age en secondes (communément 31536000, soit un an) et une option includeSubDomains. HSTS prévient les attaques de downgrade et le vol de cookies.',
      hhd_faq_4_q: 'Pourquoi mon site a-t-il une mauvaise note ?',
      hhd_faq_4_a: 'La plupart des sites en production omettent une ou plusieurs des en-têtes de sécurité à fort poids. Le score est un guide approximatif — un site sans CSP présente un risque réel de XSS, mais un site avec une CSP forte qui casse la moitié de la page n'est pas sûr non plus.',
      hhd_faq_5_q: 'Cet outil est-il sûr à utiliser sur n'importe quelle URL ?',
      hhd_faq_5_a: 'Vous pouvez l'utiliser sur n'importe quelle URL publique http:// ou https://. Les IP privées, localhost et les noms d'hôte .local / .internal sont bloqués pour empêcher l'outil d'être utilisé pour scanner une infrastructure interne.',
`,
  de: `      // HTTP-Header-Viewer
      hhd_h1: 'HTTP-Header-Viewer — sieh die Antwort-Header jeder URL',
      hhd_subtitle: 'Füge eine beliebige URL ein und erhalte den vollständigen Satz von Antwort-Headern plus eine Sicherheitsbewertung (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Kostenlos, sofort, ohne Anmeldung.',
      hhd_intro_h2: 'Was dieser HTTP-Header-Viewer macht',
      hhd_intro_text: 'Jede HTTP-Antwort kommt mit einem Satz Headern — Schlüssel-Wert-Paare, die der Server vor dem Seitenkörper sendet. Sie sagen deinem Browser, wie er die Antwort behandeln soll: wie lange er sie zwischenspeichern soll, ob er Skripte erlaubt, wohin er weiterleitet, welchen Inhaltstyp der Körper hat, und so weiter. Einige Header sind sicherheitskritisch (CSP, HSTS, X-Frame-Options); andere verraten Informationen über den Server (Server, X-Powered-By) und sollten entfernt werden. Dieses Tool ruft jede öffentliche URL ab, gibt den vollständigen Antwort-Header-Satz aus und bewertet die Sicherheits-Header auf einer Skala von 0 bis 100.',
      hhd_form_label: 'Zu prüfende URL',
      hhd_form_button: 'Header abrufen',
      hhd_form_hint: 'Oder probiere:',
      hhd_loading: 'Rufe Header ab…',
      hhd_error: 'Diese URL konnte nicht abgerufen werden.',
      hhd_error_hint: 'Verwende eine vollständige URL, die mit http:// oder https:// beginnt. Private IPs und localhost sind blockiert.',
      hhd_error_invalid: 'Bitte gib eine gültige http:// oder https:// URL ein.',
      hhd_error_unreachable: 'Die URL war nicht erreichbar (Timeout, DNS- oder Netzwerkfehler).',
      hhd_error_too_large: 'Die Server-Antwort war über 2 MB.',
      hhd_results_for: 'Ergebnisse für',
      hhd_redirected_from: 'Weitergeleitet von',
      hhd_grade_label: 'Sicherheitsbewertung',
      hhd_present_of_total: '{p} von {t} Sicherheits-Headern vorhanden',
      hhd_check_pass: 'Vorhanden',
      hhd_check_fail: 'Fehlt',
      hhd_info_leaks_h3: 'Informationslecks',
      hhd_info_leaks_desc: 'Diese Header verraten einem Angreifer, welchen Stack du nutzt. Die meisten Sicherheits-Leitfäden empfehlen, sie zu entfernen.',
      hhd_no_info_leaks: 'Keine informationslecksenden Header gefunden.',
      hhd_checks_h2: 'Sicherheits-Header',
      hhd_checks_desc: 'Gewichtete Bewertung: CSP 25, HSTS 20, X-Frame-Options 15, X-Content-Type-Options 10, Referrer-Policy 10, Permissions-Policy 10.',
      hhd_all_headers_h2: 'Alle Antwort-Header',
      hhd_recheck: 'Andere URL prüfen',
      hhd_copy: 'Als Text kopieren',
      hhd_how_h2: 'Wie die Sicherheits-Header-Bewertung funktioniert',
      hhd_how_text: 'Die Bewertung ist ein 0–100-Score, der aus sechs gewichteten Sicherheits-Headern berechnet wird. Content-Security-Policy zählt 25 Punkte und wird am häufigsten vergessen; Strict-Transport-Security zählt 20; X-Frame-Options zählt 15; X-Content-Type-Options, Referrer-Policy und Permissions-Policy zählen jeweils 10. A+ bedeutet 95+, A ist 85–94, B ist 70–84, C ist 55–69, D ist 40–54 und F ist unter 40.',
      hhd_related: 'Verwandte Tools',
      hhd_faq_h2: 'Häufige Fragen',
      hhd_faq_1_q: 'Was sind HTTP-Antwort-Header?',
      hhd_faq_1_a: 'HTTP-Antwort-Header sind Schlüssel-Wert-Paare, die der Server bei jedem Seitenaufruf vor dem Inhalt zurückschickt. Sie sagen deinem Browser, wie er die Antwort behandeln soll: wie lange er sie zwischenspeichern soll, ob er Skripte erlaubt, wohin er weiterleitet, welchen Inhaltstyp der Körper hat, und so weiter.',
      hhd_faq_2_q: 'Was ist der Content-Security-Policy-Header?',
      hhd_faq_2_a: 'Content-Security-Policy (CSP) ist ein Header, der dem Browser sagt, welche Quellen für Skripte, Styles, Bilder und Verbindungen auf der Seite erlaubt sind. Eine gut konfigurierte CSP verhindert die meisten XSS-Angriffe, denn selbst wenn ein Angreifer ein Skript-Tag einschleust, weigert sich der Browser, die Quelle zu laden.',
      hhd_faq_3_q: 'Was ist Strict-Transport-Security (HSTS)?',
      hhd_faq_3_a: 'Strict-Transport-Security (HSTS) ist ein Header, der dem Browser sagt, für diese Domain immer HTTPS zu verwenden, auch wenn der Benutzer http:// eingibt. Der Header enthält ein max-age in Sekunden (üblicherweise 31536000, ein Jahr) und optional das includeSubDomains-Flag. HSTS verhindert Downgrade-Angriffe und Cookie-Diebstahl.',
      hhd_faq_4_q: 'Warum bekommt meine Seite eine schlechte Bewertung?',
      hhd_faq_4_a: 'Die meisten produktiven Seiten lassen einen oder mehrere der gewichtigen Sicherheits-Header fehlen. Der Score ist ein grober Anhaltspunkt — eine Seite ohne CSP ist echten XSS-Risiken ausgesetzt, aber eine Seite mit einer starken CSP, die die halbe Seite bricht, ist auch nicht sicher.',
      hhd_faq_5_q: 'Ist dieses Tool für jede URL sicher?',
      hhd_faq_5_a: 'Du kannst es mit jeder öffentlichen http:// oder https:// URL verwenden. Private IPs, localhost und .local / .internal Hostnames werden blockiert, damit das Tool nicht zum Scannen interner Infrastruktur missbraucht wird.',
`,
  it: `      // Visualizzatore di header HTTP
      hhd_h1: 'Visualizzatore di header HTTP — vedi gli header di risposta di qualsiasi URL',
      hhd_subtitle: 'Incolla qualsiasi URL e ottieni l’insieme completo degli header di risposta più un voto di sicurezza (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Gratuito, istantaneo, senza login.',
      hhd_intro_h2: 'Cosa fa questo visualizzatore di header HTTP',
      hhd_intro_text: 'Ogni risposta HTTP arriva con un insieme di header — coppie chiave-valore che il server invia prima del corpo della pagina. Dicono al tuo browser come trattare la risposta: per quanto tempo metterla in cache, se consentire gli script, dove reindirizzare, che tipo di contenuto ha il corpo, e così via. Alcuni header sono critici per la sicurezza (CSP, HSTS, X-Frame-Options); altri fanno trapelare informazioni sul server (Server, X-Powered-By) e andrebbero rimossi. Questo strumento recupera qualsiasi URL pubblica, mostra l’insieme completo degli header di risposta e assegna un voto da 0 a 100 agli header di sicurezza.',
      hhd_form_label: 'URL da verificare',
      hhd_form_button: 'Recupera header',
      hhd_form_hint: 'Oppure prova:',
      hhd_loading: 'Recupero degli header…',
      hhd_error: 'Impossibile recuperare questa URL.',
      hhd_error_hint: 'Usa un URL completo che inizi con http:// o https://. IP private e localhost sono bloccate.',
      hhd_error_invalid: 'Inserisci un URL http:// o https:// valido.',
      hhd_error_unreachable: 'L’URL non è raggiungibile (timeout, DNS o errore di rete).',
      hhd_error_too_large: 'La risposta del server supera i 2 MB.',
      hhd_results_for: 'Risultati per',
      hhd_redirected_from: 'Reindirizzato da',
      hhd_grade_label: 'Voto di sicurezza',
      hhd_present_of_total: '{p} di {t} header di sicurezza presenti',
      hhd_check_pass: 'Presente',
      hhd_check_fail: 'Assente',
      hhd_info_leaks_h3: 'Fughe di informazioni',
      hhd_info_leaks_desc: 'Questi header dicono a un attaccante quale stack usi. La maggior parte delle guide di sicurezza consiglia di rimuoverli.',
      hhd_no_info_leaks: 'Nessun header che fa trapelare informazioni trovato.',
      hhd_checks_h2: 'Header di sicurezza',
      hhd_checks_desc: 'Punteggio ponderato: CSP 25, HSTS 20, X-Frame-Options 15, X-Content-Type-Options 10, Referrer-Policy 10, Permissions-Policy 10.',
      hhd_all_headers_h2: 'Tutti gli header di risposta',
      hhd_recheck: 'Verifica un altro URL',
      hhd_copy: 'Copia come testo',
      hhd_how_h2: 'Come funziona il voto degli header di sicurezza',
      hhd_how_text: 'Il voto è un punteggio da 0 a 100 costruito a partire da sei header di sicurezza ponderati. Content-Security-Policy vale 25 punti ed è il più comunemente dimenticato; Strict-Transport-Security vale 20; X-Frame-Options vale 15; X-Content-Type-Options, Referrer-Policy e Permissions-Policy valgono 10 ciascuno. A+ significa 95+, A è 85–94, B è 70–84, C è 55–69, D è 40–54, e F è sotto 40.',
      hhd_related: 'Strumenti correlati',
      hhd_faq_h2: 'Domande frequenti',
      hhd_faq_1_q: 'Cosa sono gli header di risposta HTTP?',
      hhd_faq_1_a: 'Gli header di risposta HTTP sono coppie chiave-valore che il server invia a ogni caricamento di pagina, prima del contenuto. Dicono al tuo browser come trattare la risposta: per quanto tempo metterla in cache, se consentire gli script, dove reindirizzare, che tipo di contenuto ha il corpo, e così via.',
      hhd_faq_2_q: 'Cos’è l’header Content-Security-Policy?',
      hhd_faq_2_a: 'Content-Security-Policy (CSP) è un header che indica al browser quali fonti di script, stili, immagini e connessioni sono ammesse sulla pagina. Una CSP ben configurata previene la maggior parte degli attacchi XSS perché anche se un attaccante inietta uno script, il browser rifiuta di caricarlo.',
      hhd_faq_3_q: 'Cos’è Strict-Transport-Security (HSTS)?',
      hhd_faq_3_a: 'Strict-Transport-Security (HSTS) è un header che indica al browser di usare sempre HTTPS per questo dominio, anche se l’utente digita http://. L’header include un max-age in secondi (comunemente 31536000, un anno) e un flag opzionale includeSubDomains. HSTS previene attacchi di downgrade e furto di cookie.',
      hhd_faq_4_q: 'Perché il mio sito ottiene un voto basso?',
      hhd_faq_4_a: 'La maggior parte dei siti in produzione salta uno o più degli header di sicurezza ad alto peso. Il punteggio è una guida approssimativa — un sito senza CSP ha un rischio reale di XSS, ma un sito con una CSP forte che rompe metà pagina non è sicuro comunque.',
      hhd_faq_5_q: 'È sicuro usare questo strumento su qualsiasi URL?',
      hhd_faq_5_a: 'Puoi usarlo con qualsiasi URL pubblica http:// o https://. Gli IP privati, localhost e gli hostname .local / .internal sono bloccati per evitare che lo strumento sia usato per scansionare infrastrutture interne.',
`,
};

// Anchor: the closing of the emd block. Last key in emd is `emd_faq_6_a`
// and the value differs per language. Use a regex that finds the
// last `emd_*` key + its value + the closing `    },`.
const EMD_TAIL_REGEX = /\n(      emd_[\s\S]*?,)\n    \},\n/;

const raw = fs.readFileSync(I18N_PATH, 'utf8');
const EOL = raw.indexOf('\r') !== -1 ? '\r\n' : '\n';
const src = raw.replace(/\r/g, '');

let out = src;
let changes = 0;

for (const lang of Object.keys(BLOCKS)) {
  const block = BLOCKS[lang].replace(/\r\n/g, '\n').replace(/\n/g, EOL);
  const tailMatch = EMD_TAIL_REGEX.exec(out);
  if (!tailMatch) {
    // idempotent re-run check
    const langBlockRegex = new RegExp('    ' + lang + ': \\{');
    const m = out.match(langBlockRegex);
    if (m) {
      const startIdx = m.index;
      const rest = out.slice(startIdx);
      const endMatch = rest.match(/\n    \},\n/);
      if (endMatch && rest.indexOf('hhd_h1:') !== -1 && rest.indexOf('hhd_h1:') < endMatch.index) {
        console.log('[' + lang + '] hhd_* already present, skipping');
        continue;
      }
    }
    console.error('[' + lang + '] could not find emd-block tail anchor');
    process.exit(1);
  }
  const headEnd = tailMatch.index;
  const matchedEnd = headEnd + tailMatch[0].length;
  const head = out.slice(0, headEnd);
  const tail2 = out.slice(matchedEnd);
  const lastEmdKeyLine = tailMatch[1];
  out = head + '\n' + lastEmdKeyLine + '\n\n' + block + '    },\n' + tail2;
  changes += 1;
  console.log('[' + lang + '] inserted ' + (block.match(/hhd_/g) || []).length + ' hhd_* keys');
}

if (changes === 0) {
  console.log('No changes made.');
} else {
  const outFinal = out.replace(/\n/g, EOL);
  fs.writeFileSync(I18N_PATH, outFinal, 'utf8');
  console.log('\nWrote ' + I18N_PATH + ' (' + changes + ' languages updated)');
}
