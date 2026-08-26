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
      tagline: 'Instant network intelligence',
      nav_home: 'Home',
      nav_ping: 'Ping',
      nav_dns: 'DNS & Tools',
      language: 'Language',

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

      // Mini privacy explainer
      explainer_title: 'Why this matters',
      explainer_text: 'Every site you visit can see your public IP. That single number reveals your city, your ISP, and can be used to track you across the web. A VPN or proxy simply forwards your traffic through another hop, so what the internet sees is the VPN\'s IP — not yours.',

      // Ad placeholders
      ad_label: 'Advertisement',
      ad_top_caption: 'Sponsored space — 728×90 leaderboard',
      ad_inline_caption: 'Sponsored space — 300×250 in-content',

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
      tagline: 'Intelencia de red instantánea',
      nav_home: 'Inicio',
      nav_ping: 'Ping',
      nav_dns: 'DNS y herramientas',
      language: 'Idioma',

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

      explainer_title: 'Por qué importa',
      explainer_text: 'Cada sitio que visitas puede ver tu IP pública. Ese único número revela tu ciudad, tu proveedor y puede usarse para rastrearte por la web. Una VPN o proxy simplemente reenvía tu tráfico a través de otro salto, así que lo que internet ve es la IP de la VPN, no la tuya.',

      ad_label: 'Publicidad',
      ad_top_caption: 'Espacio patrocinado — leaderboard 728×90',
      ad_inline_caption: 'Espacio patrocinado — 300×250 en contenido',

      aff_title: 'Lleva tu privacidad más lejos',
      aff_subtitle: 'Herramientas confiables y revisadas de forma independiente que nuestro equipo realmente utiliza.',
      aff_cta: 'Saber más',
      aff_1_name: 'NordVPN',
      aff_1_desc: 'Cifra cada conexión y enruta el tráfico a través de más de 60 países.',
      aff_2_name: 'ProtonMail',
      aff_2_desc: 'Correo electrónico cifrado de extremo a extremo con sede en Suiza.',
      aff_3_name: '1Password',
      aff_3_desc: 'Genera y guarda contraseñas fuertes en todos tus dispositivos.',

      ping_title: 'Test de latencia en tiempo real',
      ping_subtitle: 'Mide el tiempo de ida y vuelta a servidores globales. Toca iniciar para comenzar el sondeo continuo.',
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
      dns_subtitle: 'Resuelve dominios, inspecciona registros y mira qué resolvedor respondió.',
      dns_input_label: 'Dominio o hostname',
      dns_input_placeholder: 'ejemplo.com',
      dns_lookup: 'Consultar',
      dns_type: 'Tipo de registro',
      dns_result: 'Resultado',
      dns_resolver: 'Respondido por',
      dns_ttl: 'TTL',
      dns_empty: 'Introduce un dominio para comenzar.',
      dns_querying: 'Consultando…',
      dns_error: 'La consulta falló. Revisa el dominio e inténtalo de nuevo.',

      footer_disclaimer: 'SiteTrace es una utilidad de diagnóstico gratuita. No se almacenan datos en nuestros servidores. Los resultados reflejan lo que la internet pública puede ver sobre tu conexión en este momento.',
      footer_about: 'Acerca de',
      footer_privacy: 'Privacidad',
      footer_contact: 'Contacto',
      footer_rights: 'Todos los derechos reservados.',

      err_network: 'No pudimos contactar al servicio de red. Revisa tu conexión e inténtalo de nuevo.',
      err_retry: 'Reintentar',
    },

    pt: {
      brand: 'SiteTrace',
      tagline: 'Inteligência de rede instantânea',
      nav_home: 'Início',
      nav_ping: 'Ping',
      nav_dns: 'DNS e ferramentas',
      language: 'Idioma',

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

      explainer_title: 'Por que isso importa',
      explainer_text: 'Cada site que você visita pode ver seu IP público. Esse único número revela sua cidade, seu provedor e pode ser usado para te rastrear pela web. Uma VPN ou proxy simplesmente encaminha seu tráfego por outro salto, então o que a internet vê é o IP da VPN, não o seu.',

      ad_label: 'Publicidade',
      ad_top_caption: 'Espaço patrocinado — leaderboard 728×90',
      ad_inline_caption: 'Espaço patrocinado — 300×250 no conteúdo',

      aff_title: 'Leve sua privacidade mais longe',
      aff_subtitle: 'Ferramentas confiáveis e revisadas de forma independente que nossa equipe realmente usa.',
      aff_cta: 'Saiba mais',
      aff_1_name: 'NordVPN',
      aff_1_desc: 'Criptografe cada conexão e roteie o tráfego por mais de 60 países.',
      aff_2_name: 'ProtonMail',
      aff_2_desc: 'E-mail criptografado de ponta a ponta baseado na Suíça.',
      aff_3_name: '1Password',
      aff_3_desc: 'Gere e armazene senhas fortes em todos os seus dispositivos.',

      ping_title: 'Teste de latência em tempo real',
      ping_subtitle: 'Meça o tempo de ida e volta para grandes servidores globais. Toque em iniciar para começar o monitoramento contínuo.',
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
      tagline: 'Intelligence réseau instantanée',
      nav_home: 'Accueil',
      nav_ping: 'Ping',
      nav_dns: 'DNS et outils',
      language: 'Langue',

      hero_eyebrow: 'Votre profil réseau public',
      hero_title: 'Que voit Internet quand vous vous connectez ?',
      hero_subtitle: 'Un aperçu instantané de votre IP, de votre géolocalisation et du statut de votre connexion : exposée, protégée, ou passant par un VPN ou un proxy.',
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
      status_vpn_desc: 'Le trafic semble acheminé via un réseau privé virtuel.',
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

      explainer_title: 'Pourquoi c’est important',
      explainer_text: 'Chaque site que vous visitez peut voir votre IP publique. Ce simple numéro révèle votre ville, votre fournisseur d’accès et peut être utilisé pour vous suivre sur le web. Un VPN ou un proxy ne fait que relayer votre trafic via un autre saut : ce qu’Internet voit alors, c’est l’IP du VPN, pas la vôtre.',

      ad_label: 'Publicité',
      ad_top_caption: 'Espace sponsorisé — leaderboard 728×90',
      ad_inline_caption: 'Espace sponsorisé — 300×250 dans le contenu',

      aff_title: 'Allez plus loin pour votre confidentialité',
      aff_subtitle: 'Des outils fiables, testés indépendamment, que notre équipe utilise vraiment.',
      aff_cta: 'En savoir plus',
      aff_1_name: 'NordVPN',
      aff_1_desc: 'Chiffrez chaque connexion et routez le trafic via plus de 60 pays.',
      aff_2_name: 'ProtonMail',
      aff_2_desc: 'Messagerie chiffrée de bout en bout, basée en Suisse.',
      aff_3_name: '1Password',
      aff_3_desc: 'Générez et stockez des mots de passe robustes sur tous vos appareils.',

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

      footer_disclaimer: 'SiteTrace est un utilitaire de diagnostic gratuit. Aucune donnée n’est stockée sur nos serveurs. Les résultats reflètent ce qu’Internet peut voir de votre connexion à cet instant.',
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
    // Stored preference first
    try {
      const saved = localStorage.getItem('sitetrace.lang');
      if (saved && supported.includes(saved)) return saved;
    } catch (_) { /* storage may be blocked */ }
    // Browser language(s): navigator.language / navigator.languages
    const candidates = [];
    if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
    if (navigator.language) candidates.push(navigator.language);
    for (const raw of candidates) {
      if (!raw) continue;
      const tag = raw.toLowerCase().split('-')[0]; // "es-MX" -> "es"
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
      const spec = el.getAttribute('data-i18n-attr'); // e.g. "placeholder:nav_ping;aria-label:nav_ping"
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
      try { localStorage.setItem('sitetrace.lang', lang); } catch (_) {}
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

  // Auto-init on DOM ready
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
