#!/usr/bin/env node
// scripts/add-emd-keys.cjs
// Idempotent: adds emd_* (email deliverability) key block to every
// language in js/i18n.js after the existing snc_* block.

'use strict';
const fs = require('fs');
const path = require('path');

const I18N_PATH = path.join(__dirname, '..', 'js', 'i18n.js');

const BLOCKS = {
  en: `      // Email deliverability
      emd_h1: 'Email deliverability check — SPF, DKIM, DMARC, MX, BIMI',
      emd_subtitle: 'See if a domain is configured to reach the inbox. We query SPF, DKIM (on common selectors), DMARC, MX, and BIMI in parallel and give you a 0–100 score plus a per-record breakdown. Free, instant, no login.',
      emd_intro_h2: 'What this email deliverability check does',
      emd_intro_text: 'Email deliverability is whether your messages reach the inbox — not the spam folder, not a bounce, not a silent drop. Receivers like Gmail, Outlook, and Yahoo check a chain of DNS records on every incoming message: SPF says which servers are allowed to send for you, DKIM proves the message wasn’t tampered with, and DMARC tells the receiver what to do when something fails. This tool queries all five of those public records plus MX (where your incoming mail goes) in one shot and gives you a single score and a per-record diagnosis. No email is sent, no credentials are needed, and nothing leaves your browser except the domain you typed.',
      emd_form_label: 'Domain to check',
      emd_form_button: 'Check deliverability',
      emd_form_hint: 'Or try:',
      emd_loading: 'Querying DNS records…',
      emd_error: 'Could not check that domain.',
      emd_error_hint: 'Use a bare domain like',
      emd_error_invalid: 'Please enter a valid domain (e.g. example.com).',
      emd_results_for: 'Results for',
      emd_score_label: 'Deliverability score',
      emd_risk_low: 'Low risk',
      emd_risk_medium: 'Medium risk',
      emd_risk_high: 'High risk',
      emd_risk_unknown: 'Unknown',
      emd_status_present: 'Present',
      emd_status_missing: 'Missing',
      emd_no_issues: 'No issues found. This domain is properly configured to reach the inbox.',
      emd_issues_h3: 'What to fix',
      emd_issues_found: 'issue(s) found',
      emd_all_good: 'All five records look good.',
      emd_spf_desc: 'Lists the IPs and servers allowed to send mail for this domain.',
      emd_spf_missing_help: 'No SPF record at the apex. Add a TXT record starting with v=spf1 and ending with -all.',
      emd_qualifier: 'Qualifier',
      emd_mechanisms: 'Mechanisms',
      emd_spf_too_many_lookups: 'More than 10 DNS lookups — some receivers will reject. RFC 7208 limit is 10.',
      emd_no_qualifier: 'no qualifier',
      emd_dkim_desc: 'Cryptographic signature proving the message was not altered in transit.',
      emd_dkim_missing_help: 'Probed {n} common selectors and found no DKIM record. Your mail server likely uses a custom selector.',
      emd_selector: 'Selector',
      emd_key_type: 'Key type',
      emd_dmarc_desc: 'Policy telling receivers what to do with mail that fails SPF or DKIM.',
      emd_dmarc_missing_help: 'No DMARC record at _dmarc. Without it, receivers have no instruction on what to do with forged mail.',
      emd_policy: 'Policy',
      emd_subdomain_policy: 'Subdomain policy',
      emd_percentage: 'Percentage',
      emd_aggregate_reports: 'Aggregate reports',
      emd_mx_desc: 'Tells other servers where to deliver mail sent to this domain.',
      emd_mx_missing_help: 'No MX records. This domain cannot receive email.',
      emd_bimi_desc: 'Brand logo in supporting inboxes. Optional.',
      emd_bimi_missing_help: 'No BIMI record. BIMI is optional; only major receivers (Yahoo, Gmail) currently display logos.',
      emd_recheck: 'Check another domain',
      emd_copy: 'Copy summary',
      emd_how_h2: 'How email deliverability checking works',
      emd_how_text: 'When a receiving mail server gets a message claiming to be from your domain, it looks up four public DNS records in parallel: SPF (TXT at the apex), DKIM (TXT at a selector under _domainkey), DMARC (TXT at _dmarc), and MX (where to deliver mail to you). This tool runs the same lookups your recipients run, and scores the configuration from 0 to 100 based on what’s present and whether each record is configured for strict enforcement. A score of 80+ means your domain is properly authenticated; below that, the issues list tells you exactly what to add or change.',
      emd_records_h2: 'SPF, DKIM, DMARC, MX, BIMI — what each one does',
      emd_records_text: 'SPF (Sender Policy Framework) is a TXT record at the apex that lists the IP addresses and servers allowed to send mail for your domain. Receivers reject mail that arrives from a server not on the list. DKIM (DomainKeys Identified Mail) is a cryptographic signature added to outgoing messages; the matching public key is published as a TXT record at <selector>._domainkey.yourdomain.com. DMARC (Domain-based Message Authentication, Reporting, and Conformance) ties SPF and DKIM together with a policy of none, quarantine, or reject. MX records tell other servers where to deliver mail sent to your domain. BIMI (Brand Indicators for Message Identification) is an emerging standard that lets you attach your brand logo to authenticated messages.',
      emd_related: 'Related tools',
      emd_faq_h2: 'Frequently asked questions',
      emd_faq_1_q: 'What is email deliverability?',
      emd_faq_1_a: 'Email deliverability is whether your messages reach the inbox — not the spam folder, not a bounce, not a silent drop. It depends on a chain of DNS records (SPF, DKIM, DMARC) and the reputation of the IP addresses you send from. Receivers like Gmail, Outlook, and Yahoo check these records on every message and use them to decide whether to accept, flag, or reject the mail.',
      emd_faq_2_q: 'What does SPF do?',
      emd_faq_2_a: 'SPF (Sender Policy Framework) is a DNS TXT record that lists the IP addresses and servers allowed to send mail for your domain. When a receiver gets a message claiming to be from you, it checks your SPF record. If the sending server is not on the list, the message is treated as forged. The record looks like v=spf1 ip4:192.0.2.0/24 include:_spf.google.com -all. The -all at the end means "only these sources are allowed, reject everything else" — that is the strict setting.',
      emd_faq_3_q: 'What does DKIM do?',
      emd_faq_3_a: 'DKIM (DomainKeys Identified Mail) is a cryptographic signature that proves the message was not altered in transit and was sent by a server holding the private key. The matching public key is published as a DNS TXT record at <selector>._domainkey.yourdomain.com. Common selectors include default, google, k1, s1, s2, mailgun, and sendgrid.',
      emd_faq_4_q: 'What does DMARC do?',
      emd_faq_4_a: 'DMARC ties SPF and DKIM together and tells receivers what to do when a message fails. A DMARC record at _dmarc.yourdomain.com can be set to p=none (monitor only), p=quarantine (send failing mail to spam), or p=reject (refuse failing mail outright). Without DMARC, receivers have no instruction — they may accept, flag, or reject forged mail however they like.',
      emd_faq_5_q: 'Why does my DKIM record not show up?',
      emd_faq_5_a: 'This tool probes the most common DKIM selectors (default, google, k1, s1, s2, mailgun, sendgrid, and a few others). If your mail server uses a custom selector, it will not be found. To find your actual selector, log into your mail server or ESP and look at the DKIM configuration, or send yourself a real email and inspect the DKIM-Signature header — the part before .dkim in the d= tag is your selector.',
      emd_faq_6_q: 'Will this tool send a real test email?',
      emd_faq_6_a: 'No. It only reads public DNS records (TXT and MX) for the domain you enter. It does not send mail, does not contact the mail server, and does not require any credentials.',
`,
  es: `      // Verificador de entregabilidad de correo
      emd_h1: 'Verificación de entregabilidad de email — SPF, DKIM, DMARC, MX, BIMI',
      emd_subtitle: 'Mira si un dominio está configurado para llegar a la bandeja de entrada. Consultamos SPF, DKIM (en selectores comunes), DMARC, MX y BIMI en paralelo y te damos una puntuación de 0 a 100 más un desglose por registro. Gratis, instantáneo, sin inicio de sesión.',
      emd_intro_h2: 'Qué hace esta verificación de entregabilidad',
      emd_intro_text: 'La entregabilidad de email es si tus mensajes llegan a la bandeja de entrada, no a spam, ni rebotan, ni se pierden silenciosamente. Receptores como Gmail, Outlook y Yahoo verifican una cadena de registros DNS en cada mensaje entrante: SPF dice qué servidores pueden enviar por ti, DKIM prueba que el mensaje no fue alterado y DMARC le dice al receptor qué hacer cuando algo falla. Esta herramienta consulta los cinco registros públicos más MX (a dónde llega tu correo entrante) de una vez y te da una puntuación única y un diagnóstico por registro. No se envía ningún email, no se necesitan credenciales, y nada sale de tu navegador excepto el dominio que escribiste.',
      emd_form_label: 'Dominio a verificar',
      emd_form_button: 'Verificar entregabilidad',
      emd_form_hint: 'O prueba:',
      emd_loading: 'Consultando registros DNS…',
      emd_error: 'No se pudo verificar ese dominio.',
      emd_error_hint: 'Usa un dominio simple como',
      emd_error_invalid: 'Introduce un dominio válido (por ejemplo, example.com).',
      emd_results_for: 'Resultados para',
      emd_score_label: 'Puntuación de entregabilidad',
      emd_risk_low: 'Riesgo bajo',
      emd_risk_medium: 'Riesgo medio',
      emd_risk_high: 'Riesgo alto',
      emd_risk_unknown: 'Desconocido',
      emd_status_present: 'Presente',
      emd_status_missing: 'Ausente',
      emd_no_issues: 'No se detectaron problemas. Este dominio está configurado correctamente para llegar a la bandeja de entrada.',
      emd_issues_h3: 'Qué corregir',
      emd_issues_found: 'problema(s) encontrado(s)',
      emd_all_good: 'Los cinco registros se ven bien.',
      emd_spf_desc: 'Lista las IPs y servidores autorizados a enviar correo para este dominio.',
      emd_spf_missing_help: 'No hay registro SPF en el ápice. Añade un registro TXT que comience con v=spf1 y termine con -all.',
      emd_qualifier: 'Calificador',
      emd_mechanisms: 'Mecanismos',
      emd_spf_too_many_lookups: 'Más de 10 consultas DNS — algunos receptores rechazarán. El límite de RFC 7208 es 10.',
      emd_no_qualifier: 'sin calificador',
      emd_dkim_desc: 'Firma criptográfica que prueba que el mensaje no fue alterado en tránsito.',
      emd_dkim_missing_help: 'Se probaron {n} selectores comunes y no se encontró ningún registro DKIM. Es probable que tu servidor de correo use un selector personalizado.',
      emd_selector: 'Selector',
      emd_key_type: 'Tipo de clave',
      emd_dmarc_desc: 'Política que indica a los receptores qué hacer con el correo que falla SPF o DKIM.',
      emd_dmarc_missing_help: 'No hay registro DMARC en _dmarc. Sin él, los receptores no tienen instrucciones sobre qué hacer con el correo falsificado.',
      emd_policy: 'Política',
      emd_subdomain_policy: 'Política de subdominio',
      emd_percentage: 'Porcentaje',
      emd_aggregate_reports: 'Reportes agregados',
      emd_mx_desc: 'Indica a otros servidores dónde entregar el correo enviado a este dominio.',
      emd_mx_missing_help: 'No hay registros MX. Este dominio no puede recibir correo.',
      emd_bimi_desc: 'Logo de marca en bandejas de entrada compatibles. Opcional.',
      emd_bimi_missing_help: 'No hay registro BIMI. BIMI es opcional; solo los principales receptores (Yahoo, Gmail) muestran logos actualmente.',
      emd_recheck: 'Verificar otro dominio',
      emd_copy: 'Copiar resumen',
      emd_how_h2: 'Cómo funciona la verificación de entregabilidad',
      emd_how_text: 'Cuando un servidor receptor recibe un mensaje que dice ser de tu dominio, consulta cuatro registros DNS públicos en paralelo: SPF (TXT en el ápice), DKIM (TXT en un selector bajo _domainkey), DMARC (TXT en _dmarc) y MX (a dónde entregar el correo a ti). Esta herramienta realiza las mismas consultas que hacen tus destinatarios, y puntúa la configuración de 0 a 100 según lo que está presente y si cada registro está configurado para aplicación estricta. Una puntuación de 80+ significa que tu dominio está autenticado correctamente; por debajo de eso, la lista de problemas te dice exactamente qué añadir o cambiar.',
      emd_records_h2: 'SPF, DKIM, DMARC, MX, BIMI — qué hace cada uno',
      emd_records_text: 'SPF (Sender Policy Framework) es un registro TXT en el ápice que lista las direcciones IP y servidores autorizados a enviar correo por tu dominio. Los receptores rechazan el correo que llega desde un servidor que no está en la lista. DKIM (DomainKeys Identified Mail) es una firma criptográfica que se añade a los mensajes salientes; la clave pública correspondiente se publica como un registro TXT en <selector>._domainkey.tudominio.com. DMARC (Domain-based Message Authentication, Reporting, and Conformance) une SPF y DKIM con una política de none, quarantine o reject. Los registros MX indican a otros servidores dónde entregar el correo enviado a tu dominio. BIMI (Brand Indicators for Message Identification) es un estándar emergente que te permite adjuntar el logo de tu marca a los mensajes autenticados.',
      emd_related: 'Herramientas relacionadas',
      emd_faq_h2: 'Preguntas frecuentes',
      emd_faq_1_q: '¿Qué es la entregabilidad de email?',
      emd_faq_1_a: 'La entregabilidad de email es si tus mensajes llegan a la bandeja de entrada, no a spam, ni rebotan, ni se pierden silenciosamente. Depende de una cadena de registros DNS (SPF, DKIM, DMARC) y de la reputación de las direcciones IP desde las que envías. Receptores como Gmail, Outlook y Yahoo verifican estos registros en cada mensaje y los usan para decidir si aceptan, marcan o rechazan el correo.',
      emd_faq_2_q: '¿Qué hace SPF?',
      emd_faq_2_a: 'SPF (Sender Policy Framework) es un registro TXT de DNS que lista las direcciones IP y servidores autorizados a enviar correo por tu dominio. Cuando un receptor recibe un mensaje que dice ser tuyo, consulta tu registro SPF. Si el servidor que envía no está en la lista, el mensaje se trata como falsificado. El registro se ve como v=spf1 ip4:192.0.2.0/24 include:_spf.google.com -all. El -all al final significa "solo estas fuentes están autorizadas, rechazar todo lo demás" — esa es la configuración estricta.',
      emd_faq_3_q: '¿Qué hace DKIM?',
      emd_faq_3_a: 'DKIM (DomainKeys Identified Mail) es una firma criptográfica que prueba que el mensaje no fue alterado en tránsito y fue enviado por un servidor con la clave privada. La clave pública correspondiente se publica como un registro TXT en <selector>._domainkey.tudominio.com. Los selectores comunes incluyen default, google, k1, s1, s2, mailgun y sendgrid.',
      emd_faq_4_q: '¿Qué hace DMARC?',
      emd_faq_4_a: 'DMARC une SPF y DKIM y le dice a los receptores qué hacer cuando un mensaje falla. Un registro DMARC en _dmarc.tudominio.com puede configurarse como p=none (solo monitorear), p=quarantine (mandar el correo que falla a spam) o p=reject (rechazar el correo que falla por completo). Sin DMARC, los receptores no tienen instrucción — pueden aceptar, marcar o rechazar el correo falsificado como les parezca.',
      emd_faq_5_q: '¿Por qué mi registro DKIM no aparece?',
      emd_faq_5_a: 'Esta herramienta prueba los selectores DKIM más comunes (default, google, k1, s1, s2, mailgun, sendgrid y otros). Si tu servidor de correo usa un selector personalizado, no lo encontrará. Para encontrar tu selector real, entra en tu servidor de correo o ESP y mira la configuración DKIM, o envíate un email real e inspecciona la cabecera DKIM-Signature — la parte antes de .dkim en el campo d= es tu selector.',
      emd_faq_6_q: '¿Esta herramienta envía un email de prueba real?',
      emd_faq_6_a: 'No. Solo lee registros DNS públicos (TXT y MX) del dominio que introduces. No envía correo, no contacta al servidor de correo y no necesita credenciales.',
`,
  pt: `      // Verificador de entregabilidade de email
      emd_h1: 'Verificação de entregabilidade de email — SPF, DKIM, DMARC, MX, BIMI',
      emd_subtitle: 'Veja se um domínio está configurado para chegar à caixa de entrada. Consultamos SPF, DKIM (em seletores comuns), DMARC, MX e BIMI em paralelo e damos uma pontuação de 0 a 100 mais um detalhamento por registro. Grátis, instantâneo, sem cadastro.',
      emd_intro_h2: 'O que esta verificação de entregabilidade faz',
      emd_intro_text: 'A entregabilidade de email é se suas mensagens chegam à caixa de entrada, e não à pasta de spam, nem voltam, nem se perdem em silêncio. Provedores como Gmail, Outlook e Yahoo conferem uma cadeia de registros DNS em cada mensagem recebida: SPF diz quais servidores podem enviar por você, DKIM prova que a mensagem não foi alterada e DMARC diz ao provedor o que fazer quando algo falha. Esta ferramenta consulta os cinco registros públicos mais o MX (para onde vai o email que você recebe) de uma vez e devolve uma pontuação única com diagnóstico por registro. Nenhum email é enviado, nenhuma credencial é necessária, e nada sai do seu navegador a não ser o domínio que você digitou.',
      emd_form_label: 'Domínio a verificar',
      emd_form_button: 'Verificar entregabilidade',
      emd_form_hint: 'Ou tente:',
      emd_loading: 'Consultando registros DNS…',
      emd_error: 'Não consegui verificar esse domínio.',
      emd_error_hint: 'Use um domínio simples como',
      emd_error_invalid: 'Digite um domínio válido (ex.: example.com).',
      emd_results_for: 'Resultados para',
      emd_score_label: 'Pontuação de entregabilidade',
      emd_risk_low: 'Risco baixo',
      emd_risk_medium: 'Risco médio',
      emd_risk_high: 'Risco alto',
      emd_risk_unknown: 'Desconhecido',
      emd_status_present: 'Presente',
      emd_status_missing: 'Ausente',
      emd_no_issues: 'Nenhum problema encontrado. Este domínio está configurado corretamente para chegar à caixa de entrada.',
      emd_issues_h3: 'O que corrigir',
      emd_issues_found: 'problema(s) encontrado(s)',
      emd_all_good: 'Os cinco registros estão OK.',
      emd_spf_desc: 'Lista os IPs e servidores autorizados a enviar email por este domínio.',
      emd_spf_missing_help: 'Sem registro SPF no ápice. Adicione um registro TXT que comece com v=spf1 e termine com -all.',
      emd_qualifier: 'Qualificador',
      emd_mechanisms: 'Mecanismos',
      emd_spf_too_many_lookups: 'Mais de 10 consultas DNS — alguns provedores vão rejeitar. O limite da RFC 7208 é 10.',
      emd_no_qualifier: 'sem qualificador',
      emd_dkim_desc: 'Assinatura criptográfica que prova que a mensagem não foi alterada em trânsito.',
      emd_dkim_missing_help: 'Foram testados {n} seletores comuns e nenhum registro DKIM foi encontrado. Seu servidor de email provavelmente usa um seletor personalizado.',
      emd_selector: 'Seletor',
      emd_key_type: 'Tipo de chave',
      emd_dmarc_desc: 'Política que diz aos provedores o que fazer com emails que falham em SPF ou DKIM.',
      emd_dmarc_missing_help: 'Sem registro DMARC em _dmarc. Sem ele, os provedores não têm instrução sobre o que fazer com emails falsificados.',
      emd_policy: 'Política',
      emd_subdomain_policy: 'Política de subdomínio',
      emd_percentage: 'Percentual',
      emd_aggregate_reports: 'Relatórios agregados',
      emd_mx_desc: 'Diz a outros servidores onde entregar emails enviados a este domínio.',
      emd_mx_missing_help: 'Sem registros MX. Este domínio não pode receber emails.',
      emd_bimi_desc: 'Logo da marca em clientes de email compatíveis. Opcional.',
      emd_bimi_missing_help: 'Sem registro BIMI. BIMI é opcional; apenas os principais provedores (Yahoo, Gmail) mostram logos atualmente.',
      emd_recheck: 'Verificar outro domínio',
      emd_copy: 'Copiar resumo',
      emd_how_h2: 'Como funciona a verificação de entregabilidade',
      emd_how_text: 'Quando um provedor recebe uma mensagem dizendo ser do seu domínio, ele consulta quatro registros DNS públicos em paralelo: SPF (TXT no ápice), DKIM (TXT em um seletor sob _domainkey), DMARC (TXT em _dmarc) e MX (para onde entregar emails para você). Esta ferramenta faz as mesmas consultas que seus destinatários fazem, e pontua a configuração de 0 a 100 conforme o que está presente e se cada registro está configurado para aplicação estrita. Uma pontuação de 80+ significa que seu domínio está autenticado corretamente; abaixo disso, a lista de problemas diz exatamente o que adicionar ou mudar.',
      emd_records_h2: 'SPF, DKIM, DMARC, MX, BIMI — o que cada um faz',
      emd_records_text: 'SPF (Sender Policy Framework) é um registro TXT no ápice que lista os endereços IP e servidores autorizados a enviar email pelo seu domínio. Os provedores rejeitam emails que chegam de um servidor que não está na lista. DKIM (DomainKeys Identified Mail) é uma assinatura criptográfica adicionada às mensagens enviadas; a chave pública correspondente é publicada como um registro TXT em <seletor>._domainkey.seudominio.com. DMARC (Domain-based Message Authentication, Reporting, and Conformance) liga SPF e DKIM com uma política de none, quarantine ou reject. Os registros MX dizem a outros servidores onde entregar emails enviados para o seu domínio. BIMI (Brand Indicators for Message Identification) é um padrão emergente que permite anexar o logo da sua marca a mensagens autenticadas.',
      emd_related: 'Ferramentas relacionadas',
      emd_faq_h2: 'Perguntas frequentes',
      emd_faq_1_q: 'O que é entregabilidade de email?',
      emd_faq_1_a: 'A entregabilidade de email é se suas mensagens chegam à caixa de entrada, e não à pasta de spam, nem voltam, nem se perdem em silêncio. Depende de uma cadeia de registros DNS (SPF, DKIM, DMARC) e da reputação dos endereços IP de onde você envia. Provedores como Gmail, Outlook e Yahoo conferem esses registros em cada mensagem e os usam para decidir se aceitam, marcam ou rejeitam o email.',
      emd_faq_2_q: 'O que o SPF faz?',
      emd_faq_2_a: 'SPF (Sender Policy Framework) é um registro TXT de DNS que lista os endereços IP e servidores autorizados a enviar email pelo seu domínio. Quando um provedor recebe uma mensagem dizendo ser sua, ele consulta seu registro SPF. Se o servidor que está enviando não está na lista, a mensagem é tratada como falsificada. O registro se parece com v=spf1 ip4:192.0.2.0/24 include:_spf.google.com -all. O -all no final significa "apenas essas fontes são permitidas, rejeite todo o resto" — essa é a configuração estrita.',
      emd_faq_3_q: 'O que o DKIM faz?',
      emd_faq_3_a: 'DKIM (DomainKeys Identified Mail) é uma assinatura criptográfica que prova que a mensagem não foi alterada em trânsito e foi enviada por um servidor que possui a chave privada. A chave pública correspondente é publicada como um registro TXT em <seletor>._domainkey.seudominio.com. Os seletores comuns incluem default, google, k1, s1, s2, mailgun e sendgrid.',
      emd_faq_4_q: 'O que o DMARC faz?',
      emd_faq_4_a: 'O DMARC liga o SPF e o DKIM e diz aos provedores o que fazer quando uma mensagem falha. Um registro DMARC em _dmarc.seudominio.com pode ser configurado como p=none (apenas monitorar), p=quarantine (mandar emails que falham para o spam) ou p=reject (recusar completamente emails que falham). Sem DMARC, os provedores não têm instrução — podem aceitar, marcar ou rejeitar emails falsificados como quiserem.',
      emd_faq_5_q: 'Por que meu registro DKIM não aparece?',
      emd_faq_5_a: 'Esta ferramenta testa os seletores DKIM mais comuns (default, google, k1, s1, s2, mailgun, sendgrid e outros). Se o seu servidor de email usa um seletor personalizado, ele não será encontrado. Para descobrir seu seletor real, entre no servidor de email ou no ESP e olhe a configuração de DKIM, ou envie um email real para você mesmo e inspecione o cabeçalho DKIM-Signature — a parte antes de .dkim no campo d= é o seu seletor.',
      emd_faq_6_q: 'Esta ferramenta envia um email de teste real?',
      emd_faq_6_a: 'Não. Ela só lê registros DNS públicos (TXT e MX) do domínio que você informa. Não envia email, não contata o servidor de email e não precisa de credenciais.',
`,
  fr: `      // Vérificateur de délivrabilité
      emd_h1: 'Vérification de délivrabilité des emails — SPF, DKIM, DMARC, MX, BIMI',
      emd_subtitle: 'Voyez si un domaine est configuré pour atteindre la boîte de réception. Nous interrogeons SPF, DKIM (sur les sélecteurs courants), DMARC, MX et BIMI en parallèle et vous donnons un score de 0 à 100 ainsi qu’une analyse par enregistrement. Gratuit, instantané, sans connexion.',
      emd_intro_h2: 'Ce que fait cette vérification de délivrabilité',
      emd_intro_text: 'La délivrabilité d’un email, c’est de savoir si vos messages atteignent la boîte de réception — pas le courrier indésirable, pas un rebond, pas une disparition silencieuse. Les récepteurs comme Gmail, Outlook et Yahoo vérifient une chaîne d’enregistrements DNS à chaque message reçu : SPF indique quels serveurs peuvent envoyer pour vous, DKIM prouve que le message n’a pas été altéré, et DMARC dit au récepteur quoi faire quand quelque chose échoue. Cet outil interroge ces cinq enregistrements publics ainsi que MX (où va votre courrier entrant) en une seule passe et vous donne un score unique et un diagnostic par enregistrement. Aucun email n’est envoyé, aucune identification n’est nécessaire, et rien ne quitte votre navigateur à part le domaine que vous avez saisi.',
      emd_form_label: 'Domaine à vérifier',
      emd_form_button: 'Vérifier la délivrabilité',
      emd_form_hint: 'Ou essayez :',
      emd_loading: 'Interrogation des enregistrements DNS…',
      emd_error: 'Impossible de vérifier ce domaine.',
      emd_error_hint: 'Utilisez un domaine nu comme',
      emd_error_invalid: 'Veuillez saisir un domaine valide (ex. example.com).',
      emd_results_for: 'Résultats pour',
      emd_score_label: 'Score de délivrabilité',
      emd_risk_low: 'Risque faible',
      emd_risk_medium: 'Risque moyen',
      emd_risk_high: 'Risque élevé',
      emd_risk_unknown: 'Inconnu',
      emd_status_present: 'Présent',
      emd_status_missing: 'Absent',
      emd_no_issues: 'Aucun problème détecté. Ce domaine est correctement configuré pour atteindre la boîte de réception.',
      emd_issues_h3: 'À corriger',
      emd_issues_found: 'problème(s) détecté(s)',
      emd_all_good: 'Les cinq enregistrements sont OK.',
      emd_spf_desc: 'Liste les IP et serveurs autorisés à envoyer du courrier pour ce domaine.',
      emd_spf_missing_help: 'Aucun enregistrement SPF à l’apex. Ajoutez un enregistrement TXT commençant par v=spf1 et se terminant par -all.',
      emd_qualifier: 'Qualificateur',
      emd_mechanisms: 'Mécanismes',
      emd_spf_too_many_lookups: 'Plus de 10 requêtes DNS — certains récepteurs rejetteront. La limite RFC 7208 est de 10.',
      emd_no_qualifier: 'sans qualificateur',
      emd_dkim_desc: 'Signature cryptographique prouvant que le message n’a pas été altéré en transit.',
      emd_dkim_missing_help: '{n} sélecteurs courants testés et aucun enregistrement DKIM trouvé. Votre serveur de courrier utilise probablement un sélecteur personnalisé.',
      emd_selector: 'Sélecteur',
      emd_key_type: 'Type de clé',
      emd_dmarc_desc: 'Politique indiquant aux récepteurs quoi faire avec le courrier qui échoue à SPF ou DKIM.',
      emd_dmarc_missing_help: 'Aucun enregistrement DMARC à _dmarc. Sans cela, les récepteurs n’ont aucune instruction sur la marche à suivre face au courrier falsifié.',
      emd_policy: 'Politique',
      emd_subdomain_policy: 'Politique de sous-domaine',
      emd_percentage: 'Pourcentage',
      emd_aggregate_reports: 'Rapports agrégés',
      emd_mx_desc: 'Indique aux autres serveurs où livrer le courrier envoyé à ce domaine.',
      emd_mx_missing_help: 'Aucun enregistrement MX. Ce domaine ne peut pas recevoir d’emails.',
      emd_bimi_desc: 'Logo de marque dans les boîtes de réception compatibles. Facultatif.',
      emd_bimi_missing_help: 'Aucun enregistrement BIMI. BIMI est facultatif ; seuls les principaux récepteurs (Yahoo, Gmail) affichent actuellement des logos.',
      emd_recheck: 'Vérifier un autre domaine',
      emd_copy: 'Copier le résumé',
      emd_how_h2: 'Comment fonctionne la vérification de délivrabilité',
      emd_how_text: 'Lorsqu’un serveur de réception reçoit un message prétendant provenir de votre domaine, il interroge quatre enregistrements DNS publics en parallèle : SPF (TXT à l’apex), DKIM (TXT à un sélecteur sous _domainkey), DMARC (TXT à _dmarc) et MX (où livrer votre courrier). Cet outil effectue les mêmes requêtes que vos destinataires et note la configuration de 0 à 100 selon ce qui est présent et selon que chaque enregistrement est configuré pour une application stricte. Un score de 80+ signifie que votre domaine est correctement authentifié ; en dessous, la liste des problèmes vous indique précisément quoi ajouter ou modifier.',
      emd_records_h2: 'SPF, DKIM, DMARC, MX, BIMI — ce que fait chacun',
      emd_records_text: 'SPF (Sender Policy Framework) est un enregistrement TXT à l’apex qui liste les adresses IP et serveurs autorisés à envoyer du courrier pour votre domaine. Les récepteurs rejettent le courrier qui arrive d’un serveur non listé. DKIM (DomainKeys Identified Mail) est une signature cryptographique ajoutée aux messages sortants ; la clé publique correspondante est publiée en tant qu’enregistrement TXT à <sélecteur>._domainkey.votredomaine.com. DMARC (Domain-based Message Authentication, Reporting, and Conformance) lie SPF et DKIM avec une politique none, quarantine ou reject. Les enregistrements MX indiquent aux autres serveurs où livrer le courrier envoyé à votre domaine. BIMI (Brand Indicators for Message Identification) est une norme émergente qui vous permet d’attacher le logo de votre marque aux messages authentifiés.',
      emd_related: 'Outils associés',
      emd_faq_h2: 'Questions fréquentes',
      emd_faq_1_q: 'Qu’est-ce que la délivrabilité d’un email ?',
      emd_faq_1_a: 'La délivrabilité d’un email, c’est de savoir si vos messages atteignent la boîte de réception — pas le courrier indésirable, pas un rebond, pas une disparition silencieuse. Elle dépend d’une chaîne d’enregistrements DNS (SPF, DKIM, DMARC) et de la réputation des adresses IP d’où vous envoyez. Les récepteurs comme Gmail, Outlook et Yahoo vérifient ces enregistrements à chaque message et les utilisent pour décider d’accepter, de signaler ou de rejeter le courrier.',
      emd_faq_2_q: 'À quoi sert SPF ?',
      emd_faq_2_a: 'SPF (Sender Policy Framework) est un enregistrement TXT DNS qui liste les adresses IP et serveurs autorisés à envoyer du courrier pour votre domaine. Lorsqu’un récepteur reçoit un message prétendant provenir de vous, il vérifie votre enregistrement SPF. Si le serveur qui envoie ne figure pas dans la liste, le message est traité comme falsifié. L’enregistrement ressemble à v=spf1 ip4:192.0.2.0/24 include:_spf.google.com -all. Le -all à la fin signifie « seules ces sources sont autorisées, tout le reste est rejeté » — c’est le réglage strict.',
      emd_faq_3_q: 'À quoi sert DKIM ?',
      emd_faq_3_a: 'DKIM (DomainKeys Identified Mail) est une signature cryptographique qui prouve que le message n’a pas été altéré en transit et qu’il a été envoyé par un serveur détenant la clé privée. La clé publique correspondante est publiée en tant qu’enregistrement TXT à <sélecteur>._domainkey.votredomaine.com. Les sélecteurs courants incluent default, google, k1, s1, s2, mailgun et sendgrid.',
      emd_faq_4_q: 'À quoi sert DMARC ?',
      emd_faq_4_a: 'DMARC lie SPF et DKIM et indique aux récepteurs quoi faire lorsqu’un message échoue. Un enregistrement DMARC à _dmarc.votredomaine.com peut être réglé sur p=none (surveiller uniquement), p=quarantine (envoyer le courrier qui échoue en spam) ou p=reject (refuser le courrier qui échoue). Sans DMARC, les récepteurs n’ont aucune instruction — ils peuvent accepter, signaler ou rejeter le courrier falsifié comme ils l’entendent.',
      emd_faq_5_q: 'Pourquoi mon enregistrement DKIM n’apparaît-il pas ?',
      emd_faq_5_a: 'Cet outil teste les sélecteurs DKIM les plus courants (default, google, k1, s1, s2, mailgun, sendgrid et quelques autres). Si votre serveur de courrier utilise un sélecteur personnalisé, il ne sera pas trouvé. Pour trouver votre sélecteur réel, connectez-vous à votre serveur de courrier ou à votre ESP et regardez la configuration DKIM, ou envoyez-vous un email et inspectez l’en-tête DKIM-Signature — la partie avant .dkim dans le champ d= est votre sélecteur.',
      emd_faq_6_q: 'Cet outil envoie-t-il un email de test réel ?',
      emd_faq_6_a: 'Non. Il lit uniquement les enregistrements DNS publics (TXT et MX) du domaine que vous saisissez. Il n’envoie pas d’email, ne contacte pas le serveur de courrier et n’exige aucune identification.',
`,
  de: `      // E-Mail-Zustellbarkeitsprüfung
      emd_h1: 'E-Mail-Zustellbarkeitsprüfung — SPF, DKIM, DMARC, MX, BIMI',
      emd_subtitle: 'Sieh, ob eine Domain für den Posteingang konfiguriert ist. Wir fragen SPF, DKIM (bei gängigen Selektoren), DMARC, MX und BIMI parallel ab und geben dir eine 0–100-Punktzahl plus eine Aufschlüsselung pro Eintrag. Kostenlos, sofort, ohne Anmeldung.',
      emd_intro_h2: 'Was diese Zustellbarkeitsprüfung macht',
      emd_intro_text: 'E-Mail-Zustellbarkeit bedeutet, ob deine Nachrichten im Posteingang landen — nicht im Spam, nicht als Bounce, nicht im stillen Verschwinden. Empfänger wie Gmail, Outlook und Yahoo prüfen bei jeder eingehenden Nachricht eine Kette von DNS-Einträgen: SPF sagt, welche Server für dich senden dürfen, DKIM beweist, dass die Nachricht nicht verändert wurde, und DMARC sagt dem Empfänger, was er bei einem Fehler tun soll. Dieses Tool fragt alle fünf öffentlichen Einträge sowie MX (wohin deine eingehende Post geht) in einem Rutsch ab und liefert eine einzige Punktzahl sowie eine Diagnose pro Eintrag. Es wird keine E-Mail versendet, es sind keine Zugangsdaten nötig, und es verlässt nichts deinen Browser außer der eingegebenen Domain.',
      emd_form_label: 'Zu prüfende Domain',
      emd_form_button: 'Zustellbarkeit prüfen',
      emd_form_hint: 'Oder probiere:',
      emd_loading: 'Frage DNS-Einträge ab…',
      emd_error: 'Diese Domain konnte nicht geprüft werden.',
      emd_error_hint: 'Verwende eine reine Domain wie',
      emd_error_invalid: 'Bitte gib eine gültige Domain ein (z. B. example.com).',
      emd_results_for: 'Ergebnisse für',
      emd_score_label: 'Zustellbarkeits-Punktzahl',
      emd_risk_low: 'Geringes Risiko',
      emd_risk_medium: 'Mittleres Risiko',
      emd_risk_high: 'Hohes Risiko',
      emd_risk_unknown: 'Unbekannt',
      emd_status_present: 'Vorhanden',
      emd_status_missing: 'Fehlt',
      emd_no_issues: 'Keine Probleme gefunden. Diese Domain ist korrekt für den Posteingang konfiguriert.',
      emd_issues_h3: 'Was zu beheben ist',
      emd_issues_found: 'Problem(e) gefunden',
      emd_all_good: 'Alle fünf Einträge sehen gut aus.',
      emd_spf_desc: 'Listet die IPs und Server auf, die für diese Domain E-Mails versenden dürfen.',
      emd_spf_missing_help: 'Kein SPF-Eintrag am Apex. Füge einen TXT-Eintrag hinzu, der mit v=spf1 beginnt und mit -all endet.',
      emd_qualifier: 'Qualifizierer',
      emd_mechanisms: 'Mechanismen',
      emd_spf_too_many_lookups: 'Mehr als 10 DNS-Abfragen — einige Empfänger werden ablehnen. RFC 7208 erlaubt maximal 10.',
      emd_no_qualifier: 'kein Qualifizierer',
      emd_dkim_desc: 'Kryptografische Signatur, die beweist, dass die Nachricht nicht verändert wurde.',
      emd_dkim_missing_help: '{n} gängige Selektoren geprüft und kein DKIM-Eintrag gefunden. Dein Mailserver verwendet vermutlich einen benutzerdefinierten Selektor.',
      emd_selector: 'Selektor',
      emd_key_type: 'Schlüsseltyp',
      emd_dmarc_desc: 'Richtlinie, die Empfängern sagt, was sie mit E-Mails tun sollen, die SPF oder DKIM nicht bestehen.',
      emd_dmarc_missing_help: 'Kein DMARC-Eintrag unter _dmarc. Ohne ihn haben Empfänger keine Anweisung, was mit gefälschter Post geschehen soll.',
      emd_policy: 'Richtlinie',
      emd_subdomain_policy: 'Subdomain-Richtlinie',
      emd_percentage: 'Prozentsatz',
      emd_aggregate_reports: 'Sammelberichte',
      emd_mx_desc: 'Sagt anderen Servern, wohin sie an diese Domain adressierte Post liefern sollen.',
      emd_mx_missing_help: 'Keine MX-Einträge. Diese Domain kann keine E-Mails empfangen.',
      emd_bimi_desc: 'Markenlogo in unterstützenden Postfächern. Optional.',
      emd_bimi_missing_help: 'Kein BIMI-Eintrag. BIMI ist optional; derzeit zeigen nur große Empfänger (Yahoo, Gmail) Logos an.',
      emd_recheck: 'Andere Domain prüfen',
      emd_copy: 'Zusammenfassung kopieren',
      emd_how_h2: 'Wie die Zustellbarkeitsprüfung funktioniert',
      emd_how_text: 'Wenn ein empfangender Mailserver eine Nachricht erhält, die behauptet, von deiner Domain zu kommen, fragt er vier öffentliche DNS-Einträge parallel ab: SPF (TXT am Apex), DKIM (TXT an einem Selektor unter _domainkey), DMARC (TXT an _dmarc) und MX (wohin Post an dich geliefert wird). Dieses Tool führt dieselben Abfragen durch wie deine Empfänger und bewertet die Konfiguration von 0 bis 100 je nachdem, was vorhanden ist und ob jeder Eintrag auf strenge Durchsetzung eingestellt ist. Eine Punktzahl von 80+ bedeutet, dass deine Domain korrekt authentifiziert ist; darunter sagt dir die Problemliste genau, was du hinzufügen oder ändern solltest.',
      emd_records_h2: 'SPF, DKIM, DMARC, MX, BIMI — was jeder macht',
      emd_records_text: 'SPF (Sender Policy Framework) ist ein TXT-Eintrag am Apex, der die IP-Adressen und Server auflistet, die für deine Domain E-Mails versenden dürfen. Empfänger lehnen Post ab, die von einem nicht gelisteten Server kommt. DKIM (DomainKeys Identified Mail) ist eine kryptografische Signatur, die ausgehenden Nachrichten hinzugefügt wird; der passende öffentliche Schlüssel wird als TXT-Eintrag unter <selektor>._domainkey.deinedomain.de veröffentlicht. DMARC (Domain-based Message Authentication, Reporting, and Conformance) verbindet SPF und DKIM mit einer Richtlinie none, quarantine oder reject. MX-Einträge sagen anderen Servern, wohin sie an deine Domain adressierte Post liefern sollen. BIMI (Brand Indicators for Message Identification) ist ein neuer Standard, mit dem du authentifizierten Nachrichten dein Markenlogo beifügen kannst.',
      emd_related: 'Verwandte Tools',
      emd_faq_h2: 'Häufige Fragen',
      emd_faq_1_q: 'Was ist E-Mail-Zustellbarkeit?',
      emd_faq_1_a: 'E-Mail-Zustellbarkeit bedeutet, ob deine Nachrichten im Posteingang landen — nicht im Spam, nicht als Bounce, nicht im stillen Verschwinden. Sie hängt von einer Kette von DNS-Einträgen (SPF, DKIM, DMARC) und der Reputation der IP-Adressen ab, von denen du sendest. Empfänger wie Gmail, Outlook und Yahoo prüfen diese Einträge bei jeder Nachricht und nutzen sie, um zu entscheiden, ob sie die Post annehmen, markieren oder ablehnen.',
      emd_faq_2_q: 'Was macht SPF?',
      emd_faq_2_a: 'SPF (Sender Policy Framework) ist ein DNS-TXT-Eintrag, der die IP-Adressen und Server auflistet, die für deine Domain E-Mails versenden dürfen. Wenn ein Empfänger eine Nachricht erhält, die behauptet, von dir zu kommen, prüft er deinen SPF-Eintrag. Steht der sendende Server nicht auf der Liste, wird die Nachricht als Fälschung behandelt. Der Eintrag sieht so aus: v=spf1 ip4:192.0.2.0/24 include:_spf.google.com -all. Das -all am Ende bedeutet „nur diese Quellen sind erlaubt, alles andere ablehnen“ — das ist die strenge Einstellung.',
      emd_faq_3_q: 'Was macht DKIM?',
      emd_faq_3_a: 'DKIM (DomainKeys Identified Mail) ist eine kryptografische Signatur, die beweist, dass die Nachricht nicht im Transit verändert wurde und von einem Server versendet wurde, der den privaten Schlüssel besitzt. Der passende öffentliche Schlüssel wird als TXT-Eintrag unter <selektor>._domainkey.deinedomain.de veröffentlicht. Gängige Selektoren sind default, google, k1, s1, s2, mailgun und sendgrid.',
      emd_faq_4_q: 'Was macht DMARC?',
      emd_faq_4_a: 'DMARC verbindet SPF und DKIM und sagt Empfängern, was sie bei einer fehlgeschlagenen Nachricht tun sollen. Ein DMARC-Eintrag unter _dmarc.deinedomain.de kann auf p=none (nur überwachen), p=quarantine (fehlgeschlagene Post in Spam verschieben) oder p=reject (fehlgeschlagene Post komplett ablehnen) gesetzt werden. Ohne DMARC haben Empfänger keine Anweisung — sie können gefälschte Post nach Belieben annehmen, markieren oder ablehnen.',
      emd_faq_5_q: 'Warum wird mein DKIM-Eintrag nicht angezeigt?',
      emd_faq_5_a: 'Dieses Tool prüft die gängigsten DKIM-Selektoren (default, google, k1, s1, s2, mailgun, sendgrid und einige weitere). Wenn dein Mailserver einen benutzerdefinierten Selektor verwendet, wird er nicht gefunden. Um deinen tatsächlichen Selektor herauszufinden, logge dich in deinen Mailserver oder ESP ein und schau in die DKIM-Konfiguration, oder schicke dir selbst eine echte E-Mail und prüfe die DKIM-Signature-Kopfzeile — der Teil vor .dkim im d=-Feld ist dein Selektor.',
      emd_faq_6_q: 'Versendet dieses Tool eine echte Test-E-Mail?',
      emd_faq_6_a: 'Nein. Es liest nur öffentliche DNS-Einträge (TXT und MX) der eingegebenen Domain. Es versendet keine E-Mail, kontaktiert keinen Mailserver und benötigt keine Zugangsdaten.',
`,
  it: `      // Verifica di recapito email
      emd_h1: 'Verifica recapito email — SPF, DKIM, DMARC, MX, BIMI',
      emd_subtitle: 'Scopri se un dominio è configurato per raggiungere la posta in arrivo. Interroghiamo SPF, DKIM (sui selettori comuni), DMARC, MX e BIMI in parallelo e ti diamo un punteggio da 0 a 100 più un dettaglio per record. Gratuito, istantaneo, senza login.',
      emd_intro_h2: 'Cosa fa questa verifica di recapito',
      emd_intro_text: 'Il recapito di un’email è se i tuoi messaggi arrivano nella posta in arrivo, non nello spam, non rimbalzano, non scompaiono nel nulla. I provider come Gmail, Outlook e Yahoo controllano una catena di record DNS a ogni messaggio in arrivo: SPF dice quali server possono inviare per te, DKIM dimostra che il messaggio non è stato alterato, e DMARC dice al provider cosa fare quando qualcosa fallisce. Questo strumento interroga tutti e cinque i record pubblici più MX (dove arriva la posta in entrata) in un colpo solo e restituisce un punteggio unico e una diagnosi per record. Nessuna email viene inviata, non servono credenziali, e nulla esce dal tuo browser a parte il dominio che hai digitato.',
      emd_form_label: 'Dominio da verificare',
      emd_form_button: 'Verifica recapito',
      emd_form_hint: 'Oppure prova:',
      emd_loading: 'Interrogazione dei record DNS…',
      emd_error: 'Impossibile verificare questo dominio.',
      emd_error_hint: 'Usa un dominio semplice come',
      emd_error_invalid: 'Inserisci un dominio valido (es. example.com).',
      emd_results_for: 'Risultati per',
      emd_score_label: 'Punteggio di recapito',
      emd_risk_low: 'Rischio basso',
      emd_risk_medium: 'Rischio medio',
      emd_risk_high: 'Rischio alto',
      emd_risk_unknown: 'Sconosciuto',
      emd_status_present: 'Presente',
      emd_status_missing: 'Assente',
      emd_no_issues: 'Nessun problema trovato. Questo dominio è configurato correttamente per raggiungere la posta in arrivo.',
      emd_issues_h3: 'Cosa correggere',
      emd_issues_found: 'problema/i trovato/i',
      emd_all_good: 'Tutti e cinque i record sono a posto.',
      emd_spf_desc: 'Elenca gli IP e i server autorizzati a inviare posta per questo dominio.',
      emd_spf_missing_help: 'Nessun record SPF all’apice. Aggiungi un record TXT che inizi con v=spf1 e termini con -all.',
      emd_qualifier: 'Qualificatore',
      emd_mechanisms: 'Meccanismi',
      emd_spf_too_many_lookups: 'Più di 10 query DNS — alcuni provider rifiuteranno. Il limite RFC 7208 è 10.',
      emd_no_qualifier: 'senza qualificatore',
      emd_dkim_desc: 'Firma crittografica che dimostra che il messaggio non è stato alterato in transito.',
      emd_dkim_missing_help: 'Abbiamo testato {n} selettori comuni e non abbiamo trovato alcun record DKIM. Il tuo server di posta probabilmente usa un selettore personalizzato.',
      emd_selector: 'Selettore',
      emd_key_type: 'Tipo di chiave',
      emd_dmarc_desc: 'Policy che indica ai provider cosa fare con le email che falliscono SPF o DKIM.',
      emd_dmarc_missing_help: 'Nessun record DMARC su _dmarc. Senza di esso, i provider non hanno istruzioni su come gestire la posta falsificata.',
      emd_policy: 'Policy',
      emd_subdomain_policy: 'Policy per i sottodomini',
      emd_percentage: 'Percentuale',
      emd_aggregate_reports: 'Report aggregati',
      emd_mx_desc: 'Indica agli altri server dove consegnare la posta inviata a questo dominio.',
      emd_mx_missing_help: 'Nessun record MX. Questo dominio non può ricevere email.',
      emd_bimi_desc: 'Logo del marchio nelle caselle di posta compatibili. Opzionale.',
      emd_bimi_missing_help: 'Nessun record BIMI. BIMI è opzionale; al momento solo i principali provider (Yahoo, Gmail) mostrano i loghi.',
      emd_recheck: 'Verifica un altro dominio',
      emd_copy: 'Copia riepilogo',
      emd_how_h2: 'Come funziona la verifica di recapito',
      emd_how_text: 'Quando un server di posta riceve un messaggio che dichiara di provenire dal tuo dominio, interroga quattro record DNS pubblici in parallelo: SPF (TXT all’apice), DKIM (TXT a un selettore sotto _domainkey), DMARC (TXT a _dmarc) e MX (dove consegnare la posta a te). Questo strumento esegue le stesse query dei tuoi destinatari e assegna un punteggio da 0 a 100 in base a cosa è presente e a se ogni record è configurato per l’applicazione rigorosa. Un punteggio di 80+ significa che il tuo dominio è autenticato correttamente; al di sotto, l’elenco dei problemi ti dice esattamente cosa aggiungere o modificare.',
      emd_records_h2: 'SPF, DKIM, DMARC, MX, BIMI — cosa fa ciascuno',
      emd_records_text: 'SPF (Sender Policy Framework) è un record TXT all’apice che elenca gli indirizzi IP e i server autorizzati a inviare posta per il tuo dominio. I provider rifiutano la posta che arriva da un server non in elenco. DKIM (DomainKeys Identified Mail) è una firma crittografica aggiunta ai messaggi in uscita; la chiave pubblica corrispondente è pubblicata come record TXT in <selettore>._domainkey.iltuodominio.com. DMARC (Domain-based Message Authentication, Reporting, and Conformance) collega SPF e DKIM con una policy none, quarantine o reject. I record MX indicano agli altri server dove consegnare la posta inviata al tuo dominio. BIMI (Brand Indicators for Message Identification) è uno standard emergente che ti permette di allegare il logo del tuo marchio ai messaggi autenticati.',
      emd_related: 'Strumenti correlati',
      emd_faq_h2: 'Domande frequenti',
      emd_faq_1_q: 'Cos’è il recapito delle email?',
      emd_faq_1_a: 'Il recapito delle email è se i tuoi messaggi arrivano nella posta in arrivo, non nello spam, non rimbalzano, non scompaiono nel nulla. Dipende da una catena di record DNS (SPF, DKIM, DMARC) e dalla reputazione degli indirizzi IP da cui invii. I provider come Gmail, Outlook e Yahoo controllano questi record a ogni messaggio e li usano per decidere se accettare, segnalare o rifiutare la posta.',
      emd_faq_2_q: 'A cosa serve SPF?',
      emd_faq_2_a: 'SPF (Sender Policy Framework) è un record TXT DNS che elenca gli indirizzi IP e i server autorizzati a inviare posta per il tuo dominio. Quando un provider riceve un messaggio che dichiara di provenire da te, controlla il tuo record SPF. Se il server che invia non è in elenco, il messaggio è trattato come falsificato. Il record si presenta così: v=spf1 ip4:192.0.2.0/24 include:_spf.google.com -all. Il -all alla fine significa “solo queste fonti sono autorizzate, rifiuta tutto il resto” — è l’impostazione rigorosa.',
      emd_faq_3_q: 'A cosa serve DKIM?',
      emd_faq_3_a: 'DKIM (DomainKeys Identified Mail) è una firma crittografica che dimostra che il messaggio non è stato alterato in transito ed è stato inviato da un server che possiede la chiave privata. La chiave pubblica corrispondente è pubblicata come record TXT in <selettore>._domainkey.iltuodominio.com. I selettori comuni includono default, google, k1, s1, s2, mailgun e sendgrid.',
      emd_faq_4_q: 'A cosa serve DMARC?',
      emd_faq_4_a: 'DMARC collega SPF e DKIM e indica ai provider cosa fare quando un messaggio fallisce. Un record DMARC in _dmarc.iltuodominio.com può essere impostato su p=none (solo monitoraggio), p=quarantine (sposta la posta che fallisce in spam) o p=reject (rifiuta completamente la posta che fallisce). Senza DMARC, i provider non hanno istruzioni — possono accettare, segnalare o rifiutare la posta falsificata a loro discrezione.',
      emd_faq_5_q: 'Perché il mio record DKIM non appare?',
      emd_faq_5_a: 'Questo strumento testa i selettori DKIM più comuni (default, google, k1, s1, s2, mailgun, sendgrid e altri). Se il tuo server di posta usa un selettore personalizzato, non verrà trovato. Per trovare il tuo selettore reale, accedi al tuo server di posta o al tuo ESP e guarda la configurazione DKIM, oppure invia un’email reale a te stesso e controlla l’intestazione DKIM-Signature — la parte prima di .dkim nel campo d= è il tuo selettore.',
      emd_faq_6_q: 'Questo strumento invia una vera email di test?',
      emd_faq_6_a: 'No. Legge solo i record DNS pubblici (TXT e MX) del dominio che inserisci. Non invia email, non contatta il server di posta e non richiede credenziali.',
`,
};

