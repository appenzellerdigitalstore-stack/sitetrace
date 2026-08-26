/* ================================================================
 * SiteTrace — Main App
 * Routing, IP lookup (with fallbacks), geolocation, security
 * status detection, language switcher, copy-to-clipboard, toast.
 * ================================================================ */
(function () {
  'use strict';

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // ---- Utilities -------------------------------------------------
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c == null) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  function flagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    const codePoints = countryCode.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0));
    try { return String.fromCodePoint(...codePoints); } catch (_) { return ''; }
  }

  function showToast(text, ms) {
    const toast = $('#toast');
    const slot  = $('#toast-text');
    if (!toast || !slot) return;
    slot.textContent = text;
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.classList.add('opacity-0');
      toast.classList.remove('opacity-100');
    }, ms || 1800);
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (_) { return false; }
  }

  // ================================================================
  // Routing (hash-based, no server config needed)
  // ================================================================
  const VIEWS = ['home', 'ping', 'dns'];

  function setRoute(route) {
    if (!VIEWS.includes(route)) route = 'home';
    location.hash = '#/' + route;
  }
  function currentRoute() {
    const h = (location.hash || '').replace(/^#\/?/, '').trim();
    return VIEWS.includes(h) ? h : 'home';
  }
  function renderRoute() {
    const route = currentRoute();
    $$('[data-view]').forEach((node) => {
      node.classList.toggle('hidden', node.getAttribute('data-view') !== route);
    });
    $$('.nav-link[data-route]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-route') === route);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.addEventListener('hashchange', renderRoute);
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-route]');
    if (t) { e.preventDefault(); setRoute(t.getAttribute('data-route')); }
  });

  // ================================================================
  // IP / Network lookup
  // ================================================================
  // We try multiple free services in order. The first to succeed wins.
  const IP_PROVIDERS = [
    {
      name: 'ipwho.is',
      url: 'https://ipwho.is/',
      timeout: 7000,
      parse: (j) => {
        if (!j || j.success === false) return null;
        return {
          ip: j.ip,
          type: j.type,
          country: j.country,
          countryCode: j.country_code,
          region: j.region,
          city: j.city,
          postal: j.postal,
          latitude: j.latitude,
          longitude: j.longitude,
          isp: j.connection && j.connection.isp,
          org: j.connection && j.connection.org,
          asn: j.connection && j.connection.asn,
          timezone: j.timezone && (j.timezone.id || j.timezone.utc),
          currentTime: j.timezone && j.timezone.current_time,
          security: j.security || {},
        };
      },
    },
    {
      name: 'ip-api.com',
      url: 'https://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,query',
      timeout: 7000,
      parse: (j) => {
        if (!j || j.status !== 'success') return null;
        return {
          ip: j.query,
          type: 'IPv4',
          country: j.country,
          countryCode: j.countryCode,
          region: j.regionName,
          city: j.city,
          postal: j.zip,
          latitude: j.lat,
          longitude: j.lon,
          isp: j.isp,
          org: j.org,
          asn: (j.as || '').split(' ')[0],
          timezone: j.timezone,
          security: {
            is_proxy: !!j.proxy,
            is_vpn: !!j.hosting,
            is_tor: false,
            threat_level: (j.proxy || j.hosting) ? 'medium' : 'low',
          },
        };
      },
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

  async function fetchProvider(p) {
    return withTimeout(
      fetch(p.url, { cache: 'no-store', mode: 'cors' }).then((r) => {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      }).then((j) => {
        const data = p.parse(j);
        if (!data) throw new Error('parse: no data');
        return data;
      }),
      p.timeout
    );
  }

  async function lookupIP() {
    let lastErr = null;
    for (const p of IP_PROVIDERS) {
      try {
        const data = await fetchProvider(p);
        return Object.assign({ provider: p.name }, data);
      } catch (e) {
        lastErr = e;
        // continue to next provider
      }
    }
    throw lastErr || new Error('all providers failed');
  }

  // ================================================================
  // Render
  // ================================================================
  function setText(id, value) {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = (value == null || value === '') ? '—' : value;
  }
  function setHTML(id, html) {
    const node = document.getElementById(id);
    if (!node) return;
    node.innerHTML = html;
  }

  function renderStatus(security) {
    const badge  = $('#status-badge');
    const desc   = $('#status-desc');
    const mini   = $('#status-mini');
    if (!badge || !desc) return;

    const t = (window.I18N && window.I18N.t) || ((k) => k);

    // Reset classes
    badge.className = 'status-badge';

    let state = 'exposed';
    if (security && security.is_vpn) state = 'vpn';
    else if (security && security.is_proxy) state = 'proxy';
    else if (security && security.is_tor) state = 'tor';
    else if (security && (security.is_vpn || security.is_proxy || security.is_tor)) state = 'protected';

    switch (state) {
      case 'vpn':
        badge.classList.add('status-badge--vpn');
        badge.innerHTML = '<span class="status-dot"></span><span>' + t('status_vpn') + '</span>';
        desc.textContent = t('status_vpn_desc');
        break;
      case 'proxy':
        badge.classList.add('status-badge--proxy');
        badge.innerHTML = '<span class="status-dot"></span><span>' + t('status_proxy') + '</span>';
        desc.textContent = t('status_proxy_desc');
        break;
      case 'tor':
        badge.classList.add('status-badge--tor');
        badge.innerHTML = '<span class="status-dot"></span><span>' + t('status_tor') + '</span>';
        desc.textContent = t('status_tor_desc');
        break;
      case 'protected':
        badge.classList.add('status-badge--protected');
        badge.innerHTML = '<span class="status-dot"></span><span>' + t('status_protected') + '</span>';
        desc.textContent = t('status_protected_desc');
        break;
      default:
        badge.classList.add('status-badge--exposed');
        badge.innerHTML = '<span class="status-dot"></span><span>' + t('status_exposed') + '</span>';
        desc.textContent = t('status_exposed_desc');
    }
    if (mini) mini.textContent = badge.textContent;
  }

  function renderSecurityList(security) {
    const t = (window.I18N && window.I18N.t) || ((k) => k);
    const yn = (v) => v ? '<span class="pill-warn">' + t('value_yes') + '</span>'
                        : '<span class="pill-no">' + t('value_no') + '</span>';
    setHTML('sec-vpn',    security ? yn(!!security.is_vpn)    : '—');
    setHTML('sec-proxy',  security ? yn(!!security.is_proxy)  : '—');
    setHTML('sec-tor',    security ? yn(!!security.is_tor)    : '—');
    const tl = (security && security.threat_level) ? security.threat_level : 'low';
    const tlColor = tl === 'high' ? 'pill-warn' : (tl === 'medium' ? 'pill-warn' : 'pill-no');
    setHTML('sec-threat', '<span class="' + tlColor + '">' + tl + '</span>');
  }

  function renderIP(data) {
    if (!data) return;
    setText('ip-display', data.ip || '—');
    setText('ip-type', data.type ? data.type : '');

    const flag = flagEmoji(data.countryCode);
    const countryNode = $('#loc-country');
    if (countryNode) {
      countryNode.innerHTML = '';
      if (flag) countryNode.appendChild(document.createTextNode(flag + ' '));
      countryNode.appendChild(document.createTextNode(data.country || '—'));
    }

    setText('d-country', (flag ? flag + ' ' : '') + (data.country || '—'));
    setText('d-region',  data.region || '—');
    setText('d-city',    data.city || '—');
    setText('d-postal',  data.postal || '—');
    setText('d-coords',  (data.latitude != null && data.longitude != null)
      ? (Number(data.latitude).toFixed(4) + ', ' + Number(data.longitude).toFixed(4))
      : '—');
    setText('d-isp',     data.isp || '—');
    setText('d-org',     data.org || '—');
    setText('d-asn',     data.asn || '—');
    setText('d-timezone', data.timezone || '—');
    setText('d-type',    data.type || '—');
    setText('net-isp',   data.isp || '—');
    setText('loc-city',  data.city || '—');

    // Local time
    let timeText = '—', tzText = data.timezone || '—';
    if (data.currentTime) {
      try {
        const d = new Date(data.currentTime);
        if (!isNaN(d.getTime())) {
          timeText = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
      } catch (_) {}
    } else if (data.timezone) {
      try {
        timeText = new Date().toLocaleTimeString([], { timeZone: data.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } catch (_) {}
    }
    setText('local-time', timeText);
    setText('local-tz', tzText);

    renderStatus(data.security);
    renderSecurityList(data.security);
  }

  function clearPlaceholders() {
    // After a successful render, swap placeholder shimmer for plain text.
    $$('.ip-placeholder').forEach((p) => {
      const parent = p.parentNode;
      // Only clear if the parent hasn't been overwritten with real content
      if (p.parentElement && p.parentElement.contains(p)) {
        // Leave as-is — the per-field setters above will replace text content.
      }
    });
  }

  function showError(err) {
    const t = (window.I18N && window.I18N.t) || ((k) => k);
    const ip = $('#ip-display'); if (ip) ip.textContent = '—';
    const badge = $('#status-badge');
    if (badge) {
      badge.className = 'status-badge status-badge--exposed';
      badge.innerHTML = '<span class="status-dot"></span><span>' + t('err_network') + '</span>';
    }
    const desc = $('#status-desc');
    if (desc) desc.textContent = err && err.message ? err.message : '';
    const mini = $('#status-mini');
    if (mini) mini.textContent = t('err_network');
    setHTML('sec-vpn', '—'); setHTML('sec-proxy', '—'); setHTML('sec-tor', '—'); setHTML('sec-threat', '—');
    // Provide a retry button
    const recheck = $('#btn-recheck');
    if (recheck) {
      recheck.onclick = (e) => { e.preventDefault(); runLookup(); };
    }
  }

  async function runLookup() {
    const recheck = $('#btn-recheck');
    if (recheck) recheck.disabled = true;
    try {
      const data = await lookupIP();
      renderIP(data);
      clearPlaceholders();
    } catch (e) {
      showError(e);
    } finally {
      if (recheck) recheck.disabled = false;
    }
  }

  // ================================================================
  // Language switcher wiring
  // ================================================================
  function wireLanguage() {
    const wrap = $('#lang-wrap');
    const btn  = $('#lang-toggle');
    const menu = $('#lang-menu');
    if (!wrap || !btn || !menu) return;

    function setActive(lang) {
      $$('.lang-option', menu).forEach((o) => {
        o.classList.toggle('is-active', o.getAttribute('data-lang') === lang);
      });
      const cur = $('#lang-current');
      if (cur) cur.textContent = lang.toUpperCase();
    }

    function open(open) {
      menu.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      open(menu.classList.contains('hidden'));
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) open(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') open(false);
    });
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lang]');
      if (!b) return;
      const lang = b.getAttribute('data-lang');
      if (window.I18N) {
        window.I18N.setLanguage(lang);
        setActive(lang);
      }
      open(false);
    });

    // Footer language links (no dropdown, direct set)
    $$('.lang-link').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = b.getAttribute('data-lang');
        if (window.I18N) {
          window.I18N.setLanguage(lang);
          setActive(lang);
        }
      });
    });

    if (window.I18N) {
      setActive(window.I18N.getLanguage());
      window.I18N.onChange((lang) => {
        setActive(lang);
        // re-render status badge text in new language if data already present
        const cur = (window.SiteState && window.SiteState.lastData) || null;
        if (cur) { renderStatus(cur.security); renderSecurityList(cur.security); }
      });
    }
  }

  // ================================================================
  // Copy / re-check buttons
  // ================================================================
  function wireActions() {
    const copy = $('#btn-copy');
    if (copy) {
      copy.addEventListener('click', async (e) => {
        e.preventDefault();
        const text = ($('#ip-display') && $('#ip-display').textContent || '').trim();
        if (!text || text === '—') return;
        const ok = await copyToClipboard(text);
        const t = (window.I18N && window.I18N.t) || ((k) => k);
        if (ok) {
          const orig = copy.textContent;
          copy.textContent = t('cta_copied');
          setTimeout(() => { copy.textContent = t('cta_copy'); }, 1400);
        } else {
          showToast('Copy failed', 1500);
        }
      });
    }
    const recheck = $('#btn-recheck');
    if (recheck) {
      recheck.addEventListener('click', (e) => { e.preventDefault(); runLookup(); });
    }
  }

  // ================================================================
  // Live local-time ticking (uses cached data; falls back to browser TZ)
  // ================================================================
  function startLocalClock() {
    setInterval(() => {
      const node = $('#local-time');
      if (!node) return;
      const cached = (window.SiteState && window.SiteState.lastData) || null;
      try {
        let str;
        if (cached && cached.timezone) {
          str = new Date().toLocaleTimeString([], { timeZone: cached.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } else {
          str = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        if (str && node.textContent !== str) node.textContent = str;
      } catch (_) { /* ignore */ }
    }, 1000);
  }

  // ================================================================
  // Boot
  // ================================================================
  function boot() {
    // Footer year
    const y = $('#footer-year'); if (y) y.textContent = new Date().getFullYear();

    // State holder
    window.SiteState = { lastData: null };

    // Wrap renderIP to also cache data
    const _render = renderIP;
    // eslint-disable-next-line no-func-assign
    renderIP = function (data) {
      window.SiteState.lastData = data;
      _render(data);
    };

    wireLanguage();
    wireActions();
    renderRoute();
    runLookup();
    startLocalClock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
