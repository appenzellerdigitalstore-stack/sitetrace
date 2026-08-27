/* ================================================================
 * SiteTrace — "Is it down for me?"
 *
 * Combines the downdetector-style service grid (live status from
 * statuspage.io for 50+ services) with a user-side URL check:
 * paste any URL, we probe it from the browser and show whether
 * it is reachable from *your* network.
 *
 * Runs entirely in the browser. No backend. Per-user "I noticed
 * an issue" reports are stored in sessionStorage (per-tab,
 * cleared on close — never sent anywhere).
 * ================================================================ */
(function () {
  'use strict';

  const t = (k) => (window.I18N && window.I18N.t) ? window.I18N.t(k) : k;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // ----------------------------------------------------------------
  // Service catalog (kept from the previous downdetector page)
  // ----------------------------------------------------------------
  const SERVICES = [
    // ---- Cloud & Infrastructure ----
    { id: 'cloudflare',   name: 'Cloudflare',        category: 'infra',     icon: '☁️',  summaryUrl: 'https://www.cloudflarestatus.com/api/v2/summary.json',  page: 'https://www.cloudflarestatus.com/',   dd: 'cloudflare' },
    { id: 'aws',          name: 'Amazon AWS',        category: 'infra',     icon: '🟧', statuspage: null,                page: 'https://health.aws.amazon.com/public/currentevents', dd: 'aws' },
    { id: 'azure',        name: 'Microsoft Azure',   category: 'infra',     icon: '🪟', statuspage: 'azurestatus',  page: 'https://azure.status.microsoft/en-us/status/',     dd: 'microsoft-azure' },
    { id: 'googlecloud',  name: 'Google Cloud',      category: 'infra',     icon: '🔵', statuspage: 'googlecloudplatform', page: 'https://status.cloud.google.com/',  dd: 'google-cloud' },
    { id: 'digitalocean', name: 'DigitalOcean',      category: 'infra',     icon: '🌊',  summaryUrl: 'https://status.digitalocean.com/api/v2/summary.json',  page: 'https://status.digitalocean.com/',   dd: 'digitalocean' },
    { id: 'heroku',       name: 'Heroku',            category: 'infra',     icon: '🟪', statuspage: null,                page: 'https://status.heroku.com/',         dd: 'heroku' },
    { id: 'fastly',       name: 'Fastly',            category: 'infra',     icon: '⚡', statuspage: null,                page: 'https://status.fastly.com/',         dd: 'fastly' },

    // ---- Developer tools ----
    { id: 'github',       name: 'GitHub',            category: 'dev',       icon: '🐙', summaryUrl: 'https://www.githubstatus.com/api/v2/summary.json',  page: 'https://www.githubstatus.com/',     dd: 'github' },
    { id: 'gitlab',       name: 'GitLab',            category: 'dev',       icon: '🦊', statuspage: null,                page: 'https://status.gitlab.com/',        dd: 'gitlab' },
    { id: 'bitbucket',    name: 'Bitbucket',         category: 'dev',       icon: '🪣', summaryUrl: 'https://status.atlassian.com/api/v2/summary.json',    page: 'https://bitbucket.status.atlassian.com/', dd: 'bitbucket' },
    { id: 'vercel',       name: 'Vercel',            category: 'dev',       icon: '▲',  summaryUrl: 'https://www.vercel-status.com/api/v2/summary.json',   page: 'https://www.vercel-status.com/',    dd: 'vercel' },
    { id: 'netlify',      name: 'Netlify',           category: 'dev',       icon: '🟢', statuspage: null,                page: 'https://www.netlifystatus.com/',    dd: 'netlify' },
    { id: 'npm',          name: 'npm',               category: 'dev',       icon: '📦', statuspage: 'npmjs',           page: 'https://status.npmjs.org/',         dd: 'npm' },
    { id: 'cf-workers',   name: 'Cloudflare Workers',category: 'dev',       icon: '⚡',  summaryUrl: 'https://www.cloudflarestatus.com/api/v2/summary.json', page: 'https://www.cloudflarestatus.com/', dd: 'cloudflare-workers' },

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
    { id: 'shopify',      name: 'Shopify',           category: 'commerce',  icon: '🛒', summaryUrl: 'https://status.shopify.com/api/v2/summary.json',  page: 'https://status.shopify.com/',       dd: 'shopify' },
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
    { id: 'replicate',    name: 'Replicate',         category: 'ai',        icon: '🔁', statuspage: null,                page: 'https://replicate.com',            dd: 'replicate' },
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

  async function mapWithConcurrency(items, limit, mapper) {
    const out = new Array(items.length);
    let i = 0;
    async function worker() {
      while (true) {
        const idx = i++;
        if (idx >= items.length) return;
        out[idx] = await mapper(items[idx], idx);
      }
    }
    const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
    await Promise.all(workers);
    return out;
  }

  function buildTimeline(incidents) {
    const cells = new Array(24).fill(0);
    if (!incidents) return cells;
    const now = Date.now();
    const from = now - 24 * 3600 * 1000;
    for (const inc of incidents) {
      const start = new Date(inc.created_at).getTime();
      const end   = inc.resolved_at ? new Date(inc.resolved_at).getTime() : now;
      if (end < from || start > now) continue;
      const a = Math.max(start, from);
      const b = Math.min(end,   now);
      const lvl =
        inc.impact === 'critical'  ? 3 :
        inc.impact === 'major'     ? 2 :
        inc.impact === 'minor'     ? 1 :
        inc.impact === 'maintenance' ? 4 : 0;
      for (let h = 0; h < 24; h++) {
        const cellStart = now - (24 - h) * 3600 * 1000;
        const cellEnd   = cellStart + 3600 * 1000;
        if (cellStart <= b && cellEnd >= a) {
          if (lvl > cells[h]) cells[h] = lvl;
        }
      }
    }
    return cells;
  }

  function graphSVG(timeline, statusColor) {
    const cellW = 6, cellH = 18, gap = 1, totalW = 24 * (cellW + gap) - gap;
    const baseColor = statusColor || '#64748b';
    let svg = '<svg viewBox="0 0 ' + totalW + ' ' + cellH + '" width="' + totalW + '" height="' + cellH + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    for (let h = 0; h < 24; h++) {
      const lvl = timeline[h];
      const x = h * (cellW + gap);
      let fill;
      if      (lvl === 0) fill = '#10b981';
      else if (lvl === 1) fill = '#f59e0b';
      else if (lvl === 2) fill = '#f97316';
      else if (lvl === 3) fill = '#ef4444';
      else if (lvl === 4) fill = '#8b5cf6';
      else                fill = baseColor;
      svg += '<rect x="' + x + '" y="0" width="' + cellW + '" height="' + cellH + '" rx="1" fill="' + fill + '"/>';
    }
    svg += '</svg>';
    return svg;
  }

  // ----------------------------------------------------------------
  // Per-user "I noticed an issue" reports (sessionStorage — per-tab)
  // ----------------------------------------------------------------
  const REPORTS_KEY = 'sitetrace.reports.v1';
  function loadReports() {
    try { return JSON.parse(sessionStorage.getItem(REPORTS_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function saveReports(reports) {
    try { sessionStorage.setItem(REPORTS_KEY, JSON.stringify(reports)); } catch (_) {}
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
  // URL check (the new "is it down for me" feature)
  // ----------------------------------------------------------------
  function cleanUrl(input) {
    let s = String(input || '').trim();
    if (!s) return '';
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    try { return new URL(s).toString().replace(/\/$/, ''); } catch (_) { return s; }
  }
  function hostFromUrl(url) {
    try { return new URL(url).host.toLowerCase(); } catch (_) { return ''; }
  }
  function findTrackedService(host) {
    if (!host) return null;
    const h = host.replace(/^www\./, '');
    // Try matching against each service's `page` domain or its `id` (loose)
    for (const svc of SERVICES) {
      try {
        const pdom = new URL(svc.page).host.toLowerCase().replace(/^www\./, '');
        if (pdom === h || pdom.endsWith('.' + h) || h.endsWith('.' + pdom)) return svc;
        if (svc.id && h.includes(svc.id)) return svc;
      } catch (_) { /* ignore */ }
    }
    return null;
  }
  async function probeUrl(url) {
    const start = performance.now();
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 8000);
    try {
      const resp = await fetch(url, { method: 'GET', cache: 'no-store', mode: 'cors', credentials: 'omit', redirect: 'follow', signal: ctrl.signal });
      clearTimeout(tid);
      return { reachable: true, readable: true, status: resp.status, ms: Math.round(performance.now() - start) };
    } catch (e1) {
      try {
        const ctrl2 = new AbortController();
        const tid2 = setTimeout(() => ctrl2.abort(), 8000);
        await fetch(url, { method: 'GET', cache: 'no-store', mode: 'no-cors', credentials: 'omit', redirect: 'follow', signal: ctrl2.signal });
        clearTimeout(tid2);
        return { reachable: true, readable: false, ms: Math.round(performance.now() - start) };
      } catch (e2) {
        return { reachable: false, readable: false, ms: Math.round(performance.now() - start), error: e2.message || e1.message };
      }
    }
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function slugify(s) {
    return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function pillClass(result) {
    if (result.reachable) return 'check-pill check-pill--up';
    return 'check-pill check-pill--down';
  }
  function pillLabel(result) {
    if (result.reachable) return t('isitdown_pill_up');
    return t('isitdown_pill_down');
  }

  function renderCheckResult(url, result, known) {
    const slot = $('#check-result');
    const tips = $('#tips');
    if (!slot) return;
    slot.classList.remove('hidden');

    // ---- Your-network pill (reachable / unreachable / CORS-readable / not) ----
    let networkPill;
    if (result.reachable && result.readable) {
      networkPill = '<span class="check-pill check-pill--up"><span class="dot"></span>' + escapeHtml(t('isitdown_pill_up')) + '</span>';
    } else if (result.reachable) {
      networkPill = '<span class="check-pill check-pill--up"><span class="dot"></span>' + escapeHtml(t('isitdown_pill_up')) + ' · ' + escapeHtml(t('isitdown_reachable_cors')) + '</span>';
    } else {
      networkPill = '<span class="check-pill check-pill--down"><span class="dot"></span>' + escapeHtml(t('isitdown_unreachable')) + '</span>';
    }

    // ---- Status detail lines ----
    let statusDetail;
    if (result.reachable && result.readable) {
      statusDetail = t('isitdown_summary_reachable').replace('{ms}', result.ms).replace('{status}', result.status);
    } else if (result.reachable) {
      statusDetail = t('isitdown_summary_cors').replace('{ms}', result.ms);
    } else {
      statusDetail = result.ms + ' ' + t('ping_ms_label') + ' · ' + (result.error || t('isitdown_inconclusive'));
    }

    // ---- Official status block (only when the service is tracked) ----
    let officialBlock = '';
    let incidentListHtml = '';
    if (known && known.state && known.state.ok && known.state.data) {
      // Service is in our tracker AND we have a fresh response
      const status = known.state.data.status || {};
      const indicator = status.indicator || 'none';
      const description = status.description || t('isitdown_all_systems_ok');
      const incidents = (known.state.data.incidents || []).filter((inc) => inc.created_at);

      let officialPill;
      if (indicator === 'none') {
        officialPill = '<span class="check-pill check-pill--up"><span class="dot"></span>' + escapeHtml(t('isitdown_pill_official_ok')) + '</span>';
      } else if (indicator === 'critical') {
        officialPill = '<span class="check-pill check-pill--down"><span class="dot"></span>' + escapeHtml(t('isitdown_pill_official_issue')) + '</span>';
      } else {
        officialPill = '<span class="check-pill check-pill--unknown"><span class="dot"></span>' + escapeHtml(t('isitdown_pill_official_issue')) + '</span>';
      }

      // Build a list of active incidents (open, not yet resolved)
      const openIncidents = incidents.filter((inc) => !inc.resolved_at);
      if (openIncidents.length) {
        incidentListHtml = '<ul class="mt-2 space-y-2 text-sm">'
          + openIncidents.slice(0, 4).map((inc) => {
              const impact = inc.impact || 'minor';
              const impactPill = impact === 'critical'
                ? '<span class="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-danger-500/15 text-danger-400">critical</span>'
                : impact === 'major'
                  ? '<span class="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-warn-500/15 text-warn-400">major</span>'
                  : '<span class="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">minor</span>';
              const status = inc.status || 'investigating';
              const statusTxt = status === 'investigating' ? 'Investigating'
                : status === 'identified' ? 'Identified'
                : status === 'monitoring' ? 'Monitoring'
                : status === 'resolved' ? 'Resolved'
                : status;
              const link = inc.shortlink || (known && known.page) || '#';
              return '<li class="rounded-md border border-white/5 bg-white/[0.02] p-2.5">'
                + '<div class="flex flex-wrap items-center gap-2">'
                + '<span class="text-slate-200 font-medium">' + escapeHtml(inc.name || 'Incident') + '</span>'
                + impactPill
                + '<span class="text-[10px] text-slate-500 uppercase tracking-wider">·</span>'
                + '<span class="text-[10px] text-slate-400 uppercase tracking-wider">' + escapeHtml(statusTxt) + '</span>'
                + '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer" class="ml-auto text-[11px] text-brand-300 hover:text-brand-200">' + escapeHtml(t('isitdown_view_incident')) + ' ↗</a>'
                + '</div></li>';
            }).join('')
          + '</ul>';
      }

      officialBlock = ''
        + '<div class="rounded-lg border border-white/5 bg-white/[0.02] p-3 mt-3">'
        + '  <div class="flex flex-wrap items-center gap-2">'
        +      officialPill
        + '    <span class="text-xs text-slate-300">' + escapeHtml(description) + '</span>'
        + '    <a href="' + escapeHtml(known.page) + '" target="_blank" rel="noopener noreferrer" class="ml-auto text-[11px] text-brand-300 hover:text-brand-200">' + escapeHtml(t('isitdown_view_status_page')) + ' ↗</a>'
        + '  </div>'
        +    (openIncidents.length
              ? '<div class="mt-2 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">' + escapeHtml(t('isitdown_official_incidents_title')) + '</div>' + incidentListHtml
              : '')
        + '</div>';
    } else if (known) {
      // Service is in our tracker but we couldn't fetch its status right now
      officialBlock = ''
        + '<div class="rounded-lg border border-white/5 bg-white/[0.02] p-3 mt-3 text-sm text-slate-400">'
        + '  ' + escapeHtml(t('downdetector_loading'))
        + '</div>';
    }

    // ---- Tracked / untracked note ----
    const knownLine = known
      ? '<div class="text-xs text-slate-400">' + escapeHtml(t('isitdown_match_known')) + ' → <span class="text-slate-200 font-medium">' + escapeHtml(known.name) + '</span></div>'
      : '<div class="text-xs text-slate-400">' + escapeHtml(t('isitdown_match_unknown')) + '</div>';

    // ---- Buttons ----
    const ddUrl = 'https://downdetector.com/status/' + slugify(hostFromUrl(url) || url) + '/';
    const openNewTab = '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" class="btn-ghost">'
      + escapeHtml(t('ping_open_in_tab')) + ' ↗</a>';
    const ddBtn = '<a href="' + escapeHtml(ddUrl) + '" target="_blank" rel="noopener noreferrer sponsored" class="btn-ghost">'
      + escapeHtml(t('downdetector_view_on_dd')) + ' ↗</a>';

    // ---- Data list (Target / Status / Latency / Protocol) ----
    const dataList = ''
      + '<dl class="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm mt-3">'
      + '  <div><dt class="text-slate-500 text-[11px] uppercase tracking-wider">' + escapeHtml(t('isitdown_status_label')) + '</dt><dd class="font-mono">' + (result.readable ? ('HTTP ' + result.status) : escapeHtml(t('isitdown_reachable_cors'))) + '</dd></div>'
      + '  <div><dt class="text-slate-500 text-[11px] uppercase tracking-wider">' + escapeHtml(t('isitdown_latency_label')) + '</dt><dd class="font-mono">' + result.ms + ' ' + escapeHtml(t('ping_ms_label')) + '</dd></div>'
      + '  <div><dt class="text-slate-500 text-[11px] uppercase tracking-wider">' + escapeHtml(t('isitdown_protocol_label')) + '</dt><dd class="font-mono">' + escapeHtml(result.protocol) + '</dd></div>'
      + '  <div><dt class="text-slate-500 text-[11px] uppercase tracking-wider">' + escapeHtml(t('ping_target_label')) + '</dt><dd class="font-mono truncate">' + escapeHtml(hostFromUrl(url) || url) + '</dd></div>'
      + '</dl>';

    slot.innerHTML = ''
      + '<div class="card p-5 border-brand-500/30">'
      + '  <div class="flex flex-wrap items-center justify-between gap-3">'
      + '    <div class="min-w-0">'
      + '      <div class="text-xs text-slate-500">' + escapeHtml(t('isitdown_your_network')) + '</div>'
      + '      <div class="font-mono text-sm sm:text-base break-all">' + escapeHtml(url) + '</div>'
      + '    </div>'
      + '    <div class="flex flex-wrap items-center gap-2">'
      +        networkPill
      + '    </div>'
      + '  </div>'
      +      dataList
      + '  <div class="mt-3 flex flex-wrap items-center justify-between gap-3">'
      + '    <div class="flex flex-col gap-1">'
      +        knownLine
      + '      <div class="text-xs text-slate-500">' + escapeHtml(statusDetail) + '</div>'
      + '    </div>'
      + '    <div class="flex flex-wrap items-center gap-2">'
      +        openNewTab
      +        ddBtn
      + '    </div>'
      + '  </div>'
      +    officialBlock
      + '</div>';

    // Show the troubleshooting tips only when the result is "down"
    if (tips) tips.classList.toggle('hidden', result.reachable);

    // Smooth-scroll the result card into view (NOT the service card) so
    // the user can see everything they searched for in one place.
    slot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function bindCheck() {
    const form  = $('#check-form');
    const input = $('#check-input');
    if (!form || !input) return;
    const params = new URLSearchParams(location.search);
    if (params.get('q')) {
      input.value = params.get('q');
      // Don't auto-run on load — let the user press the button. But pre-fill.
    }
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = cleanUrl(input.value);
      if (!url) return;
      const result = await probeUrl(url);
      const known = findTrackedService(hostFromUrl(url));
      if (known) known.state = SERVICE_STATE.get(known.id);
      LAST_CHECK.url = url;
      LAST_CHECK.result = result;
      LAST_CHECK.known = known;
      renderCheckResult(url, result, known);
    });
  }

  // ----------------------------------------------------------------
  // Service-card rendering (reused for the grid)
  // ----------------------------------------------------------------
  const SERVICE_STATE = new Map();

  // Cache the last URL-check inputs so we can re-render the result
  // card when the user switches languages via the header switcher.
  const LAST_CHECK = { url: null, result: null, known: null };

  function retranslateAll() {
    if (LAST_CHECK.url) {
      renderCheckResult(LAST_CHECK.url, LAST_CHECK.result, LAST_CHECK.known);
    }
    const grid = $('#status-grid');
    if (grid) {
      // Re-render every service card in place so all t() values refresh
      grid.innerHTML = '';
      SERVICES.forEach((svc) => {
        const state = SERVICE_STATE.get(svc.id);
        if (state) grid.appendChild(buildCard(svc, state));
        else grid.appendChild(buildSkeleton(svc));
      });
    }
  }

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

    const hasLiveApi = !!(svc.statuspage || svc.summaryUrl);
    let dotClass, label, statusText;
    if (state.ok) {
      const ind = (state.data.status && state.data.status.indicator) || 'none';
      const m   = INDICATOR[ind] || INDICATOR.none;
      dotClass   = 'status-dot--' + m.dot;
      label      = t(m.label);
      statusText = (state.data.status && state.data.status.description) || label;
    } else if (hasLiveApi) {
      dotClass   = 'status-dot--unknown';
      label      = t('downdetector_unknown');
      statusText = state.error === 'timeout' ? t('err_network') : (state.error || t('downdetector_unknown'));
    } else {
      dotClass   = 'status-dot--monitored';
      label      = t('downdetector_monitored');
      statusText = t('downdetector_no_live_status');
    }
    const timeline = state.timeline || new Array(24).fill(0);
    const reports  = countRecentReports(svc.id);

    const meta = ''
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
      const next = buildCard(svc, SERVICE_STATE.get(svc.id) || state);
      card.replaceWith(next);
    });
    return card;
  }

  // ----------------------------------------------------------------
  // Category filter
  // ----------------------------------------------------------------
  function bindCategoryFilter() {
    const tabs = $$('.filter-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((tt) => tt.classList.remove('is-active'));
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
    bindCheck();
    const grid = $('#status-grid');
    if (!grid) return;
    SERVICES.forEach((svc) => grid.appendChild(buildSkeleton(svc)));

    const results = await mapWithConcurrency(SERVICES, 8, async (svc) => {
      if (!summaryUrlFor(svc)) {
        return { svc, summary: { ok: false, ms: 0, error: 'no_statuspage' }, incidents: null };
      }
      const [summary, incidents] = await Promise.all([
        fetchSummary(svc),
        fetchIncidents24h(svc),
      ]);
      return { svc, summary, incidents };
    });

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

    // Re-translate JS-rendered cards when the user switches languages
    // via the header switcher. The static data-i18n elements update on
    // their own, but these cards were built once with whatever language
    // was active at the time.
    if (window.I18N && typeof window.I18N.onChange === 'function') {
      window.I18N.onChange(retranslateAll);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
