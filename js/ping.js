/* ================================================================
 * SiteTrace — Domain Inspector
 *
 * Two things on the /ping/ page:
 *   1. URL inspector (default): type a hostname, get its resolved
 *      IPs, HTTP reachability, and round-trip latency in one shot.
 *      (DNS record details live on /dns-tools/ — that page is the
 *      dedicated home for that data.)
 *   2. Live multi-server ping (below): a user-configurable list of
 *      URLs to monitor. Each user manages their own list via
 *      sessionStorage, polling only happens when Start is pressed,
 *      and only the user's own browser makes the requests — we do
 *      not centralise the load on any third party.
 * ================================================================ */
(function () {
  'use strict';

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function t_(key) { return (window.I18N && window.I18N.t) ? window.I18N.t(key) : key; }

  // ----------------------------------------------------------------
  // URL inspector (DNS-over-HTTPS for IP lookup, then HTTP fetch)
  // ----------------------------------------------------------------
  const PROVIDERS = [
    {
      name: 'Google',
      url: (d, t) => 'https://dns.google/resolve?name=' + encodeURIComponent(d) + '&type=' + encodeURIComponent(t),
      parse: (j) => j,
    },
    {
      name: 'Cloudflare',
      url: (d, t) => 'https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(d) + '&type=' + encodeURIComponent(t),
      headers: { 'Accept': 'application/dns-json' },
      parse: (j) => j,
    },
  ];

  function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), ms);
      promise.then(
        (v) => { clearTimeout(t); resolve(v); },
        (e) => { clearTimeout(t); reject(e); }
      );
    });
  }

  function cleanHost(input) {
    return String(input || '').trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '');
  }

  function isValidHost(input) {
    if (!input) return false;
    const s = cleanHost(input);
    if (s.length < 3 || s.length > 253) return false;
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) return s.split('.').every((p) => +p <= 255);
    if (s.includes(':') && /^[0-9a-f:]+$/.test(s)) return true;
    return /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(s);
  }

  async function dnsLookup(host, type) {
    let lastErr = null;
    for (const p of PROVIDERS) {
      try {
        const opts = { cache: 'no-store' };
        if (p.headers) opts.headers = p.headers;
        const j = await withTimeout(
          fetch(p.url(host, type), opts).then((r) => {
            if (!r.ok) throw new Error('http ' + r.status);
            return r.json();
          }),
          6000
        );
        if (j && (j.Answer || typeof j.Status !== 'undefined')) {
          return j;
        }
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('all providers failed');
  }

  // Try a real CORS fetch first; fall back to no-cors to still detect
  // reachability even when the response is unreadable.
  async function httpProbe(url) {
    const start = performance.now();
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 8000);
      const resp = await fetch(url, {
        method: 'GET', cache: 'no-store', mode: 'cors',
        credentials: 'omit', redirect: 'follow', signal: ctrl.signal,
      });
      clearTimeout(tid);
      return {
        reachable: true, readable: true,
        status: resp.status, protocol: url.startsWith('https') ? 'HTTPS' : 'HTTP',
        ms: Math.round(performance.now() - start),
      };
    } catch (_) {
      try {
        const ctrl2 = new AbortController();
        const tid2 = setTimeout(() => ctrl2.abort(), 8000);
        await fetch(url, { method: 'GET', cache: 'no-store', mode: 'no-cors', credentials: 'omit', redirect: 'follow', signal: ctrl2.signal });
        clearTimeout(tid2);
        return {
          reachable: true, readable: false,
          protocol: url.startsWith('https') ? 'HTTPS' : 'HTTP',
          ms: Math.round(performance.now() - start),
        };
      } catch (e2) {
        return {
          reachable: false, readable: false,
          protocol: url.startsWith('https') ? 'HTTPS' : 'HTTP',
          ms: Math.round(performance.now() - start), error: e2.message,
        };
      }
    }
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = (value == null || value === '') ? '—' : value;
  }

  function renderInspector(target, host, ips, http) {
    const card = $('#ping-result-card');
    const empty = $('#ping-empty');
    if (empty) empty.classList.add('hidden');
    if (!card) return;
    card.classList.remove('hidden');

    setText('ping-target', target);
    setText('ping-host', host);

    // IPs
    const ipsUl = $('#ping-ips');
    if (ipsUl) {
      ipsUl.innerHTML = '';
      if (!ips.length) {
        const li = document.createElement('li');
        li.className = 'text-slate-500 text-xs';
        li.textContent = '—';
        ipsUl.appendChild(li);
      } else {
        ips.forEach((ip) => {
          const li = document.createElement('li');
          li.className = 'text-slate-200';
          li.textContent = ip;
          ipsUl.appendChild(li);
        });
      }
    }

    setText('ping-proto', http.protocol);
    setText('ping-ms', String(http.ms));
    let statusTxt;
    if (http.reachable && http.readable) {
      statusTxt = String(http.status);
    } else if (http.reachable) {
      statusTxt = t_('ping_status_reachable_cors');
    } else {
      statusTxt = t_('ping_unreachable');
    }
    setText('ping-status', statusTxt);

    // Pill
    const pill = $('#ping-reach-pill');
    const lbl  = $('#ping-pill-label');
    if (pill && lbl) {
      pill.classList.remove('ping-reach-pill--up', 'ping-reach-pill--down', 'ping-reach-pill--unknown');
      if (http.reachable && http.readable) {
        pill.classList.add('ping-reach-pill--up');
        lbl.textContent = t_('ping_reachable');
      } else if (http.reachable) {
        pill.classList.add('ping-reach-pill--unknown');
        lbl.textContent = t_('ping_reachable') + ' (CORS)';
      } else {
        pill.classList.add('ping-reach-pill--down');
        lbl.textContent = t_('ping_unreachable');
      }
    }

    const open = $('#ping-open');
    if (open) open.href = target.includes('://') ? target : 'https://' + host;
  }

  async function runInspector(inputValue) {
    const target = String(inputValue || '').trim();
    const host = cleanHost(target);
    if (!isValidHost(host)) {
      // Show error state
      const card = $('#ping-result-card');
      const empty = $('#ping-empty');
      if (empty) empty.classList.add('hidden');
      if (card) {
        card.classList.remove('hidden');
        setText('ping-target', target || '—');
        setText('ping-host', '—');
        setText('ping-proto', '—');
        setText('ping-status', t_('dns_error'));
        setText('ping-ms', '—');
        const pill = $('#ping-reach-pill');
        const lbl  = $('#ping-pill-label');
        if (pill && lbl) {
          pill.classList.remove('ping-reach-pill--up', 'ping-reach-pill--down', 'ping-reach-pill--unknown');
          pill.classList.add('ping-reach-pill--down');
          lbl.textContent = t_('dns_error');
        }
      }
      return;
    }

    const submit = document.querySelector('#ping-form button[type="submit"]');
    const orig = submit ? submit.innerHTML : '';
    if (submit) { submit.disabled = true; submit.innerHTML = '<span>…</span>'; }

    try {
      // Resolve A + AAAA in parallel for the IP list, then probe HTTP
      const [a, aaaa, http] = await Promise.all([
        dnsLookup(host, 'A').catch(() => null),
        dnsLookup(host, 'AAAA').catch(() => null),
        httpProbe('https://' + host + '/'),
      ]);
      const ips = [];
      if (a   && a.Answer)   a.Answer.forEach((r) => ips.push(r.data));
      if (aaaa && aaaa.Answer) aaaa.Answer.forEach((r) => ips.push(r.data));
      renderInspector(target.includes('://') ? target : host, host, ips, http);
    } finally {
      if (submit) { submit.disabled = false; submit.innerHTML = orig; }
    }
  }

  // ----------------------------------------------------------------
  // Live multi-server ping (user-configurable)
  // ----------------------------------------------------------------
  const DEFAULT_SERVERS = [
    { id: 'cloudflare', name: 'Cloudflare',  url: 'https://www.cloudflare.com/cdn-cgi/trace',  region: 'global' },
    { id: 'google',     name: 'Google',      url: 'https://www.google.com/generate_204',       region: 'global' },
    { id: 'github',     name: 'GitHub',      url: 'https://api.github.com',                    region: 'us' },
    { id: 'wikipedia',  name: 'Wikipedia',   url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Main_Page', region: 'global' },
    { id: 'mozilla',    name: 'Mozilla',     url: 'https://www.mozilla.org',                   region: 'us' },
    { id: 'duck',       name: 'DuckDuckGo',  url: 'https://duckduckgo.com',                    region: 'us' },
    { id: 'amazon',     name: 'Amazon',      url: 'https://www.amazon.com',                    region: 'global' },
    { id: 'msft',       name: 'Microsoft',   url: 'https://www.microsoft.com',                 region: 'global' },
    { id: 'apple',      name: 'Apple',       url: 'https://www.apple.com',                     region: 'us' },
  ];

  const STORE_KEY = 'sitetrace.ping.servers.v1';
  const state = {}; // id -> { samples: [], last: null, errors: 0 }
  let servers = []; // [{ id, name, url }]
  let timer = null;
  let running = false;
  let interval = 3000;

  function classifyLatency(ms) {
    if (ms == null) return 'idle';
    if (ms < 0) return 'err';
    if (ms < 100) return 'ok';
    if (ms < 250) return 'med';
    return 'high';
  }
  function fmtMs(ms) {
    if (ms == null) return '—';
    if (ms < 0) return t_('ping_offline');
    return Math.round(ms) + ' ' + t_('ping_ms_label');
  }
  function shortHost(url) {
    try { return new URL(url).host; } catch (_) { return url; }
  }

  function loadServers() {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (_) {}
    return DEFAULT_SERVERS.slice();
  }
  function saveServers() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(servers)); } catch (_) {}
  }

  function pingOne(server) {
    const start = performance.now();
    return fetch(server.url, { method: 'GET', cache: 'no-store', mode: 'cors', credentials: 'omit', redirect: 'follow' })
      .then(() => ({ ok: true, ms: performance.now() - start }))
      .catch(() =>
        fetch(server.url, { method: 'GET', cache: 'no-store', mode: 'no-cors', credentials: 'omit' })
          .then(() => ({ ok: true, ms: performance.now() - start, opaque: true }))
          .catch(() => ({ ok: false, ms: -1 }))
      );
  }

  function buildGrid() {
    const grid = $('#ping-grid');
    if (!grid) return;
    grid.innerHTML = '';
    servers.forEach((s) => {
      const row = document.createElement('div');
      row.className = 'ping-server-row';
      row.dataset.id = s.id;
      row.innerHTML =
        '<div class="min-w-0 flex-1">' +
          '<div class="ping-server-row__name">' + escapeHtml(s.name) + '</div>' +
          '<div class="ping-server-row__url">' + escapeHtml(shortHost(s.url)) + '</div>' +
        '</div>' +
        '<div class="ping-server-row__lat ping-lat--idle" data-lat>—</div>' +
        '<button type="button" class="ping-server-row__remove" data-remove="' + escapeHtml(s.id) + '" title="' + escapeHtml(t_('ping_remove')) + '">' +
          '✕' +
        '</button>';
      grid.appendChild(row);
      state[s.id] = state[s.id] || { samples: [], last: null, errors: 0 };
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
  }

  function updateRow(server, s) {
    const row = document.querySelector('[data-id="' + server.id + '"]');
    if (!row) return;
    const latEl = row.querySelector('[data-lat]');
    const rec = state[server.id];
    const cls = s.ok ? classifyLatency(s.ms) : 'err';
    latEl.textContent = s.ok ? fmtMs(s.ms) : t_('ping_offline');
    latEl.className = 'ping-server-row__lat ping-lat--' + cls;
    if (s.ok) {
      rec.last = s.ms;
      rec.samples.push(s.ms);
      if (rec.samples.length > 30) rec.samples.shift();
      rec.errors = 0;
    } else {
      rec.last = null;
      rec.errors += 1;
    }
  }

  async function tick() {
    await Promise.all(servers.map(async (s) => {
      try {
        const r = await pingOne(s);
        updateRow(s, r);
      } catch (_) {
        updateRow(s, { ok: false });
      }
    }));
  }

  function setRunning(next) {
    running = next;
    const btn = $('#ping-toggle');
    const lbl = $('#ping-toggle-label');
    const stText = $('#ping-status-text');
    if (btn) btn.setAttribute('aria-pressed', running ? 'true' : 'false');
    if (lbl) lbl.textContent = running ? t_('ping_stop') : t_('ping_start');
    if (stText) stText.textContent = running ? t_('ping_running') : t_('ping_idle');
    if (running) {
      tick();
      timer = setInterval(tick, interval);
    } else {
      clearInterval(timer);
      timer = null;
    }
  }

  function addServer(name, url) {
    const u = (url || '').trim();
    if (!u) return false;
    let normalized = u;
    if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;
    try { new URL(normalized); } catch (_) { return false; }
    const id = 'user-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
    const displayName = (name || '').trim() || shortHost(normalized);
    servers.push({ id, name: displayName, url: normalized });
    saveServers();
    rebuildGrid();
    return true;
  }

  function removeServer(id) {
    const idx = servers.findIndex((s) => s.id === id);
    if (idx === -1) return;
    servers.splice(idx, 1);
    saveServers();
    rebuildGrid();
  }

  function rebuildGrid() {
    const grid = $('#ping-grid');
    if (!grid) return;
    // Remove old rows
    grid.innerHTML = '';
    buildGrid();
  }

  // ----------------------------------------------------------------
  // Boot
  // ----------------------------------------------------------------
  function boot() {
    // URL inspector form
    const form  = $('#ping-form');
    const input = $('#ping-input');
    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        runInspector(input.value);
      });
    }

    // Live multi-server ping
    const grid = $('#ping-grid');
    if (grid) {
      servers = loadServers();
      buildGrid();

      const toggle = $('#ping-toggle');
      if (toggle) toggle.addEventListener('click', () => setRunning(!running));

      const sel = $('#ping-interval');
      if (sel) {
        sel.addEventListener('change', () => {
          interval = Math.max(1000, parseInt(sel.value, 10) || 3000);
          if (running) {
            clearInterval(timer);
            timer = setInterval(tick, interval);
          }
        });
      }

      // Add-server form
      const addForm = $('#ping-add-form');
      if (addForm) {
        addForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const nameEl = $('#ping-add-name');
          const urlEl  = $('#ping-add-url');
          if (!urlEl) return;
          if (addServer(nameEl ? nameEl.value : '', urlEl.value)) {
            if (nameEl) nameEl.value = '';
            urlEl.value = '';
          }
        });
      }

      // Per-row remove
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove]');
        if (btn) removeServer(btn.getAttribute('data-remove'));
      });

      // Restore defaults
      const restore = $('#ping-restore-defaults');
      if (restore) {
        restore.addEventListener('click', () => {
          servers = DEFAULT_SERVERS.slice();
          saveServers();
          rebuildGrid();
        });
      }
    }

    // Re-translate when language changes
    if (window.I18N) {
      window.I18N.onChange(() => {
        const lbl = $('#ping-toggle-label');
        const stText = $('#ping-status-text');
        if (lbl) lbl.textContent = running ? t_('ping_stop') : t_('ping_start');
        if (stText) stText.textContent = running ? t_('ping_running') : t_('ping_idle');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
