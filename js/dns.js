/* ================================================================
 * SiteTrace — DNS Lookup
 * DNS-over-HTTPS via Google / Cloudflare. Returns the raw answer
 * records and which resolver answered.
 * ================================================================ */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function t_(key) { return (window.I18N && window.I18N.t) ? window.I18N.t(key) : key; }

  // ---- Domain validation ----------------------------------------
  function isValidDomain(input) {
    if (!input) return false;
    const s = String(input).trim().toLowerCase();
    // Strip protocol if present
    const cleaned = s.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (cleaned.length < 3 || cleaned.length > 253) return false;
    return /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(cleaned);
  }
  function cleanDomain(input) {
    return String(input || '').trim().toLowerCase()
      .replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }

  // ---- Providers ------------------------------------------------
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

  async function resolveWith(p, domain, type) {
    const opts = { cache: 'no-store' };
    if (p.headers) opts.headers = p.headers;
    return withTimeout(
      fetch(p.url(domain, type), opts).then((r) => {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      }),
      7000
    );
  }

  async function resolveAll(domain, type) {
    let lastErr = null;
    for (const p of PROVIDERS) {
      try {
        const data = await resolveWith(p, domain, type);
        if (data && (data.Answer || data.Status === 0)) {
          return { provider: p.name, data: data };
        }
        if (data && typeof data.Status !== 'undefined' && data.Status !== 0) {
          // NXDOMAIN etc. — treat as final, no need to try the other
          return { provider: p.name, data: data, nxdomain: true };
        }
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('all providers failed');
  }

  // ---- Rendering ------------------------------------------------
  function showEmpty(show) {
    const empty = $('#dns-empty');
    if (empty) empty.classList.toggle('hidden', !show);
  }

  function showError(msg) {
    const card = $('#dns-result-card');
    showEmpty(false);
    if (!card) return;
    card.classList.remove('hidden');
    setText('dns-target', '');
    setText('dns-resolver', t_('dns_error'));
    setText('dns-ttl', '—');
    const list = $('#dns-answers');
    if (list) {
      list.innerHTML = '';
      const li = document.createElement('li');
      li.className = 'dns-answer';
      li.style.color = '#fca5a5';
      li.textContent = msg || t_('dns_error');
      list.appendChild(li);
    }
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = value == null ? '—' : value;
  }

  function renderResult(domain, type, provider, data) {
    const card = $('#dns-result-card');
    showEmpty(false);
    if (!card) return;
    card.classList.remove('hidden');

    setText('dns-target', domain);
    setText('dns-resolver', provider);

    const list = $('#dns-answers');
    if (list) list.innerHTML = '';

    if (!data || !data.Answer || !data.Answer.length) {
      // No records but query ok
      const li = document.createElement('li');
      li.className = 'dns-answer';
      li.innerHTML = '<span class="dns-answer__type">' + (type || '') + '</span><span>—</span>';
      list.appendChild(li);
      setText('dns-ttl', '—');
      return;
    }

    let minTTL = null;
    data.Answer.forEach((ans) => {
      const recType = humanType(ans.type);
      const li = document.createElement('li');
      li.className = 'dns-answer';
      const typeSpan = document.createElement('span');
      typeSpan.className = 'dns-answer__type';
      typeSpan.textContent = recType;
      const dataSpan = document.createElement('span');
      dataSpan.textContent = ans.data;
      li.appendChild(typeSpan);
      li.appendChild(dataSpan);
      list.appendChild(li);
      if (typeof ans.TTL === 'number') {
        if (minTTL == null || ans.TTL < minTTL) minTTL = ans.TTL;
      }
    });
    setText('dns-ttl', minTTL == null ? '—' : (minTTL + 's'));
  }

  function humanType(t) {
    // DNS numeric types to labels
    const map = { 1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 15: 'MX', 16: 'TXT', 28: 'AAAA', 33: 'SRV', 35: 'NAPTR', 41: 'OPT', 65: 'HTTPS' };
    return map[t] || String(t);
  }

  // ---- Wire up --------------------------------------------------
  function boot() {
    const form = $('#dns-form');
    if (!form) return;
    const input = $('#dns-input');
    const typeSel = $('#dns-type');
    const submit = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw = input.value;
      const domain = cleanDomain(raw);
      const type = (typeSel && typeSel.value) || 'A';
      if (!isValidDomain(domain)) {
        showError(t_('dns_error'));
        return;
      }
      // Loading state
      if (submit) {
        submit.disabled = true;
        const orig = submit.innerHTML;
        submit.innerHTML = '<span>' + t_('dns_querying') + '</span>';
        // restore on next tick in case of error
        setTimeout(() => { if (submit.disabled) { submit.disabled = false; submit.innerHTML = orig; } }, 50);
        // Save the original so we can restore after each submit
        submit.dataset.orig = submit.dataset.orig || orig;
      }
      try {
        const { provider, data, nxdomain } = await resolveAll(domain, type);
        if (nxdomain) {
          renderResult(domain, type, provider, { Answer: [] });
        } else {
          renderResult(domain, type, provider, data);
        }
      } catch (err) {
        showError(err && err.message);
      } finally {
        if (submit) {
          submit.disabled = false;
          if (submit.dataset.orig) submit.innerHTML = submit.dataset.orig;
        }
      }
    });

    // Re-apply translations to dynamic bits when language changes
    if (window.I18N) {
      window.I18N.onChange(() => {
        const empty = $('#dns-empty');
        if (empty && !empty.classList.contains('hidden')) empty.textContent = t_('dns_empty');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
