/* ================================================================
 * SiteTrace — Ping / Latency Test
 * Browser-friendly latency probe. Uses fetch timing against
 * small, CORS-enabled endpoints. Tracks per-server stats.
 * ================================================================ */
(function () {
  'use strict';

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // ---- Server list (CORS-friendly endpoints) ---------------------
  const SERVERS = [
    { id: 'cloudflare', name: 'Cloudflare',  url: 'https://www.cloudflare.com/cdn-cgi/trace', region: 'global' },
    { id: 'google',     name: 'Google',      url: 'https://www.google.com/generate_204',      region: 'global' },
    { id: 'github',     name: 'GitHub',      url: 'https://api.github.com',                   region: 'us' },
    { id: 'wikipedia',  name: 'Wikipedia',   url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Main_Page', region: 'global' },
    { id: 'mozilla',    name: 'Mozilla',     url: 'https://www.mozilla.org',                  region: 'us' },
    { id: 'duck',       name: 'DuckDuckGo',  url: 'https://duckduckgo.com',                   region: 'us' },
    { id: 'amazon',     name: 'Amazon',      url: 'https://www.amazon.com',                   region: 'global' },
    { id: 'msft',       name: 'Microsoft',   url: 'https://www.microsoft.com',                region: 'global' },
    { id: 'apple',      name: 'Apple',       url: 'https://www.apple.com',                    region: 'us' },
  ];

  // ---- State -----------------------------------------------------
  // For each server: { samples: [], last: number|null, errorCount: number }
  const state = {};
  let timer = null;
  let running = false;
  let interval = 3000;

  // ---- Helpers ---------------------------------------------------
  function t_(key) { return (window.I18N && window.I18N.t) ? window.I18N.t(key) : key; }

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
    return Math.round(ms) + ' ms';
  }

  function shortHost(url) {
    try { return new URL(url).host; } catch (_) { return url; }
  }

  function pingOne(server) {
    const start = performance.now();
    // cache:'no-store' to avoid cached responses skewing the result
    return fetch(server.url, {
      method: 'GET',
      cache: 'no-store',
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow',
    })
      .then(() => {
        const ms = performance.now() - start;
        return { ok: true, ms };
      })
      .catch((err) => {
        // Fallback: try no-cors so we still get timing
        return fetch(server.url, { method: 'GET', cache: 'no-store', mode: 'no-cors', credentials: 'omit' })
          .then(() => ({ ok: true, ms: performance.now() - start, opaque: true }))
          .catch(() => ({ ok: false, ms: -1, error: err && err.message }));
      });
  }

  // ---- UI rendering ---------------------------------------------
  function buildGrid() {
    const grid = $('#ping-grid');
    if (!grid) return;
    grid.innerHTML = '';
    SERVERS.forEach((s) => {
      const row = document.createElement('div');
      row.className = 'ping-row';
      row.id = 'ping-row-' + s.id;
      row.innerHTML =
        '<div class="ping-row__head">' +
          '<div>' +
            '<div class="ping-row__name">' + s.name + '</div>' +
            '<div class="ping-row__url">' + shortHost(s.url) + '</div>' +
          '</div>' +
          '<div class="ping-row__lat ping-lat--idle" data-lat>—</div>' +
        '</div>' +
        '<div class="ping-row__bar"><span data-bar></span></div>' +
        '<div class="ping-row__foot">' +
          '<span data-status>' + t_('ping_idle') + '</span>' +
          '<span data-stats>— / — / — · ' + t_('ping_jitter') + ' —</span>' +
        '</div>';
      grid.appendChild(row);
      state[s.id] = { samples: [], last: null, errors: 0 };
    });
  }

  function updateRow(server, s) {
    const row = $('#ping-row-' + server.id);
    if (!row) return;
    const latEl = row.querySelector('[data-lat]');
    const barEl = row.querySelector('[data-bar]');
    const stEl  = row.querySelector('[data-status]');
    const st2El = row.querySelector('[data-stats]');

    const rec = state[server.id];
    const cls = s.ok ? classifyLatency(s.ms) : 'err';
    const msText = s.ok ? fmtMs(s.ms) : t_('ping_offline');

    latEl.textContent = msText;
    latEl.className = 'ping-row__lat ping-lat--' + cls;

    if (s.ok) {
      // Bar: cap at 500ms -> 100%
      const pct = Math.max(2, Math.min(100, (s.ms / 500) * 100));
      barEl.style.width = pct + '%';
      barEl.className = 'ping-bar--' + classifyLatency(s.ms);
      stEl.textContent = t_('ping_running');
    } else {
      barEl.style.width = '0%';
      barEl.className = '';
      stEl.textContent = t_('ping_offline');
    }

    if (rec.samples.length) {
      const xs = rec.samples.slice();
      const min = Math.min(...xs);
      const max = Math.max(...xs);
      const avg = xs.reduce((a, b) => a + b, 0) / xs.length;
      // Jitter: mean abs deviation
      const jitter = xs.reduce((a, b) => a + Math.abs(b - avg), 0) / xs.length;
      st2El.textContent = Math.round(avg) + ' / ' + Math.round(min) + ' / ' + Math.round(max) + ' ms · ' + t_('ping_jitter') + ' ' + Math.round(jitter) + ' ms';
    } else {
      st2El.textContent = '— / — / — · ' + t_('ping_jitter') + ' —';
    }
  }

  async function tick() {
    // Probe all servers in parallel
    await Promise.all(SERVERS.map(async (s) => {
      const rec = state[s.id];
      try {
        const r = await pingOne(s);
        if (r.ok) {
          rec.last = r.ms;
          rec.samples.push(r.ms);
          if (rec.samples.length > 30) rec.samples.shift();
          rec.errors = 0;
        } else {
          rec.last = null;
          rec.errors += 1;
        }
        updateRow(s, r);
      } catch (e) {
        rec.errors += 1;
        updateRow(s, { ok: false });
      }
    }));
  }

  // ---- Start / stop ---------------------------------------------
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

  // ---- Boot ------------------------------------------------------
  function boot() {
    const grid = $('#ping-grid');
    if (!grid) return; // Ping view not present (shouldn't happen)
    buildGrid();

    const toggle = $('#ping-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => setRunning(!running));
    }
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
