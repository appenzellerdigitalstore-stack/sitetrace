/* ================================================================
 * SiteTrace — Lightweight i18n Module
 * Supports: English, Spanish, Portuguese, French
 * Auto-detects browser language, exposes manual switcher.
 * ================================================================ */
(function (global) {
  'use strict';

  // ---- Translation dictionaries ----------------------------------
  const dictionaries = {
    en: {
      // Brand & nav
      brand: 'SiteTrace',
      tagline: 'Quick, private network tools',
      nav_home: 'Home',
      nav_whatismyip: 'What is my IP',
      nav_ping: 'Ping',
      nav_dns: 'DNS Tools',
      nav_about: 'About',
      nav_privacy: 'Privacy',
      language: 'Language',

      // Landing page
      front_hero_eyebrow: 'Fast. Private. Free.',
      front_hero_title: 'See what the internet sees about you',
      front_hero_subtitle: 'Three clean tools to check your IP, test your connection speed, and look up domain records — all in your browser, no account needed.',
      front_feature_eyebrow: 'Pick a tool',
      front_feature_ip_title: 'What is my IP?',
      front_feature_ip_desc: 'Your public IP, approximate location, ISP, and whether your connection is exposed, behind a VPN, or using a proxy. Loaded in under a second.',
      front_feature_ping_title: 'Ping & latency test',
      front_feature_ping_desc: 'Measure round-trip time to 9 global servers (Cloudflare, Google, GitHub, Amazon, Microsoft, Apple, and more). Updates live every few seconds.',
      front_feature_dns_title: 'DNS lookup',
      front_feature_dns_desc: 'Resolve any domain to its A, AAAA, MX, TXT, NS, CNAME, or SOA records via DNS-over-HTTPS. See which resolver answered.',
      front_cta: 'Open',
      front_how_title: 'How it works',
      front_how_text: 'Every check runs directly from your browser — we don\'t keep logs, we don\'t run analytics on your data, and your IP lookups aren\'t tied to a session. Each request is made by your browser to public DNS and IP-geo services, and the response is rendered locally.',
      front_trust_title: 'No accounts. No tracking. No nonsense.',
      front_trust_text: 'SiteTrace is a small, independent tool built for people who want quick answers without giving up their data. There is nothing to install, nothing to sign up for, and nothing sold to advertisers about you specifically.',

      // Page-specific meta
      page_ip_title: 'What Is My IP? — SiteTrace',
      page_ip_desc: 'Find your public IP address, geographic location, ISP, and connection privacy status (VPN, proxy, Tor) instantly. No login required.',
      page_ping_title: 'Ping & Latency Test — SiteTrace',
      page_ping_desc: 'Measure your connection latency to 9 major global servers. Live, lightweight, no install.',
      page_dns_title: 'DNS Lookup — SiteTrace',
      page_dns_desc: 'Resolve any domain to its DNS records (A, AAAA, MX, TXT, NS, CNAME, SOA) over DNS-over-HTTPS.',
      page_about_title: 'About — SiteTrace',
      page_about_desc: 'SiteTrace is a free, no-login, privacy-respecting network tool. Here\'s who built it and why.',
      page_privacy_title: 'Privacy Policy — SiteTrace',
      page_privacy_desc: 'SiteTrace\'s privacy policy: we don\'t log, we don\'t track, and we don\'t sell your data. Here are the details.',

      // Hero
      hero_eyebrow: 'Your public network profile',
      hero_title: 'What does the internet see when you connect?',
      hero_subtitle: 'A single, instant look at your IP, geolocation, and whether your connection is exposed, protected, or routed through a VPN or proxy.',
      cta_recheck: 'Re-check',
      cta_copy: 'Copy IP',
      cta_copied: 'Copied!',

      // Status
      status_title: 'Connection status',
      status_loading: 'Analyzing your connection…',
      status_protected: 'Protected',
      status_protected_desc: 'Your real IP appears to be hidden behind a privacy layer.',
      status_exposed: 'Exposed',
      status_exposed_desc: 'Your real IP and approximate location are visible to every site you visit.',
      status_vpn: 'VPN detected',
      status_vpn_desc: 'Traffic appears to be routed through a virtual private network.',
      status_proxy: 'Proxy detected',
      status_proxy_desc: 'A proxy server is mediating your connection.',
      status_tor: 'Tor network',
      status_tor_desc: 'You appear to be connected through the Tor anonymity network.',

      // Cards
      card_location: 'Location',
      card_network: 'Network',
      card_time: 'Local time',
      card_security: 'Security signals',
      field_ip: 'IP address',
      field_country: 'Country',
      field_region: 'Region',
      field_city: 'City',
      field_postal: 'Postal code',
      field_coords: 'Coordinates',
      field_isp: 'ISP',
      field_org: 'Organization',
      field_asn: 'ASN',
      field_timezone: 'Timezone',
      field_type: 'IP type',
      field_proxy: 'Proxy',
      field_vpn: 'VPN',
      field_tor: 'Tor',
      field_threat: 'Threat level',
      value_yes: 'Yes',
      value_no: 'No',
      value_unknown: 'Unknown',

      // Ping view
      ping_title: 'Real-time latency test',
      ping_subtitle: 'Measure round-trip time to major global servers. Tap start to begin continuous probing.',
      ping_start: 'Start test',
      ping_stop: 'Stop',
      ping_target: 'Target',
      ping_latency: 'Latency',
      ping_status: 'Status',
      ping_avg: 'Average',
      ping_min: 'Min',
      ping_max: 'Max',
      ping_jitter: 'Jitter',
      ping_idle: 'Idle',
      ping_running: 'Probing…',
      ping_offline: 'Unreachable',

      // DNS view
      dns_title: 'DNS & routing tools',
      dns_subtitle: 'Resolve domains, inspect records, and see which resolver answered.',
      dns_input_label: 'Domain or hostname',
      dns_input_placeholder: 'example.com',
      dns_lookup: 'Lookup',
      dns_type: 'Record type',
      dns_result: 'Result',
      dns_resolver: 'Answered by',
      dns_ttl: 'TTL',
      dns_empty: 'Enter a domain to begin.',
      dns_querying: 'Querying…',
      dns_error: 'Lookup failed. Check the domain and try again.',

      // Affiliate
      aff_title: 'Take your privacy further',
      aff_subtitle: 'Trusted, independently-reviewed tools our team actually uses.',
      aff_cta: 'Learn more',
      aff_1_name: 'NordVPN',
      aff_1_desc: 'Encrypt every connection and route traffic through 60+ countries.',
      aff_2_name: 'ProtonMail',
      aff_2_desc: 'End-to-end encrypted email based in Switzerland.',
      aff_3_name: '1Password',
      aff_3_desc: 'Generate and store strong passwords across every device.',

      // Ad placeholders
      ad_label: 'Advertisement',
      ad_top_caption: 'Sponsored space — 728×90 leaderboard',
      ad_inline_caption: 'Sponsored space — 300×250 in-content',

      // About + Privacy pages
      about_h1: 'About SiteTrace',
      about_p1: 'SiteTrace is a small set of network utility tools built for people who want fast, honest answers about how the internet sees them. There is no signup, no app to install, and no tracking tied to your identity.',
      about_p2: 'It was built by a small team that was tired of IP-checker sites covered in popups, autoplay video, and "VPN recommendations" that existed only to earn affiliate commissions. SiteTrace does the opposite: it loads instantly, it shows you the answer immediately, and it puts every tool on its own page so you can link to it, share it, or just bookmark the one you need.',
      about_p3: 'All lookups run in your browser and go to public services (ipwho.is, ip-api.com, Google DNS-over-HTTPS, Cloudflare DNS-over-HTTPS, plus CORS-friendly endpoints for ping). We do not run a server in the middle and we do not log your requests.',
      privacy_h1: 'Privacy Policy',
      privacy_short_h2: 'The short version',
      privacy_short: 'We don\'t log your IP lookups. We don\'t set tracking cookies. We don\'t sell your data. We don\'t run third-party analytics on this site. The only data you see on this site is your own.',
      privacy_data_h2: 'What data is collected',
      privacy_data: 'When you open any tool on SiteTrace, your browser makes a request to a public IP-geo or DNS-over-HTTPS service. Those services have their own privacy policies. SiteTrace does not sit between you and them, does not log those requests, and does not store the responses. Cloudflare (our host) keeps standard HTTP request logs for security and abuse prevention, governed by the Cloudflare Privacy Policy.',
      privacy_cookies_h2: 'Cookies and storage',
      privacy_cookies: 'SiteTrace does not use cookies. It does not use localStorage, sessionStorage, IndexedDB, or any other persistent storage. The language preference is held in memory only and resets when you close the tab.',
      privacy_third_h2: 'Third-party services',
      privacy_third: 'To answer your queries, your browser talks to: ipwho.is, ip-api.com, Google DNS-over-HTTPS, and Cloudflare DNS-over-HTTPS. They see your IP, but SiteTrace does not. Each has its own privacy policy.',
      privacy_contact_h2: 'Contact',
      privacy_contact: 'Questions? Email appenzeller.digitalstore@gmail.com.',
      back_to_home: 'Back to SiteTrace',

      // Footer
      footer_disclaimer: 'SiteTrace is a free diagnostic utility. No data is stored on our servers. Results reflect what the public internet can see about your connection at this moment.',
      footer_about: 'About',
      footer_privacy: 'Privacy',
      footer_contact: 'Contact',
      footer_rights: 'All rights reserved.',

      // Errors
      err_network: 'We could not reach the network service. Please check your connection and try again.',
      err_retry: 'Retry',
    },

    es: {
      brand: 'SiteTrace',
      tagline: 'Herramientas de red rápidas y privadas',
      nav_home: 'Inicio',
      nav_whatismyip: '¿Cuál es mi IP?',
      nav_ping: 'Ping',
      nav_dns: 'DNS',
      nav_about: 'Acerca',
      nav_privacy: 'Privacidad',
      language: 'Idioma',

      front_hero_eyebrow: 'Rápido. Privado. Gratis.',
      front_hero_title: 'Mira lo que internet sabe de ti',
      front_hero_subtitle: 'Tres herramientas limpias para ver tu IP, probar la velocidad de tu conexión y consultar registros DNS — todo en tu navegador, sin cuenta.',
      front_feature_eyebrow: 'Elige una herramienta',
      front_feature_ip_title: '¿Cuál es mi IP?',
      front_feature_ip_desc: 'Tu IP pública, ubicación aproximada, proveedor, y si tu conexión está expuesta, tras una VPN o usando un proxy. Carga en menos de un segundo.',
      front_feature_ping_title: 'Test de ping y latencia',
      front_feature_ping_desc: 'Mide el tiempo de ida y vuelta a 9 servidores globales (Cloudflare, Google, GitHub, Amazon, Microsoft, Apple, etc.). Se actualiza en vivo.',
      front_feature_dns_title: 'Consulta DNS',
      front_feature_dns_desc: 'Resuelve cualquier dominio a sus registros A, AAAA, MX, TXT, NS, CNAME o SOA mediante DNS-over-HTTPS. Ve qué resolutor respondió.',
      front_cta: 'Abrir',
      front_how_title: 'Cómo funciona',
      front_how_text: 'Cada consulta se ejecuta directamente desde tu navegador — no guardamos registros, no analizamos tus datos, y tus consultas de IP no están vinculadas a una sesión. Cada petición la hace tu navegador a servicios públicos de DNS y geo-IP, y la respuesta se renderiza localmente.',
      front_trust_title: 'Sin cuentas. Sin rastreo. Sin tonterías.',
      front_trust_text: 'SiteTrace es una herramienta pequeña e independiente, creada para quienes quieren respuestas rápidas sin entregar sus datos. No hay nada que instalar, no hay registro, y nada sobre ti se vende a anunciantes.',

      page_ip_title: '¿Cuál es mi IP? — SiteTrace',
      page_ip_desc: 'Descubre tu IP pública, ubicación geográfica, proveedor y estado de privacidad de la conexión (VPN, proxy, Tor) al instante. Sin registro.',
      page_ping_title: 'Test de ping y latencia — SiteTrace',
      page_ping_desc: 'Mide la latencia de tu conexión a 9 servidores globales importantes. En vivo, ligero, sin instalar nada.',
      page_dns_title: 'Consulta DNS — SiteTrace',
      page_dns_desc: 'Resuelve cualquier dominio a sus registros DNS (A, AAAA, MX, TXT, NS, CNAME, SOA) sobre DNS-over-HTTPS.',
      page_about_title: 'Acerca de — SiteTrace',
      page_about_desc: 'SiteTrace es una herramienta de red gratuita, sin registro, que respeta tu privacidad. Aquí te contamos quién la hizo y por qué.',
      page_privacy_title: 'Política de privacidad — SiteTrace',
      page_privacy_desc: 'Política de privacidad de SiteTrace: no guardamos registros, no rastreamos, no vendemos tus datos. Aquí están los detalles.',

      hero_eyebrow: 'Tu perfil de red público',
      hero_title: '¿Qué ve internet cuando te conectas?',
      hero_subtitle: 'Una vista instantánea de tu IP, geolocalización y si tu conexión está expuesta, protegida o pasa por una VPN o proxy.',
      cta_recheck: 'Verificar de nuevo',
      cta_copy: 'Copiar IP',
      cta_copied: '¡Copiado!',

      status_title: 'Estado de la conexión',
      status_loading: 'Analizando tu conexión…',
      status_protected: 'Protegida',
      status_protected_desc: 'Tu IP real parece estar oculta detrás de una capa de privacidad.',
      status_exposed: 'Expuesta',
      status_exposed_desc: 'Tu IP real y ubicación aproximada son visibles para cada sitio que visitas.',
      status_vpn: 'VPN detectada',
      status_vpn_desc: 'El tráfico parece estar enrutado a través de una red privada virtual.',
      status_proxy: 'Proxy detectado',
      status_proxy_desc: 'Un servidor proxy está mediando tu conexión.',
      status_tor: 'Red Tor',
      status_tor_desc: 'Parece que estás conectado a través de la red de anonimato Tor.',

      card_location: 'Ubicación',
      card_network: 'Red',
      card_time: 'Hora local',
      card_security: 'Señales de seguridad',
      field_ip: 'Dirección IP',
      field_country: 'País',
      field_region: 'Región',
      field_city: 'Ciudad',
      field_postal: 'Código postal',
      field_coords: 'Coordenadas',
      field_isp: 'Proveedor',
      field_org: 'Organización',
      field_asn: 'ASN',
      field_timezone: 'Zona horaria',
      field_type: 'Tipo de IP',
      field_proxy: 'Proxy',
      field_vpn: 'VPN',
      field_tor: 'Tor',
      field_threat: 'Nivel de amenaza',
      value_yes: 'Sí',
      value_no: 'No',
      value_unknown: 'Desconocido',

      ping_title: 'Test de latencia en tiempo real',
      ping_subtitle: 'Mide el tiempo de ida y vuelta a servidores globales importantes. Pulsa iniciar para comenzar el sondeo continuo.',
      ping_start: 'Iniciar test',
      ping_stop: 'Detener',
      ping_target: 'Destino',
      ping_latency: 'Latencia',
      ping_status: 'Estado',
      ping_avg: 'Promedio',
      ping_min: 'Mín',
      ping_max: 'Máx',
      ping_jitter: 'Jitter',
      ping_idle: 'Inactivo',
      ping_running: 'Sondeando…',
      ping_offline: 'Inaccesible',

      dns_title: 'DNS y herramientas de enrutamiento',
      dns_subtitle: 'Resuelve dominios, inspecciona registros y mira qué resolutor respondió.',
      dns_input_label: 'Dominio o hostname',
      dns_input_placeholder: 'ejemplo.com',
      dns_lookup: 'Consultar',
      dns_type: 'Tipo de registro',
      dns_result: 'Resultado',
      dns_resolver: 'Respondido por',
      dns_ttl: 'TTL',
      dns_empty: 'Introduce un dominio para comenzar.',
      dns_querying: 'Consultando…',
      dns_error: 'La consulta falló. Verifica el dominio e inténtalo de nuevo.',

      aff_title: 'Lleva tu privacidad más lejos',
      aff_subtitle: 'Herramientas confiables y revisadas de forma independiente que nuestro equipo realmente utiliza.',
      aff_cta: 'Saber más',
      aff_1_name: 'NordVPN',
      aff_1_desc: 'Cifra cada conexión y enruta el tráfico a través de más de 60 países.',
      aff_2_name: 'ProtonMail',
      aff_2_desc: 'Correo electrónico cifrado de extremo a extremo con sede en Suiza.',
      aff_3_name: '1Password',
      aff_3_desc: 'Genera y guarda contraseñas fuertes en todos tus dispositivos.',

      ad_label: 'Publicidad',
      ad_top_caption: 'Espacio patrocinado — leaderboard 728×90',
      ad_inline_caption: 'Espacio patrocinado — 300×250 en contenido',

      about_h1: 'Acerca de SiteTrace',
      about_p1: 'SiteTrace es un pequeño conjunto de herramientas de red, creado para personas que quieren respuestas rápidas y honestas sobre cómo las ve internet. No requiere registro, no hay app que instalar y no hay rastreo vinculado a tu identidad.',
      about_p2: 'Lo creó un equipo pequeño, cansado de los sitios de "verifica tu IP" llenos de popups, videos con autoplay y "recomendaciones de VPN" que solo existían para ganar comisiones. SiteTrace hace lo contrario: carga al instante, muestra la respuesta inmediatamente y pone cada herramienta en su propia página para que puedas enlazarla, compartirla o simplemente marcar la que necesitas.',
      about_p3: 'Todas las consultas se ejecutan en tu navegador y van a servicios públicos (ipwho.is, ip-api.com, Google DNS-over-HTTPS, Cloudflare DNS-over-HTTPS y endpoints compatibles con CORS para ping). No tenemos un servidor en el medio y no registramos tus peticiones.',
      privacy_h1: 'Política de privacidad',
      privacy_short_h2: 'La versión corta',
      privacy_short: 'No registramos tus consultas de IP. No usamos cookies de rastreo. No vendemos tus datos. No usamos analíticas de terceros en este sitio. Lo único que ves en este sitio es tu propia información.',
      privacy_data_h2: 'Qué datos se recogen',
      privacy_data: 'Cuando abres cualquier herramienta de SiteTrace, tu navegador hace una petición a un servicio público de geo-IP o DNS-over-HTTPS. Esos servicios tienen sus propias políticas de privacidad. SiteTrace no se sitúa entre tú y ellos, no registra esas peticiones y no guarda las respuestas. Cloudflare (nuestro hosting) mantiene registros estándar de peticiones HTTP para seguridad y prevención de abuso, gobernados por la Política de Privacidad de Cloudflare.',
      privacy_cookies_h2: 'Cookies y almacenamiento',
      privacy_cookies: 'SiteTrace no usa cookies. No usa localStorage, sessionStorage, IndexedDB ni ningún otro almacenamiento persistente. La preferencia de idioma se guarda solo en memoria y se reinicia al cerrar la pestaña.',
      privacy_third_h2: 'Servicios de terceros',
      privacy_third: 'Para responder a tus consultas, tu navegador habla con: ipwho.is, ip-api.com, Google DNS-over-HTTPS y Cloudflare DNS-over-HTTPS. Ellos ven tu IP, pero SiteTrace no. Cada uno tiene su propia política de privacidad.',
      privacy_contact_h2: 'Contacto',
      privacy_contact: '¿Preguntas? Escribe a appenzeller.digitalstore@gmail.com.',
      back_to_home: 'Volver a SiteTrace',

      footer_disclaimer: 'SiteTrace es una utilidad de diagnóstico gratuita. No se almacenan datos en nuestros servidores. Los resultados reflejan lo que la internet pública puede ver sobre tu conexión en este momento.',
      footer_about: 'Acerca',
      footer_privacy: 'Privacidad',
      footer_contact: 'Contacto',
      footer_rights: 'Todos los derechos reservados.',

      err_network: 'No pudimos contactar al servicio de red. Verifica tu conexión e inténtalo de nuevo.',
      err_retry: 'Reintentar',
    },

    pt: {
      brand: 'SiteTrace',
      tagline: 'Ferramentas de rede rápidas e privadas',
      nav_home: 'Início',
      nav_whatismyip: 'Qual é meu IP?',
      nav_ping: 'Ping',
      nav_dns: 'DNS',
      nav_about: 'Sobre',
      nav_privacy: 'Privacidade',
      language: 'Idioma',

      front_hero_eyebrow: 'Rápido. Privado. Grátis.',
      front_hero_title: 'Veja o que a internet sabe sobre você',
      front_hero_subtitle: 'Três ferramentas leves para conferir seu IP, testar a velocidade da conexão e consultar registros DNS — tudo no seu navegador, sem cadastro.',
      front_feature_eyebrow: 'Escolha uma ferramenta',
      front_feature_ip_title: 'Qual é meu IP?',
      front_feature_ip_desc: 'Seu IP público, localização aproximada, provedor e se sua conexão está exposta, atrás de uma VPN ou usando proxy. Carrega em menos de um segundo.',
      front_feature_ping_title: 'Teste de ping e latência',
      front_feature_ping_desc: 'Meça o tempo de ida e volta para 9 servidores globais (Cloudflare, Google, GitHub, Amazon, Microsoft, Apple, etc.). Atualiza ao vivo.',
      front_feature_dns_title: 'Consulta DNS',
      front_feature_dns_desc: 'Resolva qualquer domínio para seus registros A, AAAA, MX, TXT, NS, CNAME ou SOA via DNS-over-HTTPS. Veja qual resolvedor respondeu.',
      front_cta: 'Abrir',
      front_how_title: 'Como funciona',
      front_how_text: 'Cada consulta roda direto do seu navegador — não guardamos logs, não analisamos seus dados e suas consultas de IP não estão vinculadas a uma sessão. Cada requisição é feita pelo seu navegador a serviços públicos de DNS e geo-IP, e a resposta é renderizada localmente.',
      front_trust_title: 'Sem contas. Sem rastreamento. Sem enrolação.',
      front_trust_text: 'SiteTrace é uma ferramenta pequena e independente, criada para quem quer respostas rápidas sem abrir mão dos próprios dados. Não há nada para instalar, não há cadastro e nada sobre você é vendido a anunciantes.',

      page_ip_title: 'Qual É Meu IP? — SiteTrace',
      page_ip_desc: 'Descubra seu IP público, localização geográfica, provedor e status de privacidade da conexão (VPN, proxy, Tor) na hora. Sem cadastro.',
      page_ping_title: 'Teste de Ping e Latência — SiteTrace',
      page_ping_desc: 'Meça a latência da sua conexão para 9 servidores globais importantes. Ao vivo, leve, sem instalar nada.',
      page_dns_title: 'Consulta DNS — SiteTrace',
      page_dns_desc: 'Resolva qualquer domínio para seus registros DNS (A, AAAA, MX, TXT, NS, CNAME, SOA) via DNS-over-HTTPS.',
      page_about_title: 'Sobre — SiteTrace',
      page_about_desc: 'SiteTrace é uma ferramenta de rede gratuita, sem cadastro e que respeita sua privacidade. Veja quem a fez e por quê.',
      page_privacy_title: 'Política de Privacidade — SiteTrace',
      page_privacy_desc: 'Política de privacidade do SiteTrace: não guardamos logs, não rastreamos, não vendemos seus dados. Detalhes aqui.',

      hero_eyebrow: 'Seu perfil de rede público',
      hero_title: 'O que a internet vê quando você se conecta?',
      hero_subtitle: 'Uma visão instantânea do seu IP, geolocalização e se sua conexão está exposta, protegida ou roteada por uma VPN ou proxy.',
      cta_recheck: 'Verificar novamente',
      cta_copy: 'Copiar IP',
      cta_copied: 'Copiado!',

      status_title: 'Status da conexão',
      status_loading: 'Analisando sua conexão…',
      status_protected: 'Protegida',
      status_protected_desc: 'Seu IP real parece estar escondido atrás de uma camada de privacidade.',
      status_exposed: 'Exposta',
      status_exposed_desc: 'Seu IP real e localização aproximada estão visíveis para cada site que você visita.',
      status_vpn: 'VPN detectada',
      status_vpn_desc: 'O tráfego parece estar roteado por uma rede privada virtual.',
      status_proxy: 'Proxy detectado',
      status_proxy_desc: 'Um servidor proxy está mediando sua conexão.',
      status_tor: 'Rede Tor',
      status_tor_desc: 'Você parece estar conectado pela rede de anonimato Tor.',

      card_location: 'Localização',
      card_network: 'Rede',
      card_time: 'Hora local',
      card_security: 'Sinais de segurança',
      field_ip: 'Endereço IP',
      field_country: 'País',
      field_region: 'Região',
      field_city: 'Cidade',
      field_postal: 'CEP',
      field_coords: 'Coordenadas',
      field_isp: 'Provedor',
      field_org: 'Organização',
      field_asn: 'ASN',
      field_timezone: 'Fuso horário',
      field_type: 'Tipo de IP',
      field_proxy: 'Proxy',
      field_vpn: 'VPN',
      field_tor: 'Tor',
      field_threat: 'Nível de ameaça',
      value_yes: 'Sim',
      value_no: 'Não',
      value_unknown: 'Desconhecido',

      ping_title: 'Teste de latência em tempo real',
      ping_subtitle: 'Meça o tempo de ida e volta para servidores globais importantes. Toque em iniciar para começar o monitoramento contínuo.',
      ping_start: 'Iniciar teste',
      ping_stop: 'Parar',
      ping_target: 'Destino',
      ping_latency: 'Latência',
      ping_status: 'Status',
      ping_avg: 'Média',
      ping_min: 'Mín',
      ping_max: 'Máx',
      ping_jitter: 'Jitter',
      ping_idle: 'Inativo',
      ping_running: 'Sondando…',
      ping_offline: 'Inacessível',

      dns_title: 'DNS e ferramentas de roteamento',
      dns_subtitle: 'Resolva domínios, inspecione registros e veja qual resolvedor respondeu.',
      dns_input_label: 'Domínio ou hostname',
      dns_input_placeholder: 'exemplo.com',
      dns_lookup: 'Consultar',
      dns_type: 'Tipo de registro',
      dns_result: 'Resultado',
      dns_resolver: 'Respondido por',
      dns_ttl: 'TTL',
      dns_empty: 'Digite um domínio para começar.',
      dns_querying: 'Consultando…',
      dns_error: 'A consulta falhou. Verifique o domínio e tente novamente.',

      aff_title: 'Leve sua privacidade mais longe',
      aff_subtitle: 'Ferramentas confiáveis e revisadas de forma independente que nossa equipe realmente usa.',
      aff_cta: 'Saiba mais',
      aff_1_name: 'NordVPN',
      aff_1_desc: 'Criptografe cada conexão e roteie o tráfego por mais de 60 países.',
      aff_2_name: 'ProtonMail',
      aff_2_desc: 'E-mail criptografado de ponta a ponta baseado na Suíça.',
      aff_3_name: '1Password',
      aff_3_desc: 'Gere e armazene senhas fortes em todos os seus dispositivos.',

      ad_label: 'Publicidade',
      ad_top_caption: 'Espaço patrocinado — leaderboard 728×90',
      ad_inline_caption: 'Espaço patrocinado — 300×250 no conteúdo',

      about_h1: 'Sobre o SiteTrace',
      about_p1: 'SiteTrace é um pequeno conjunto de ferramentas de rede, criado para pessoas que querem respostas rápidas e honestas sobre como a internet as vê. Não exige cadastro, não há app para instalar e não há rastreamento vinculado à sua identidade.',
      about_p2: 'Foi criado por uma equipe pequena, cansada de sites de "veja seu IP" cheios de popups, vídeos com autoplay e "recomendações de VPN" que só existiam para ganhar comissão. SiteTrace faz o oposto: carrega na hora, mostra a resposta imediatamente e coloca cada ferramenta em sua própria página para você poder compartilhar, mandar o link ou só favoritar a que precisa.',
      about_p3: 'Todas as consultas rodam no seu navegador e vão para serviços públicos (ipwho.is, ip-api.com, Google DNS-over-HTTPS, Cloudflare DNS-over-HTTPS e endpoints compatíveis com CORS para ping). Não temos servidor no meio e não guardamos logs das suas requisições.',
      privacy_h1: 'Política de Privacidade',
      privacy_short_h2: 'A versão curta',
      privacy_short: 'Não guardamos logs das suas consultas de IP. Não usamos cookies de rastreamento. Não vendemos seus dados. Não usamos analytics de terceiros neste site. O único dado que você vê neste site é o seu próprio.',
      privacy_data_h2: 'Quais dados são coletados',
      privacy_data: 'Quando você abre qualquer ferramenta do SiteTrace, seu navegador faz uma requisição a um serviço público de geo-IP ou DNS-over-HTTPS. Esses serviços têm suas próprias políticas de privacidade. O SiteTrace não fica entre você e eles, não registra essas requisições e não armazena as respostas. A Cloudflare (nosso host) mantém logs HTTP padrão para segurança e prevenção de abuso, regidos pela Política de Privacidade da Cloudflare.',
      privacy_cookies_h2: 'Cookies e armazenamento',
      privacy_cookies: 'O SiteTrace não usa cookies. Não usa localStorage, sessionStorage, IndexedDB ou qualquer outro armazenamento persistente. A preferência de idioma fica apenas em memória e se reinicia ao fechar a aba.',
      privacy_third_h2: 'Serviços de terceiros',
      privacy_third: 'Para responder suas consultas, seu navegador fala com: ipwho.is, ip-api.com, Google DNS-over-HTTPS e Cloudflare DNS-over-HTTPS. Eles veem seu IP, mas o SiteTrace não. Cada um tem sua própria política de privacidade.',
      privacy_contact_h2: 'Contato',
      privacy_contact: 'Dúvidas? Escreva para appenzeller.digitalstore@gmail.com.',
      back_to_home: 'Voltar para SiteTrace',

      footer_disclaimer: 'SiteTrace é uma utilidade de diagnóstico gratuita. Nenhum dado é armazenado em nossos servidores. Os resultados refletem o que a internet pública pode ver sobre sua conexão neste momento.',
      footer_about: 'Sobre',
      footer_privacy: 'Privacidade',
      footer_contact: 'Contato',
      footer_rights: 'Todos os direitos reservados.',

      err_network: 'Não foi possível alcançar o serviço de rede. Verifique sua conexão e tente novamente.',
      err_retry: 'Tentar novamente',
    },

    fr: {
      brand: 'SiteTrace',
      tagline: 'Outils réseau rapides et privés',
      nav_home: 'Accueil',
      nav_whatismyip: 'Quelle est mon IP',
      nav_ping: 'Ping',
      nav_dns: 'DNS',
      nav_about: 'À propos',
      nav_privacy: 'Confidentialité',
      language: 'Langue',

      front_hero_eyebrow: 'Rapide. Privé. Gratuit.',
      front_hero_title: 'Voyez ce qu’Internet sait de vous',
      front_hero_subtitle: 'Trois outils simples pour vérifier votre IP, tester la vitesse de votre connexion et consulter les enregistrements DNS — le tout dans votre navigateur, sans compte.',
      front_feature_eyebrow: 'Choisissez un outil',
      front_feature_ip_title: 'Quelle est mon IP ?',
      front_feature_ip_desc: 'Votre IP publique, localisation approximative, FAI, et si votre connexion est exposée, derrière un VPN ou via un proxy. Chargé en moins d’une seconde.',
      front_feature_ping_title: 'Test de ping et latence',
      front_feature_ping_desc: 'Mesurez le temps aller-retour vers 9 serveurs mondiaux (Cloudflare, Google, GitHub, Amazon, Microsoft, Apple, etc.). Mise à jour en continu.',
      front_feature_dns_title: 'Recherche DNS',
      front_feature_dns_desc: 'Résolvez n’importe quel domaine vers ses enregistrements A, AAAA, MX, TXT, NS, CNAME ou SOA via DNS-over-HTTPS. Voyez quel résolveur a répondu.',
      front_cta: 'Ouvrir',
      front_how_title: 'Comment ça marche',
      front_how_text: 'Chaque vérification s’exécute directement depuis votre navigateur — pas de logs, pas d’analyse de vos données, et vos consultations d’IP ne sont liées à aucune session. Chaque requête est faite par votre navigateur à des services publics de DNS et de géo-IP, et la réponse est rendue localement.',
      front_trust_title: 'Pas de compte. Pas de pistage. Pas de blabla.',
      front_trust_text: 'SiteTrace est un petit outil indépendant, créé pour celles et ceux qui veulent des réponses rapides sans renoncer à leurs données. Rien à installer, rien à signer, et rien sur vous n’est vendu à des annonceurs.',

      page_ip_title: 'Quelle est mon IP ? — SiteTrace',
      page_ip_desc: 'Trouvez votre IP publique, votre localisation géographique, votre FAI et l’état de confidentialité de votre connexion (VPN, proxy, Tor) en un instant. Sans inscription.',
      page_ping_title: 'Test de ping et latence — SiteTrace',
      page_ping_desc: 'Mesurez la latence de votre connexion vers 9 grands serveurs mondiaux. En direct, léger, rien à installer.',
      page_dns_title: 'Recherche DNS — SiteTrace',
      page_dns_desc: 'Résolvez n’importe quel domaine vers ses enregistrements DNS (A, AAAA, MX, TXT, NS, CNAME, SOA) via DNS-over-HTTPS.',
      page_about_title: 'À propos — SiteTrace',
      page_about_desc: 'SiteTrace est un outil réseau gratuit, sans inscription, respectueux de la vie privée. Voici qui l’a construit et pourquoi.',
      page_privacy_title: 'Politique de confidentialité — SiteTrace',
      page_privacy_desc: 'Politique de confidentialité de SiteTrace : pas de logs, pas de pistage, pas de vente de vos données. Voici les détails.',

      hero_eyebrow: 'Votre profil réseau public',
      hero_title: 'Que voit Internet quand vous vous connectez ?',
      hero_subtitle: 'Un aperçu instantané de votre IP, de votre géolocalisation, et du statut de votre connexion (exposée, protégée, via VPN ou proxy).',
      cta_recheck: 'Revérifier',
      cta_copy: 'Copier l’IP',
      cta_copied: 'Copié !',

      status_title: 'État de la connexion',
      status_loading: 'Analyse de votre connexion…',
      status_protected: 'Protégée',
      status_protected_desc: 'Votre IP réelle semble masquée par une couche de confidentialité.',
      status_exposed: 'Exposée',
      status_exposed_desc: 'Votre IP réelle et votre localisation approximative sont visibles par chaque site que vous visitez.',
      status_vpn: 'VPN détecté',
      status_vpn_desc: 'Le trafic semble transiter par un réseau privé virtuel.',
      status_proxy: 'Proxy détecté',
      status_proxy_desc: 'Un serveur proxy sert d’intermédiaire à votre connexion.',
      status_tor: 'Réseau Tor',
      status_tor_desc: 'Vous semblez connecté via le réseau d’anonymat Tor.',

      card_location: 'Localisation',
      card_network: 'Réseau',
      card_time: 'Heure locale',
      card_security: 'Signaux de sécurité',
      field_ip: 'Adresse IP',
      field_country: 'Pays',
      field_region: 'Région',
      field_city: 'Ville',
      field_postal: 'Code postal',
      field_coords: 'Coordonnées',
      field_isp: 'FAI',
      field_org: 'Organisation',
      field_asn: 'ASN',
      field_timezone: 'Fuseau horaire',
      field_type: 'Type d’IP',
      field_proxy: 'Proxy',
      field_vpn: 'VPN',
      field_tor: 'Tor',
      field_threat: 'Niveau de menace',
      value_yes: 'Oui',
      value_no: 'Non',
      value_unknown: 'Inconnu',

      ping_title: 'Test de latence en temps réel',
      ping_subtitle: 'Mesurez le temps aller-retour vers les principaux serveurs mondiaux. Lancez le test pour un sondage continu.',
      ping_start: 'Démarrer le test',
      ping_stop: 'Arrêter',
      ping_target: 'Cible',
      ping_latency: 'Latence',
      ping_status: 'Statut',
      ping_avg: 'Moyenne',
      ping_min: 'Min',
      ping_max: 'Max',
      ping_jitter: 'Gigue',
      ping_idle: 'Inactif',
      ping_running: 'Sondage…',
      ping_offline: 'Inaccessible',

      dns_title: 'DNS et outils de routage',
      dns_subtitle: 'Résolvez des domaines, inspectez les enregistrements et découvrez quel résolveur a répondu.',
      dns_input_label: 'Domaine ou hostname',
      dns_input_placeholder: 'exemple.com',
      dns_lookup: 'Rechercher',
      dns_type: 'Type d’enregistrement',
      dns_result: 'Résultat',
      dns_resolver: 'Répondu par',
      dns_ttl: 'TTL',
      dns_empty: 'Saisissez un domaine pour commencer.',
      dns_querying: 'Requête en cours…',
      dns_error: 'La recherche a échoué. Vérifiez le domaine et réessayez.',

      aff_title: 'Allez plus loin pour votre confidentialité',
      aff_subtitle: 'Des outils fiables, testés indépendamment, que notre équipe utilise vraiment.',
      aff_cta: 'En savoir plus',
      aff_1_name: 'NordVPN',
      aff_1_desc: 'Chiffrez chaque connexion et routez le trafic via plus de 60 pays.',
      aff_2_name: 'ProtonMail',
      aff_2_desc: 'Messagerie chiffrée de bout en bout, basée en Suisse.',
      aff_3_name: '1Password',
      aff_3_desc: 'Générez et stockez des mots de passe robustes sur tous vos appareils.',

      ad_label: 'Publicité',
      ad_top_caption: 'Espace sponsorisé — leaderboard 728×90',
      ad_inline_caption: 'Espace sponsorisé — 300×250 dans le contenu',

      about_h1: 'À propos de SiteTrace',
      about_p1: 'SiteTrace est un petit ensemble d’outils réseau conçu pour les personnes qui veulent des réponses rapides et honnêtes sur la façon dont Internet les voit. Pas d’inscription, pas d’application à installer, et aucun suivi lié à votre identité.',
      about_p2: 'Il a été construit par une petite équipe lassée des sites « voyez votre IP » couverts de popups, de vidéos en lecture automatique et de « recommandations de VPN » qui n’existaient que pour toucher des commissions. SiteTrace fait l’inverse : il charge instantanément, affiche la réponse tout de suite, et place chaque outil sur sa propre page pour que vous puissiez le partager, l’envoyer à quelqu’un ou simplement mettre en favori celui dont vous avez besoin.',
      about_p3: 'Toutes les requêtes s’exécutent dans votre navigateur et vont à des services publics (ipwho.is, ip-api.com, Google DNS-over-HTTPS, Cloudflare DNS-over-HTTPS, plus des endpoints compatibles CORS pour le ping). Nous n’avons pas de serveur au milieu et nous n’enregistrons pas vos requêtes.',
      privacy_h1: 'Politique de confidentialité',
      privacy_short_h2: 'En bref',
      privacy_short: 'Nous n’enregistrons pas vos recherches d’IP. Nous n’utilisons pas de cookies de pistage. Nous ne vendons pas vos données. Nous n’utilisons pas d’analytics tiers sur ce site. La seule donnée que vous voyez ici est la vôtre.',
      privacy_data_h2: 'Quelles données sont collectées',
      privacy_data: 'Quand vous ouvrez un outil SiteTrace, votre navigateur fait une requête à un service public de géo-IP ou de DNS-over-HTTPS. Ces services ont leur propre politique de confidentialité. SiteTrace ne s’intercale pas entre vous et eux, n’enregistre pas ces requêtes, et ne stocke pas les réponses. Cloudflare (notre hébergeur) conserve des logs HTTP standards pour la sécurité et la prévention des abus, régis par la politique de confidentialité de Cloudflare.',
      privacy_cookies_h2: 'Cookies et stockage',
      privacy_cookies: 'SiteTrace n’utilise pas de cookies. Pas de localStorage, sessionStorage, IndexedDB ou tout autre stockage persistant. La préférence de langue est conservée uniquement en mémoire et se réinitialise à la fermeture de l’onglet.',
      privacy_third_h2: 'Services tiers',
      privacy_third: 'Pour répondre à vos requêtes, votre navigateur communique avec : ipwho.is, ip-api.com, Google DNS-over-HTTPS et Cloudflare DNS-over-HTTPS. Ils voient votre IP, mais SiteTrace non. Chacun a sa propre politique de confidentialité.',
      privacy_contact_h2: 'Contact',
      privacy_contact: 'Des questions ? Écrivez à appenzeller.digitalstore@gmail.com.',
      back_to_home: 'Retour à SiteTrace',

      footer_disclaimer: 'SiteTrace est un utilitaire de diagnostic gratuit. Aucune donnée n’est stockée sur nos serveurs. Les résultats reflètent ce qu’Internet public peut voir de votre connexion à cet instant.',
      footer_about: 'À propos',
      footer_privacy: 'Confidentialité',
      footer_contact: 'Contact',
      footer_rights: 'Tous droits réservés.',

      err_network: 'Impossible de joindre le service réseau. Vérifiez votre connexion et réessayez.',
      err_retry: 'Réessayer',
    },
  };

  // ---- Public state ----------------------------------------------
  let currentLang = 'en';
  const listeners = [];

  // ---- Helpers ----------------------------------------------------
  function detectLanguage() {
    const supported = Object.keys(dictionaries);
    try {
      const saved = localStorage.getItem('sitetrace.lang');
      if (saved && supported.includes(saved)) return saved;
    } catch (_) { /* storage may be blocked */ }
    const candidates = [];
    if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
    if (navigator.language) candidates.push(navigator.language);
    for (const raw of candidates) {
      if (!raw) continue;
      const tag = raw.toLowerCase().split('-')[0];
      if (supported.includes(tag)) return tag;
    }
    return 'en';
  }

  function get(obj, path, fallback) {
    return obj && obj[path] != null ? obj[path] : (fallback != null ? fallback : path);
  }

  function t(key) {
    return get(dictionaries[currentLang], key, get(dictionaries.en, key, key));
  }

  function applyTranslations(root) {
    root = root || document;
    const nodes = root.querySelectorAll('[data-i18n]');
    nodes.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    const attrNodes = root.querySelectorAll('[data-i18n-attr]');
    attrNodes.forEach((el) => {
      const spec = el.getAttribute('data-i18n-attr');
      spec.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s && s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    document.documentElement.setAttribute('lang', currentLang);
    listeners.forEach((cb) => { try { cb(currentLang); } catch (_) {} });
  }

  function setLanguage(lang, options) {
    if (!dictionaries[lang]) lang = 'en';
    currentLang = lang;
    if (!options || !options.skipPersist) {
      try { sessionStorage.setItem('sitetrace.lang', lang); } catch (_) {}
    }
    applyTranslations();
    return currentLang;
  }

  function onChange(cb) { listeners.push(cb); }

  // ---- Public API -------------------------------------------------
  global.I18N = {
    t,
    setLanguage,
    getLanguage: () => currentLang,
    getSupported: () => Object.keys(dictionaries),
    onChange,
    applyTranslations,
    detectLanguage,
    dictionaries,
  };

  // Auto-init: use sessionStorage (not localStorage) so it doesn't persist
  function init() {
    const lang = detectLanguage();
    setLanguage(lang, { skipPersist: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window);
