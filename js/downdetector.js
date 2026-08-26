/* ================================================================
 * SiteTrace — Downdetector-style status page
 *
 * Live status for 40+ popular services across cloud, dev, comm,
 * productivity, gaming, social, streaming, commerce, and AI.
 * 24-hour incident timeline from each service's official
 * statuspage.io endpoint (where available). Search supports any
 * service — known ones open their card, unknown ones deep-link
 * to downdetector.com for community-reported data.
 *
 * Runs entirely in the browser. No backend. Per-user "I noticed
 * an issue" reports are stored in localStorage (cleared when the
 * user clears site data, never sent anywhere).
 * ================================================================ */
(function () {
  'use strict';

  const t = (k) => (window.I18N && window.I18N.t) ? window.I18N.t(k) : k;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // ----------------------------------------------------------------
  // Service catalog
  // ----------------------------------------------------------------
  // Each entry:
  //   id             unique key
  //   name           display name
  //   category       one of: infra, dev, comm, prod, commerce, gaming, social, streaming, ai
  //   icon           emoji
  //   statuspage     statuspage.io subdomain, or null if not on statuspage
  //   summaryUrl     (optional) full URL — overrides the default
  //                  https://<statuspage>.statuspage.io/api/v2/summary.json.
  //                  Used when the page lives on a custom CNAME domain.
  //   incidentsUrl   (optional) full URL — same idea for the incidents endpoint
  //   page           official status / status-equivalent URL
  //   dd             downdetector.com slug
  const SERVICES = [
    // ---- Cloud & Infrastructure ----
    { id: 'cloudflare',   name: 'Cloudflare',        category: 'infra',     icon: '☁️',  statuspage: 'cloudflarestatus', page: 'https://www.cloudflarestatus.com/',   dd: 'cloudflare' },
    { id: 'aws',          name: 'Amazon AWS',        category: 'infra',     icon: '🟧', statuspage: 'amazonwebservices', page: 'https://health.aws.amazon.com/public/currentevents', dd: 'aws' },
    { id: 'azure',        name: 'Microsoft Azure',   category: 'infra',     icon: '🪟', statuspage: 'azurestatus',  page: 'https://azure.status.microsoft/en-us/status/',     dd: 'microsoft-azure' },
    { id: 'googlecloud',  name: 'Google Cloud',      category: 'infra',     icon: '🔵', statuspage: 'googlecloudplatform', page: 'https://status.cloud.google.com/',  dd: 'google-cloud' },
    { id: 'digitalocean', name: 'DigitalOcean',      category: 'infra',     icon: '🌊',  summaryUrl: 'https://status.digitalocean.com/api/v2/summary.json',  page: 'https://status.digitalocean.com/',   dd: 'digitalocean' },
    { id: 'heroku',       name: 'Heroku',            category: 'infra',     icon: '🟪', statuspage: null,                page: 'https://status.heroku.com/',         dd: 'heroku' },
    { id: 'fastly',       name: 'Fastly',            category: 'infra',     icon: '⚡', statuspage: null,                page: 'https://status.fastly.com/',         dd: 'fastly' },

    // ---- Developer tools ----
    { id: 'github',       name: 'GitHub',            category: 'dev',       icon: '🐙', statuspage: 'githubstatus',   page: 'https://www.githubstatus.com/',     dd: 'github' },
    { id: 'gitlab',       name: 'GitLab',            category: 'dev',       icon: '🦊', statuspage: null,                page: 'https://status.gitlab.com/',        dd: 'gitlab' },
    { id: 'bitbucket',    name: 'Bitbucket',         category: 'dev',       icon: '🪣', statuspage: null,                page: 'https://bitbucket.status.atlassian.com/', dd: 'bitbucket' },
    { id: 'vercel',       name: 'Vercel',            category: 'dev',       icon: '▲',  statuspage: 'vercel-status',  page: 'https://www.vercel-status.com/',    dd: 'vercel' },
    { id: 'netlify',      name: 'Netlify',           category: 'dev',       icon: '🟢', statuspage: null,                page: 'https://www.netlifystatus.com/',    dd: 'netlify' },
    { id: 'npm',          name: 'npm',               category: 'dev',       icon: '📦', statuspage: 'npmjs',           page: 'https://status.npmjs.org/',         dd: 'npm' },
    { id: 'cf-workers',   name: 'Cloudflare Workers',category: 'dev',       icon: '⚡',  statuspage: 'cloudflarestatus', page: 'https://www.cloudflarestatus.com/', dd: 'cloudflare-workers' },

    // ---- Communication ----
    { id: 'discord',      name: 'Discord',           category: 'comm',      icon: '💬',  summaryUrl: 'https://discordstatus.com/api/v2/summary.json', page: 'https://discordstatus.com/',        dd: 'discord' },
    { id: 'slack',        name: 'Slack',             category: 'comm',      icon: '💼',  statuspage: null,                page: 'https://slack-status.com/',         dd: 'slack' },
    { id: 'zoom',         name: 'Zoom',              category: 'comm',      icon: '📹',  summaryUrl: 'https://status.zoom.us/api/v2/summary.json',  page: 'https://status.zoom.us/',           dd: 'zoom' },
    { id: 'teams',        name: 'Microsoft Teams',   category: 'comm',      icon: '👥',  statuspage: null,                page: 'https://admin.teams.microsoft.com/',dd: 'microsoft-teams' },
    { id: 'telegram',     name: 'Telegram',          category: 'comm',      icon: '✈️',  statuspage: null,                page: 'https://telegram.org/',             dd: 'telegram' },
    { id: 'whatsapp',     name: 'WhatsApp',          category: 'comm',      icon: '🟢', statuspage: null,                page: 'https://www.whatsapp.com/status',   dd: 'whatsapp' },

    // ---- Productivity ----
    { id: 'notion',       name: 'Notion',            category: 'prod',      icon: '📝', statuspage: null,                page: 'https://status.notion.so/',         dd: 'notion' },
    { id: 'linear',       name: 'Linear',            category: 'prod',      icon: '📐', statuspage: null,                page: 'https://status.linear.app/',        dd: 'linear' },
    { id: 'figma',        name: 'Figma',             category: 'prod',      icon: '🎨',  summaryUrl: 'https://status.figma.com/api/v2/summary.json',   page: 'https://status.figma.com/',         dd: 'figma' },
    { id: 'asana',        name: 'Asana',             category: 'prod',      icon: '🟠', statuspage: null,                page: 'https://status.asana.com/',         dd: 'asana' },
    { id: 'trello',       name: 'Trello',            category: 'prod',      icon: '🔵', statuspage: null,                page: 'https://trello.status.atlassian.com/', dd: 'trello' },
    { id: 'dropbox',      name: 'Dropbox',           category: 'prod',      icon: '📦',  summaryUrl: 'https://status.dropbox.com/api/v2/summary.json',  page: 'https://status.dropbox.com/',       dd: 'dropbox' },

    // ---- Commerce ----
    { id: 'shopify',      name: 'Shopify',           category: 'commerce',  icon: '🛒', statuspage: 'status.shopify',  page: 'https://status.shopify.com/',       dd: 'shopify' },
    { id: 'stripe',       name: 'Stripe',            category: 'commerce',  icon: '💳', statuspage: null,                page: 'https://status.stripe.com/',        dd: 'stripe' },
    { id: 'paypal',       name: 'PayPal',            category: 'commerce',  icon: '🅿️', statuspage: null,                page: 'https://www.paypal-status.com/',    dd: 'paypal' },

    // ---- Gaming ----
    { id: 'steam',        name: 'Steam',             category: 'gaming',    icon: '🎮', statuspage: null,                page: 'https://steamstat.us/',             dd: 'steam' },
    { id: 'playstation',  name: 'PlayStation Network', category: 'gaming', icon: '🎮', statuspage: null,                page: 'https://status.playstation.com/',   dd: 'playstation-network' },
    { id: 'xbox',         name: 'Xbox Live',         category: 'gaming',    icon: '🟢', statuspage: null,                page: 'https://support.xbox.com/en-US/xbox-live-status', dd: 'xbox-live' },
    { id: 'epicgames',    name: 'Epic Games',        category: 'gaming',    icon: '🟣',  summaryUrl: 'https://status.epicgames.com/api/v2/summary.json', page: 'https://status.epicgames.com/',     dd: 'epic-games' },
    { id: 'riot',         name: 'Riot Games',        category: 'gaming',    icon: '🔴', statuspage: null,                page: 'https://status.riotgames.com/',     dd: 'riot-games' },
    { id: 'ea',           name: 'EA',                category: 'gaming',    icon: '🟦', statuspage: null,                page: 'https://www.ea.com/service-updates', dd: 'ea' },
    { id: 'ubisoft',      name: 'Ubisoft',           category: 'gaming',    icon: '🟠', statuspage: null,                page: 'https://status.ubisoft.com/',       dd: 'ubisoft' },
    { id: 'nintendo',     name: 'Nintendo',          category: 'gaming',    icon: '🔴', statuspage: null,                page: 'https://www.nintendo.com/consumer-service-status/', dd: 'nintendo' },
    { id: 'twitch',       name: 'Twitch',            category: 'gaming',    icon: '🟪',  summaryUrl: 'https://status.twitch.tv/api/v2/summary.json',    page: 'https://status.twitch.tv/',         dd: 'twitch' },
    { id: 'roblox',       name: 'Roblox',            category: 'gaming',    icon: '🟧', statuspage: null,                page: 'https://status.roblox.com/',        dd: 'roblox' },
    { id: 'blizzard',     name: 'Battle.net',        category: 'gaming',    icon: '⚔️', statuspage: null,                page: 'https://status.blizzard.com/',      dd: 'battlenet' },

    // ---- Social ----
    { id: 'twitter',      name: 'X (Twitter)',       category: 'social',    icon: '𝕏',   statuspage: null,                page: 'https://x.com/',                    dd: 'twitter' },
    { id: 'instagram',    name: 'Instagram',         category: 'social',    icon: '📷',  statuspage: null,                page: 'https://about.instagram.com/blog',  dd: 'instagram' },
    { id: 'facebook',     name: 'Facebook',          category: 'social',    icon: '👥',  statuspage: null,                page: 'https://metastatus.com/',          dd: 'facebook' },
    { id: 'reddit',       name: 'Reddit',            category: 'social',    icon: '🤖',  summaryUrl: 'https://www.redditstatus.com/api/v2/summary.json', page: 'https://www.redditstatus.com/',    dd: 'reddit' },
    { id: 'tiktok',       name: 'TikTok',            category: 'social',    icon: '🎵',  statuspage: null,                page: 'https://www.tiktok.com/',          dd: 'tiktok' },
    { id: 'linkedin',     name: 'LinkedIn',          category: 'social',    icon: '💼',  statuspage: null,                page: 'https://www.linkedin.com',         dd: 'linkedin' },

    // ---- Streaming / Media ----
    { id: 'spotify',      name: 'Spotify',           category: 'streaming', icon: '🎧', statuspage: 'spotify',         page: 'https://status.spotify.com/',      dd: 'spotify' },
    { id: 'netflix',      name: 'Netflix',           category: 'streaming', icon: '🎬', statuspage: null,                page: 'https://help.netflix.com/en/node/546', dd: 'netflix' },
    { id: 'youtube',      name: 'YouTube',           category: 'streaming', icon: '▶️',  statuspage: null,                page: 'https://status.youtube.com/',      dd: 'youtube' },

    // ---- AI ----
    { id: 'openai',       name: 'OpenAI',            category: 'ai',        icon: '🤖',  summaryUrl: 'https://status.openai.com/api/v2/summary.json',    page: 'https://status.openai.com/',        dd: 'openai' },
    { id: 'anthropic',    name: 'Anthropic',         category: 'ai',        icon: '🪞', statuspage: null,                page: 'https://www.anthropic.com',        dd: 'anthropic' },
    { id: 'midjourney',   name: 'Midjourney',        category: 'ai',        icon: '🎨',  statuspage: null,                page: 'https://docs.midjourney.com/',     dd: 'midjourney' },
    { id: 'huggingface',  name: 'Hugging Face',      category: 'ai',        icon: '🤗',  statuspage: null,                page: 'https://status.huggingface.com/',  dd: 'huggingface' },
    { id: 'replicate',    name: 'Replicate',         category: 'ai',        icon: '🔁',  statuspage: null,                page: 'https://replicate.com',            dd: 'replicate' },
  ];

  // ----------------------------------------------------------------
  // Status indicator → dot color + label
  // ----------------------------------------------------------------
  const INDICATOR = {
    none:        { label: 'downdetector_operational', dot: 'none',     color: '#10b981' },
    minor:       { label: 'downdetector_degraded',    dot: 'minor',    color: '#f59e0b' },
    major:       { label: 'downdetector_partial',     dot: 'major',    color: '#f97316' },
    critical:    { label: 'downdetector_major',       dot: 'critical', color: '#ef4444' },
    maintenance: { label: 'downdetector_maintenance', dot: 'maintenance', color: '#8b5cf6' },
  };

  // ----------------------------------------------------------------
  // Networking helpers
  // ----------------------------------------------------------------
  // Each service may either:
  //   - have a `statuspage` subdomain (used to build the default
  //     `https://<sub>.statuspage.io/api/v2/...` URL), OR
  //   - have explicit `summaryUrl` / `incidentsUrl` (used when the
  //     status page lives on a custom CNAME domain that doesn't
  //     allow CORS on the default statuspage.io subdomain — e.g.
  //     Twitch uses status.twitch.tv, Cloudflare uses
  //     www.cloudflarestatus.com, etc.)
  const DEFAULT_BASE = (sub) => `https://${sub}.statuspage.io`;
  const defaultSummaryUrl   = (sub) => `${DEFAULT_BASE(sub)}/api/v2/summary.json`;
  const defaultIncidentsUrl = (sub) => `${DEFAULT_BASE(sub)}/api/v2/incidents.json?since=${encodeURIComponent(new Date(Date.now() - 24 * 3600 * 1000).toISOString())}`;
  const summaryUrlFor   = (svc) => svc.summaryUrl   || (svc.statuspage ? defaultSummaryUrl(svc.statuspage)   : null);
  const incidentsUrlFor = (svc) => svc.incidentsUrl || (svc.statuspage ? defaultIncidentsUrl(svc.statuspage) : null);

  async function fetchSummary(svc) {
    const url = summaryUrlFor(svc);
    if (!url) return { ok: false, ms: 0, error: 'no_statuspage' };
    const start = performance.now();
    const ctrl  = new AbortController();
    const tid   = setTimeout(() => ctrl.abort(), 7000);
    try {
      const resp = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
      const ms   = Math.round(performance.now() - start);
      if (!resp.ok) return { ok: false, status: resp.status, ms, error: 'HTTP ' + resp.status };
      const data = await resp.json();
      return { ok: true, ms, data };
    } catch (e) {
      return { ok: false, ms: Math.round(performance.now() - start), error: e.name === 'AbortError' ? 'timeout' : e.message };
    } finally {
      clearTimeout(tid);
    }
  }

  async function fetchIncidents24h(svc) {
    const url = incidentsUrlFor(svc);
    if (!url) return null;
    try {
      const resp = await fetch(url, { cache: 'no-store' });
      if (!resp.ok) return null;
      const data = await resp.json();
      return (data.incidents || []).filter((inc) => inc.created_at);
    } catch (_) {
      return null;
    }
  }

  // ----------------------------------------------------------------
  // 24h timeline — returns array of 24 cells, each {hour, level}
  // level: 0 operational, 1 minor, 2 major, 3 critical, 4 maintenance
  // ----------------------------------------------------------------
  function buildTimeline(incidents) {
    const cells = new Array(24).fill(0);
    if (!incidents) return cells;
    const now = Date.now();
    const from = now - 24 * 3600 * 1000;
    for (const inc of incidents) {
      const start = new Date(inc.created_at).getTime();
      const end   = inc.resolved_at ? new Date(inc.resolved_at).getTime() : now;
      if (end < from || start > now) continue;
      // Clip to the 24h window
      const a = Math.max(start, from);
      const b = Math.min(end,   now);
      const lvl =
        inc.impact === 'critical'  ? 3 :
        inc.impact === 'major'     ? 2 :
        inc.impact === 'minor'     ? 1 :
        inc.impact === 'maintenance' ? 4 : 0;
      // Fill every hour that overlaps with [a, b]
      for (let h = 0; h < 24; h++) {
        const cellStart = now - (24 - h) * 3600 * 1000;
        const cellEnd   = cellStart + 3600 * 1000;
        if (cellStart <= b && cellEnd >= a) {
          if (lvl > cells[h]) cells[h] = lvl; // worst-severity wins
        }
      }
    }
    return cells;
  }

  // ----------------------------------------------------------------
  // SVG 24h mini-graph
  // ----------------------------------------------------------------
  function graphSVG(timeline, statusColor) {
    const cellW = 6, cellH = 18, gap = 1, totalW = 24 * (cellW + gap) - gap;
    const baseColor = statusColor || '#64748b';
    let svg = '<svg viewBox="0 0 ' + totalW + ' ' + cellH + '" width="' + totalW + '" height="' + cellH + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    for (let h = 0; h < 24; h++) {
      const lvl = timeline[h];
      const x = h * (cellW + gap);
      let fill;
      if      (lvl === 0) fill = '#10b981';             // green
      else if (lvl === 1) fill = '#f59e0b';             // amber
      else if (lvl === 2) fill = '#f97316';             // orange
      else if (lvl === 3) fill = '#ef4444';             // red
      else if (lvl === 4) fill = '#8b5cf6';             // purple
      else                fill = baseColor;
      svg += '<rect x="' + x + '" y="0" width="' + cellW + '" height="' + cellH + '" rx="1" fill="' + fill + '"/>';
    }
    svg += '</svg>';
    return svg;
  }

  // ----------------------------------------------------------------
  // Per-user "I noticed an issue" reports (localStorage)
  // ----------------------------------------------------------------
  const REPORTS_KEY = 'sitetrace.reports.v1';
  function loadReports() {
    try { return JSON.parse(localStorage.getItem(REPORTS_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function saveReports(reports) {
    try { localStorage.setItem(REPORTS_KEY, JSON.stringify(reports)); } catch (_) {}
  }
  function reportIssue(svcId) {
    const reports = loadReports();
    const list = (reports[svcId] || []).filter((t) => Date.now() - t < 24 * 3600 * 1000);
    list.push(Date.now());
    reports[svcId] = list;
    saveReports(reports);
    return list.length;
  }
  function countRecentReports(svcId) {
    const list = (loadReports()[svcId] || []).filter((t) => Date.now() - t < 24 * 3600 * 1000);
    return list.length;
  }

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------
  const SERVICE_STATE = new Map(); // id -> { ok, data | error, ms, timeline }

  function buildSkeleton(svc) {
    const card = document.createElement('div');
    card.className = 'card flex flex-col gap-3 p-4';
    card.dataset.serviceId = svc.id;
    card.innerHTML = ''
      + '<div class="flex items-center gap-3">'
      +   '<span class="text-2xl shrink-0">' + svc.icon + '</span>'
      +   '<div class="flex-1 min-w-0">'
      +     '<div class="font-semibold truncate">' + svc.name + '</div>'
      +     '<div class="text-[11px] text-slate-500 truncate">' + (svc.statuspage ? t('downdetector_loading') : t('downdetector_monitored')) + '</div>'
      +   '</div>'
      + '</div>'
      + '<div class="h-5 w-full bg-white/5 rounded animate-pulse"></div>';
    return card;
  }

  function buildCard(svc, state) {
    const card = document.createElement('div');
    card.className = 'card flex flex-col gap-3 p-4 service-card';
    card.dataset.serviceId = svc.id;
    card.dataset.category = svc.category;

    let dotClass, label, statusText, summary = '';
    if (state.ok) {
      const ind = (state.data.status && state.data.status.indicator) || 'none';
      const m   = INDICATOR[ind] || INDICATOR.none;
      dotClass   = 'status-dot--' + m.dot;
      label      = t(m.label);
      statusText = (state.data.status && state.data.status.description) || label;
    } else if (svc.statuspage) {
      dotClass   = 'status-dot--unknown';
      label      = t('downdetector_unknown');
      statusText = state.error === 'timeout' ? t('err_network') : (state.error || t('downdetector_unknown'));
    } else {
      // No statuspage — show "monitored" with link to downdetector.com
      dotClass   = 'status-dot--monitored';
      label      = t('downdetector_monitored');
      statusText = t('downdetector_no_live_status');
    }
    const timeline = state.timeline || new Array(24).fill(0);
    const reports  = countRecentReports(svc.id);

    const meta = []
      + '<span class="status-dot ' + dotClass + ' shrink-0"></span>'
      + '<span class="font-semibold truncate">' + svc.name + '</span>';

    const ddUrl = 'https://downdetector.com/status/' + (svc.dd || slugify(svc.name)) + '/';

    card.innerHTML = ''
      + '<div class="flex items-center justify-between gap-2">' + meta + '</div>'
      + '<div class="text-xs text-slate-400 leading-snug min-h-[2.5em]">' + escapeHtml(statusText) + '</div>'
      + '<div class="overflow-x-auto -mx-1 px-1" title="' + escapeHtml(t('downdetector_last_24h')) + '">' + graphSVG(timeline) + '</div>'
      + '<div class="flex items-center justify-between text-[11px] text-slate-500">'
      +   '<span>' + t('downdetector_last_24h') + ': ' + timeline.filter((l) => l > 0).length + ' ' + t('downdetector_incidents') + '</span>'
      +   '<span>' + (state.ok ? state.ms + ' ms' : '—') + '</span>'
      + '</div>'
      + (reports > 0
          ? '<div class="text-[11px] text-warn-400">⚠ ' + t('downdetector_you_reported').replace('{n}', reports) + '</div>'
          : '')
      + '<div class="flex items-center justify-between gap-2 pt-1 border-t border-white/5">'
      +   '<a href="' + ddUrl + '" target="_blank" rel="noopener noreferrer sponsored" class="text-xs text-brand-300 hover:text-brand-200">'
      +     t('downdetector_view_on_dd') + ' ↗'
      +   '</a>'
      +   '<div class="flex items-center gap-2">'
      +     (svc.page
            ? '<a href="' + svc.page + '" target="_blank" rel="noopener noreferrer" class="text-[11px] text-slate-400 hover:text-slate-200">' + t('downdetector_official') + ' ↗</a>'
            : '')
      +     '<button type="button" data-report="' + svc.id + '" class="text-[11px] text-slate-400 hover:text-warn-300" title="' + escapeHtml(t('downdetector_report_hint')) + '">'
      +       t('downdetector_report_issue')
      +     '</button>'
      +   '</div>'
      + '</div>';

    const btn = card.querySelector('[data-report]');
    if (btn) btn.addEventListener('click', () => {
      reportIssue(svc.id);
      // Re-render this card
      const next = buildCard(svc, SERVICE_STATE.get(svc.id) || state);
      card.replaceWith(next);
    });
    return card;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function slugify(s) {
    return String(s).toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ----------------------------------------------------------------
  // Search
  // ----------------------------------------------------------------
  function renderSearchResult(query) {
    const slot = $('#search-result');
    if (!slot) return;
    if (!query) { slot.innerHTML = ''; slot.classList.add('hidden'); return; }
    const q = query.toLowerCase().trim();
    const known = SERVICES.find((s) => s.id === q || s.name.toLowerCase() === q || s.dd === q);
    if (known) {
      // Found in our list — show a banner pointing to its card
      const card = document.querySelector('[data-service-id="' + known.id + '"]');
      slot.classList.remove('hidden');
      slot.innerHTML = ''
        + '<div class="card flex flex-wrap items-center justify-between gap-3 p-4 border-brand-500/30">'
        +   '<div class="flex items-center gap-3">'
        +     '<span class="text-2xl">' + known.icon + '</span>'
        +     '<div>'
        +       '<div class="font-semibold">' + escapeHtml(known.name) + '</div>'
        +       '<div class="text-xs text-slate-400">' + t('downdetector_in_our_list') + '</div>'
        +     '</div>'
        +   '</div>'
        +   '<div class="flex items-center gap-2">'
        +     '<a href="#svc-' + known.id + '" data-jump="' + known.id + '" class="btn-secondary text-sm">'
        +       t('downdetector_jump_to_card') + ' ↓'
        +     '</a>'
        +   '</div>'
        + '</div>';
      const jump = slot.querySelector('[data-jump]');
      if (jump) jump.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector('[data-service-id="' + known.id + '"]');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.add('ring-2', 'ring-brand-500/50');
          setTimeout(() => target.classList.remove('ring-2', 'ring-brand-500/50'), 1800);
        }
      });
    } else {
      // Not tracked — deep link to downdetector.com
      const slug = slugify(query);
      const ddUrl = 'https://downdetector.com/status/' + slug + '/';
      slot.classList.remove('hidden');
      slot.innerHTML = ''
        + '<div class="card flex flex-wrap items-center justify-between gap-3 p-4 border-warn-500/30">'
        +   '<div class="flex items-center gap-3">'
        +     '<div>'
        +       '<div class="font-semibold">' + escapeHtml(query) + '</div>'
        +       '<div class="text-xs text-slate-400">' + t('downdetector_not_tracked') + '</div>'
        +     '</div>'
        +   '</div>'
        +   '<a href="' + ddUrl + '" target="_blank" rel="noopener noreferrer sponsored" class="btn-primary text-sm">'
        +     t('downdetector_check_on_dd') + ' ↗'
        +   '</a>'
        + '</div>';
    }
  }

  function bindSearch() {
    const form   = $('#search-form');
    const input  = $('#search-input');
    if (!form || !input) return;
    // If the URL has ?q=, prefill and show the result
    const params = new URLSearchParams(location.search);
    if (params.get('q')) {
      input.value = params.get('q');
      renderSearchResult(params.get('q'));
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      renderSearchResult(input.value);
    });
    let t_id;
    input.addEventListener('input', () => {
      clearTimeout(t_id);
      t_id = setTimeout(() => renderSearchResult(input.value), 200);
    });
  }

  // ----------------------------------------------------------------
  // Category filter
  // ----------------------------------------------------------------
  function bindCategoryFilter() {
    const tabs = $$('.filter-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        const cat = tab.dataset.cat;
        $$('.service-card').forEach((card) => {
          card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
        });
      });
    });
  }

  // ----------------------------------------------------------------
  // Boot
  // ----------------------------------------------------------------
  async function boot() {
    const grid = $('#status-grid');
    if (!grid) return;
    // Skeletons first
    SERVICES.forEach((svc) => grid.appendChild(buildSkeleton(svc)));

    // Fetch all in parallel
    const results = await Promise.all(SERVICES.map(async (svc) => {
      if (!summaryUrlFor(svc)) {
        return { svc, summary: { ok: false, ms: 0, error: 'no_statuspage' }, incidents: null };
      }
      const [summary, incidents] = await Promise.all([
        fetchSummary(svc),
        fetchIncidents24h(svc),
      ]);
      return { svc, summary, incidents };
    }));

    // Replace skeletons with real cards
    grid.innerHTML = '';
    results.forEach(({ svc, summary, incidents }) => {
      const state = {
        ok: summary.ok,
        ms: summary.ms,
        data: summary.data,
        error: summary.error,
        timeline: incidents ? buildTimeline(incidents) : new Array(24).fill(0),
      };
      SERVICE_STATE.set(svc.id, state);
      grid.appendChild(buildCard(svc, state));
    });
    bindCategoryFilter();
    bindSearch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