// Anchor: the closing `    },` of the language block, found by
// scanning from the snc block start. The snc block always ends with
// `snc_faq_5_a: '...',` followed by `\n    },` (no blank line). We
// use a regex that finds the last key of the snc_* block (any line
// starting with "      snc_") followed by the closing `    },`.
const SNC_TAIL_REGEX = /\n(      snc_[\s\S]*?,)\n    \},\n/;

const raw = fs.readFileSync(I18N_PATH, 'utf8');
const EOL = raw.indexOf('\r') !== -1 ? '\r\n' : '\n';
const src = raw.replace(/\r/g, '');

let out = src;
let changes = 0;

for (const lang of Object.keys(BLOCKS)) {
  const block = BLOCKS[lang].replace(/\r\n/g, '\n').replace(/\n/g, EOL);
  const tailMatch = SNC_TAIL_REGEX.exec(out);
  if (!tailMatch) {
    // idempotent re-run check
    const langBlockRegex = new RegExp('    ' + lang + ': \\{');
    const m = out.match(langBlockRegex);
    if (m) {
      const startIdx = m.index;
      const rest = out.slice(startIdx);
      const endMatch = rest.match(/\n    \},\n/);
      if (endMatch && rest.indexOf('emd_h1:') !== -1 && rest.indexOf('emd_h1:') < endMatch.index) {
        console.log('[' + lang + '] emd_* already present, skipping');
        continue;
      }
    }
    console.error('[' + lang + '] could not find snc-block tail anchor');
    process.exit(1);
  }
  // tailMatch[1] is the last snc key line (without trailing newline).
  // tailMatch[0] includes the trailing \n    },\n.
  // Insert the emd block right before `    },` (after the snc tail).
  // The match ends at the closing `    },\n`; we want to put the
  // emd block between the last snc key and the closing.
  const before = out.slice(0, tailMatch.index + 1);             // up to and including the \n before `      snc_...`
  const lastSncKeyLine = tailMatch[1];                          // e.g. "      snc_faq_5_a: '...',"
  const after = out.slice(tailMatch.index + 1 + lastSncKeyLine.length + 1); // skip the \n after the last snc key
  // The "after" content should now start with `    },\n` (and possibly more).
  // Insert: lastSncKeyLine + \n + emdBlock + `    },` + (whatever after that, starting with `\n` if needed)
  // We want the result to be: ...\n + lastSncKeyLine + \n\n + emdBlock + `    },` + originalAfter
  // Original "after" already starts with `\n` (because the match included the newline before `    },`).
  // Wait — let me re-derive. The match was: `\n      snc_xxx: '...',\n    },\n`
  // So `before` ends right before the leading `\n` of the match.
  // `tailMatch.index` is the index of that leading `\n`.
  // `lastSncKeyLine` is the snc key text.
  // The match includes `\n` + lastSncKeyLine + `\n    },\n` (4 chars at end: \n    },\n).
  // So `tailMatch.index` points to `\n`. We want to insert after lastSncKeyLine's trailing `\n`.
  // out.slice(0, tailMatch.index)  => everything up to and including nothing (before the leading \n)
  // out.slice(0, tailMatch.index) + "\n" + lastSncKeyLine + "\n" + ... rest
  // Actually:
  //   out[tailMatch.index]   = '\n' (the leading \n of the match)
  //   out[tailMatch.index+1] onwards = `      snc_xxx: '...',\n    },\n...`
  // So `out.slice(0, tailMatch.index+1)` = everything up to and including the \n before `snc_xxx`
  //   + lastSncKeyLine (=`      snc_xxx: '...',`)
  //   + `\n    },\n...`
  // We want: `\n + lastSncKeyLine + \n\n + block + `    },\n...`
  //   = out.slice(0, tailMatch.index+1) + lastSncKeyLine + \n\n + block + `    },\n...`
  // The remainder after lastSncKeyLine+`\n    },\n` is in `out` starting at:
  //   tailMatch.index + 1 + lastSncKeyLine.length + 1 + `    },`.length + 1
  // = tailMatch.index + 1 + lastSncKeyLine.length + 7
  // (the +1 is the \n after the snc key, the +5 is `    },`, the +1 is the trailing \n)
  // Wait: the match was `\n      snc_xxx: '...',\n    },\n`. Length = 1 + lastSncKeyLine.length + 1 + 6 + 1 = lastSncKeyLine.length + 9.
  // So remainder starts at tailMatch.index + lastSncKeyLine.length + 9.
  // Let me just use the simpler approach: split on tailMatch[0], insert emd block between.
  // ...actually the cleanest is:
  const tail = tailMatch[0];           // the whole matched text
  const replacement = '\n' + lastSncKeyLine + '\n\n' + block + '    },\n';
  // Replace the first occurrence of `tail` with `replacement` (without the leading \n)
  out = out.replace(tail, tail.replace(lastSncKeyLine + '\n    },\n', lastSncKeyLine + '\n\n' + block + '    },\n'), 1);
  // Actually simpler: split into head + matched + tail, then concatenate.
  const headEnd = tailMatch.index;
  const matchedStart = headEnd;
  const matchedEnd = headEnd + tail.length;
  const head = out.slice(0, matchedStart);
  const tail2 = out.slice(matchedEnd);
  // matched = `\n` + lastSncKeyLine + `\n    },\n`
  // We want: head + `\n` + lastSncKeyLine + `\n\n` + emdBlock + `    },\n` + tail2
  out = head + '\n' + lastSncKeyLine + '\n\n' + block + '    },\n' + tail2;
  changes += 1;
  console.log('[' + lang + '] inserted ' + (block.match(/emd_/g) || []).length + ' emd_* keys');
}

if (changes === 0) {
  console.log('No changes made.');
} else {
  const outFinal = out.replace(/\n/g, EOL);
  fs.writeFileSync(I18N_PATH, outFinal, 'utf8');
  console.log('\nWrote ' + I18N_PATH + ' (' + changes + ' languages updated)');
}
