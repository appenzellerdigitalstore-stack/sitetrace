/* ================================================================
 * SiteTrace — Domain Inspector
 *
 * Two modes on the /ping/ page:
 *   1. URL inspector (default): type a hostname, get DNS, IPs,
 *      HTTP reachability, and round-trip latency in one shot.
 *   2. Live multi-server ping (collapsed under <details>): the
 *      original 9-server latency probe, kept for power users.
 * ================================================================ */
(function () {
  'use strict';

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function t_(key) { return (window.I18N && window.I18N.t) ? window.I18N.t(key) : key; }

  // ----------------------------------------------------------------
  // URL inspector
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
    // Accept "github.com", "https://github.com/foo", "github.com:443", etc.
    return String(input || '').trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '');
  }

  function isValidHost(input) {
    if (!input) return false;
    const s = cleanHost(input);
    if (s.length < 3 || s.length > 253) return false;
    // Allow IPv4 / IPv6 literals too
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) return s.split('.').every((p) => +p <= 255);
    if (s.includes(':') && /^[0-9a-f:]+$/.test(s)) return true; // IPv6
    return /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(s);
  }

  async function dnsResolveOne(p, host, type) {
    const opts = { cache: 'no-store' };
    if (p.headers) opts.headers = p.headers;
    return withTimeout(
      fetch(p.url(host, type), opts).then((r) => {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      }),
      6000
    );
  }

  async function dnsLookup(host, type) {
    let lastErr = null;
    for (const p of PROVIDERS) {
      try {
        const j = await dnsResolveOne(p, host, type);
        if (j && (j.Answer || typeof j.Status !== 'undefined')) {
          return { provider: p.name, data: j };
        }
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('all providers failed');
  }

  // Run a real HTTP fetch (CORS-enabled endpoints) so we can read the response.
  // Fall back to no-cors to at least detect reachability.
  async function httpProbe(url) {
    const start = performance.now();
    // Attempt 1: real fetch (works only when CORS allows)
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 8000);
      const resp = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow',
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      const ms = Math.round(performance.now() - start);
      return {
        reachable: resp.ok || (resp.status >= 200 && resp.status < 500),
        status: resp.status,
        protocol: url.startsWith('https') ? 'HTTPS' : 'HTTP',
        ms,
        readable: true,
        contentType: resp.headers.get('content-type') || '',
        server: resp.headers.get('server') || '',
      };
    } catch (e1) {
      // Attempt 2: no-cors (opaque but tells us reachability)
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 8000);
        await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          mode: 'no-cors',
          credentials: 'omit',
          redirect: 'follow',
          signal: ctrl.signal,
        });
        clearTimeout(tid);
        const ms = Math.round(performance.now() - start);
        return {
          reachable: true,
          protocol: url.startsWith('https') ? 'HTTPS' : 'HTTP',
          ms,
          readable: false, // CORS blocked reading the response
        };
      } catch (e2) {
        return {
          reachable: false,
          protocol: url.startsWith('https') ? 'HTTPS' : 'HTTP',
          ms: Math.round(performance.now() - start),
          readable: false,
          error: e2.message || e1.message,
        };
      }
    }
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = value == null || value === '' ? '—' : value;
  }

  function renderInspector(target, host, dnsResults, httpResult) {
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
      const aRecs = (dnsResults.A || []).map((r) => r.data);
      const aaaaRecs = (dnsResults.AAAA || []).map((r) => r.data);
      const allIps = aRecs.concat(aaaaRecs);
      if (allIps.length === 0) {
        const li = document.createElement('li');
        li.className = 'text-slate-500 text-xs';
        li.textContent = '—';
        ipsUl.appendChild(li);
      } else {
        allIps.forEach((ip) => {
          const li = document.createElement('li');
          li.className = 'text-slate-200';
          li.textContent = ip;
          ipsUl.appendChild(li);
        });
      }
    }

    // HTTP
    setText('ping-proto', httpResult.protocol);
    setText('ping-ms', String(httpResult.ms));
    let statusTxt;
    if (httpResult.reachable && httpResult.readable) {
      statusTxt = String(httpResult.status);
    } else if (httpResult.reachable) {
      statusTxt = 'reachable (CORS)';
    } else {
      statusTxt = 'unreachable';
    }
    setText('ping-status', statusTxt);

    // Pill
    const pill = $('#ping-reach-pill');
    const dot  = $('#ping-pill-dot');
    const lbl  = $('#ping-pill-label');
    if (pill && dot && lbl) {
      pill.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border';
      if (httpResult.reachable) {
        pill.classList.add('border-safe-500/40', 'text-safe-400', 'bg-safe-500/10');
        dot.style.background = '#10b981';
        lbl.textContent = t_('ping_reachable');
      } else {
        pill.classList.add('border-danger-500/40', 'text-danger-400', 'bg-danger-500/10');
        dot.style.background = '#ef4444';
        lbl.textContent = t_('ping_unreachable');
      }
    }

    // Open in new tab link
    const open = $('#ping-open');
    if (open) {
      const tryUrl = target.includes('://') ? target : 'https://' + host;
      open.href = tryUrl;
    }

    // DNS list
    const dnsUl = $('#ping-dns');
    if (dnsUl) {
      dnsUl.innerHTML = '';
      const groups = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'];
      let any = false;
      groups.forEach((type) => {
        const recs = dnsResults[type] || [];
        if (!recs.length) return;
        any = true;
        const head = document.createElement('li');
        head.className = 'dns-answer-group-head';
        head.textContent = type + '  ·  ' + recs.length;
        dnsUl.appendChild(head);
        recs.forEach((r) => {
          const li = document.createElement('li');
          li.className = 'dns-answer';
          const ts = document.createElement('span');
          ts.className = 'dns-answer__type';
          ts.textContent = type;
          const ds = document.createElement('span');
          ds.textContent = r.data;
          li.appendChild(ts); li.appendChild(ds);
          dnsUl.appendChild(li);
        });
      });
      if (!any) {
        const li = document.createElement('li');
        li.className = 'text-slate-500 text-xs';
        li.textContent = t_('dns_no_records');
        dnsUl.appendChild(li);
      }
    }
  }

  async function runInspector(inputValue) {
    const target = String(inputValue || '').trim();
    const host = cleanHost(target);
    if (!isValidHost(host)) {
      // Show error
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
        if (pill) {
          pill.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-warn-500/40 text-warn-400 bg-warn-500/10';
          $('#ping-pill-label').textContent = t_('dns_error');
          const dot = $('#ping-pill-dot'); if (dot) dot.style.background = '#f59e0b';
        }
      }
      return;
    }

    // Loading state
    const submit = document.querySelector('#ping-form button[type="submit"]');
    const orig = submit ? submit.innerHTML : '';
    if (submit) {
      submit.disabled = true;
      submit.innerHTML = '<span>' + t_('isitdown_checking') + '</span>';
    }

    try {
      // DNS in parallel for the most common types
      const [a, aaaa, mx, ns, txt, cname, soa, http] = await Promise.all([
        dnsLookup(host, 'A').catch(() => null),
        dnsLookup(host, 'AAAA').catch(() => null),
        dnsLookup(host, 'MX').catch(() => null),
        dnsLookup(host, 'NS').catch(() => null),
        dnsLookup(host, 'TXT').catch(() => null),
        dnsLookup(host, 'CNAME').catch(() => null),
        dnsLookup(host, 'SOA').catch(() => null),
        httpProbe('https://' + host + '/'),
      ]);
      const dnsResults = {
        A:     (a     && a.data && a.data.Answer)     || [],
        AAAA:  (aaaa  && aaaa.data && aaaa.data.Answer)  || [],
        MX:    (mx    && mx.data && mx.data.Answer)    || [],
        NS:    (ns    && ns.data && ns.data.Answer)    || [],
        TXT:   (txt   && txt.data && txt.data.Answer)   || [],
        CNAME: (cname && cname.data && cname.data.Answer) || [],
        SOA:   (soa   && soa.data && soa.data.Answer)   || [],
      };
      renderInspector(target.includes('://') ? target : host, host, dnsResults, http);
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.innerHTML = orig;
      }
    }
  }

  // ----------------------------------------------------------------
  // Live multi-server ping (the legacy 9-server probe, kept in a
  // collapsed <details> for power users).
  // ----------------------------------------------------------------
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

  const state = {};
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
    return Math.round(ms) + ' ms';
  }
  function shortHost(url) {
    try { return new URL(url).host; } catch (_) { return url; }
  }
  function pingOne(server) {
    const start = performance.now();
    return fetch(server.url, {
      method: 'GET',
      cache: 'no-store',
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow',
    })
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
      const jitter = xs.reduce((a, b) => a + Math.abs(b - avg), 0) / xs.length;
      st2El.textContent = Math.round(avg) + ' / ' + Math.round(min) + ' / ' + Math.round(max) + ' ms · ' + t_('ping_jitter') + ' ' + Math.round(jitter) + ' ms';
    } else {
      st2El.textContent = '— / — / — · ' + t_('ping_jitter') + ' —';
    }
  }
  async function tick() {
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

    // Live multi-server ping (only present if the <details> grid exists)
    const grid = $('#ping-grid');
    if (grid) {
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
