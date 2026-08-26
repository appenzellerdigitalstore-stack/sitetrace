/* ================================================================
 * SiteTrace — Service Status (Downdetector-style) page
 * Pulls live status from each service's official statuspage.io
 * JSON endpoint, and from a small fallback list of services that
 * expose their own API.
 *
 * Runs entirely in the browser — no backend, no analytics, no
 * session storage of which services you looked at.
 * ================================================================ */
(function () {
  'use strict';

  const t = (k) => (window.I18N && window.I18N.t) ? window.I18N.t(k) : k;

  // Curated list of popular services with public statuspage.io
  // JSON endpoints. Add more by appending `{ id, name, ... }`.
  // statuspage.io is CORS-friendly: Access-Control-Allow-Origin: *
  const SERVICES = [
    { id: 'cloudflare', name: 'Cloudflare', category: 'infra',  statuspage: 'cloudflarestatus',  page: 'https://www.cloudflarestatus.com/', icon: '☁️' },
    { id: 'github',     name: 'GitHub',     category: 'dev',    statuspage: 'githubstatus',      page: 'https://www.githubstatus.com/',     icon: '🐙' },
    { id: 'discord',    name: 'Discord',    category: 'social', statuspage: 'discordstatus',     page: 'https://discordstatus.com/',        icon: '💬' },
    { id: 'openai',     name: 'OpenAI',     category: 'ai',     statuspage: 'statusopenai',      page: 'https://status.openai.com/',        icon: '🤖' },
    { id: 'vercel',     name: 'Vercel',     category: 'dev',    statuspage: 'vercel-status',     page: 'https://www.vercel-status.com/',    icon: '▲'  },
    { id: 'slack',      name: 'Slack',      category: 'work',   statuspage: 'slack-status',      page: 'https://slack-status.com/',         icon: '💼' },
    { id: 'zoom',       name: 'Zoom',       category: 'work',   statuspage: 'status.zoom',       page: 'https://status.zoom.us/',           icon: '📹' },
    { id: 'dropbox',    name: 'Dropbox',    category: 'storage', statuspage: 'status.dropbox',   page: 'https://status.dropbox.com/',        icon: '📦' },
    { id: 'notion',     name: 'Notion',     category: 'work',   statuspage: 'status.notion',     page: 'https://status.notion.so/',         icon: '📝' },
    { id: 'figma',      name: 'Figma',      category: 'design', statuspage: 'status.figma',      page: 'https://status.figma.com/',         icon: '🎨' },
    { id: 'linear',     name: 'Linear',     category: 'work',   statuspage: 'status.linear',     page: 'https://status.linear.app/',        icon: '📐' },
    { id: 'shopify',    name: 'Shopify',    category: 'commerce', statuspage: 'status.shopify',  page: 'https://status.shopify.com/',       icon: '🛒' },
    { id: 'cloudflare-workers', name: 'Cloudflare Workers', category: 'dev', statuspage: 'cloudflarestatus', page: 'https://www.cloudflarestatus.com/', icon: '⚡' },
    { id: 'azure',      name: 'Microsoft Azure', category: 'infra', statuspage: 'azurestatus',   page: 'https://azure.status.microsoft/en-us/status/history/', icon: '🪟' },
    { id: 'heroku',     name: 'Heroku',     category: 'dev',    statuspage: 'status.heroku',     page: 'https://status.heroku.com/',        icon: '🟪' },
    { id: 'twilio',     name: 'Twilio',     category: 'dev',    statuspage: 'status.twilio',     page: 'https://status.twilio.com/',        icon: '📞' },
  ];

  const SUMMARY_URL = (sub) => `https://${sub}.statuspage.io/api/v2/summary.json`;

  // Map statuspage.io indicator → friendly label key + dot class
  const INDICATOR_LABEL = {
    none:        { label: 'downdetector_operational', dot: 'none' },
    minor:       { label: 'downdetector_degraded',    dot: 'minor' },
    major:       { label: 'downdetector_partial',     dot: 'major' },
    critical:    { label: 'downdetector_major',       dot: 'critical' },
    maintenance: { label: 'downdetector_maintenance', dot: 'maintenance' },
  };

  // ---- Per-service fetch with timeout ---------------------------
  async function fetchOne(service, opts) {
    const start = performance.now();
    const ctrl  = new AbortController();
    const tid   = setTimeout(() => ctrl.abort(), opts.timeoutMs);
    try {
      const url = SUMMARY_URL(service.statuspage);
      const resp = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
      const ms   = Math.round(performance.now() - start);
      if (!resp.ok) {
        return { service, ok: false, status: resp.status, ms, error: 'HTTP ' + resp.status };
      }
      const data = await resp.json();
      return { service, ok: true, ms, data };
    } catch (e) {
      const ms = Math.round(performance.now() - start);
      return { service, ok: false, ms, error: e.name === 'AbortError' ? 'timeout' : e.message };
    } finally {
      clearTimeout(tid);
    }
  }

  // ---- Render a single card in the grid -------------------------
  function renderCard(service, result) {
    const tpl = document.createElement('button');
    tpl.type = 'button';
    tpl.className = 'service-card card text-left w-full flex items-center gap-3 p-3 cursor-pointer';
    tpl.dataset.serviceId = service.id;
    let dot, label;
    if (result.ok) {
      const ind = (result.data.status && result.data.status.indicator) || 'none';
      const m   = INDICATOR_LABEL[ind] || INDICATOR_LABEL.none;
      dot   = 'status-dot--' + m.dot;
      label = t(m.label);
    } else {
      dot   = 'status-dot--unknown';
      label = t('downdetector_unknown');
    }
    tpl.innerHTML = ''
      + '<div class="text-2xl shrink-0" aria-hidden="true">' + service.icon + '</div>'
      + '<div class="flex-1 min-w-0">'
      +   '<div class="font-semibold truncate">' + service.name + '</div>'
      +   '<div class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">'
      +     '<span class="status-dot ' + dot + '"></span>'
      +     '<span class="truncate">' + label + '</span>'
      +   '</div>'
      + '</div>'
      + '<div class="text-[10px] text-slate-500 font-mono text-right shrink-0">'
      +   (result.ok ? (result.ms + ' ms') : '—')
      + '</div>';
    tpl.addEventListener('click', () => selectService(service, result));
    return tpl;
  }

  // ---- Render the detail panel for a service --------------------
  function selectService(service, result) {
    document.querySelectorAll('[data-service-id]').forEach((el) => {
      el.dataset.selected = (el.dataset.serviceId === service.id) ? 'true' : 'false';
    });
    const panel = document.getElementById('status-detail');
    panel.classList.remove('hidden');
    const dot = document.getElementById('status-detail-dot');
    const name = document.getElementById('status-detail-name');
    const desc = document.getElementById('status-detail-desc');
    const ms   = document.getElementById('status-detail-ms');
    const tEl  = document.getElementById('status-detail-time');
    const link = document.getElementById('status-detail-link');

    name.textContent = service.name;
    link.href = service.page;
    link.textContent = t('downdetector_view_statuspage') + ' →';

    if (result.ok) {
      const ind = (result.data.status && result.data.status.indicator) || 'none';
      const m   = INDICATOR_LABEL[ind] || INDICATOR_LABEL.none;
      dot.className = 'status-dot status-dot--' + m.dot;
      desc.textContent = (result.data.status && result.data.status.description) || t(m.label);
      ms.textContent = result.ms + ' ms';
    } else {
      dot.className = 'status-dot status-dot--unknown';
      desc.textContent = (result.error === 'timeout') ? t('err_network') : (result.error || t('downdetector_unknown'));
      ms.textContent = '—';
    }
    tEl.textContent = new Date().toLocaleTimeString();

    // Components
    const compUl = document.getElementById('status-components');
    compUl.innerHTML = '';
    if (result.ok && Array.isArray(result.data.components)) {
      result.data.components.forEach((c) => {
        const li = document.createElement('li');
        li.className = 'flex items-center gap-2';
        const cind = INDICATOR_LABEL[c.status] || INDICATOR_LABEL.none;
        li.innerHTML = '<span class="status-dot status-dot--' + cind.dot + ' shrink-0"></span>'
          + '<span class="flex-1">' + c.name + '</span>'
          + '<span class="text-xs text-slate-500">' + t(cind.label) + '</span>';
        compUl.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.className = 'text-slate-500';
      li.textContent = t('downdetector_unknown');
      compUl.appendChild(li);
    }

    // Incidents
    const incWrap = document.getElementById('status-incidents');
    const incList = document.getElementById('status-incidents-list');
    incList.innerHTML = '';
    if (result.ok && Array.isArray(result.data.incidents) && result.data.incidents.length) {
      incWrap.classList.remove('hidden');
      result.data.incidents.forEach((inc) => {
        const li = document.createElement('li');
        li.className = 'border-l-2 border-warn-500/40 pl-2';
        const upd = (inc.incident_updates && inc.incident_updates[0]) || {};
        li.innerHTML = '<div class="font-semibold">' + inc.name + '</div>'
          + (upd.body ? '<div class="text-slate-400 text-xs mt-0.5">' + upd.body + '</div>' : '');
        incList.appendChild(li);
      });
    } else {
      incWrap.classList.add('hidden');
    }
  }

  // ---- Live filter ---------------------------------------------
  function bindFilter() {
    const input = document.getElementById('status-filter');
    if (!input) return;
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let any = false;
      document.querySelectorAll('#status-grid [data-service-id]').forEach((el) => {
        const id = el.dataset.serviceId;
        const svc = SERVICES.find((s) => s.id === id);
        if (!svc) return;
        const hit = !q || svc.name.toLowerCase().includes(q) || svc.id.toLowerCase().includes(q);
        el.style.display = hit ? '' : 'none';
        if (hit) any = true;
      });
      const empty = document.getElementById('status-empty');
      if (empty) empty.classList.toggle('hidden', any);
    });
  }

  // ---- Boot -----------------------------------------------------
  async function boot() {
    const grid = document.getElementById('status-grid');
    if (!grid) return;
    // Skeleton cards first (so layout doesn't jump when real data arrives)
    SERVICES.forEach((svc) => {
      const sk = document.createElement('div');
      sk.className = 'card p-3 flex items-center gap-3';
      sk.dataset.serviceId = svc.id;
      sk.innerHTML = '<div class="text-2xl shrink-0">' + svc.icon + '</div>'
        + '<div class="flex-1 min-w-0">'
        +   '<div class="font-semibold truncate">' + svc.name + '</div>'
        +   '<div class="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">'
        +     '<span class="status-dot status-dot--unknown"></span>'
        +     '<span>…</span>'
        +   '</div>'
        + '</div>';
      grid.appendChild(sk);
    });

    // Fetch all in parallel
    const results = await Promise.all(SERVICES.map((svc) => fetchOne(svc, { timeoutMs: 8000 })));

    // Replace skeletons with real cards
    grid.innerHTML = '';
    results.forEach((res) => grid.appendChild(renderCard(res.service, res)));
    bindFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
