/* ================================================================
 * SiteTrace — DNS Lookup
 * DNS-over-HTTPS via Google / Cloudflare. Returns the raw answer
 * records and which resolver answered. Supports an "ALL" mode that
 * queries every record type in parallel and renders a grouped view.
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

  // Record types to query when the user picks "All"
  const ALL_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'];

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

  async function resolveOne(domain, type) {
    // Try providers in order, return first one that gives a usable response.
    // NXDOMAIN (Status != 0) is treated as a final answer for the "All" view too.
    let lastErr = null;
    for (const p of PROVIDERS) {
      try {
        const data = await resolveWith(p, domain, type);
        if (data && (data.Answer || typeof data.Status !== 'undefined')) {
          return { provider: p.name, data: data };
        }
      } catch (e) {
        lastErr = e;
      }
    }
    return { provider: PROVIDERS[0].name, data: null, error: lastErr && lastErr.message };
  }

  async function resolveAllTypes(domain) {
    // Fire all record types in parallel (with the same Google/Cloudflare fallback)
    const entries = await Promise.all(ALL_TYPES.map(async (type) => {
      const r = await resolveOne(domain, type);
      return { type, ...r };
    }));
    return entries;
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

  function humanType(t) {
    // DNS numeric types to labels
    const map = { 1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 15: 'MX', 16: 'TXT', 28: 'AAAA', 33: 'SRV', 35: 'NAPTR', 41: 'OPT', 65: 'HTTPS' };
    return map[t] || String(t);
  }

  function renderSingleResult(domain, type, provider, data) {
    const card = $('#dns-result-card');
    showEmpty(false);
    if (!card) return;
    card.classList.remove('hidden');

    setText('dns-target', domain + '  ·  ' + type);
    setText('dns-resolver', provider);

    const list = $('#dns-answers');
    if (list) list.innerHTML = '';

    if (!data || !data.Answer || !data.Answer.length) {
      const li = document.createElement('li');
      li.className = 'dns-answer';
      li.innerHTML = '<span class="dns-answer__type">' + (type || '') + '</span><span style="color:#94a3b8">' + t_('dns_no_records') + '</span>';
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

  function renderAllResult(domain, entries) {
    const card = $('#dns-result-card');
    showEmpty(false);
    if (!card) return;
    card.classList.remove('hidden');

    // Surface the most common provider (where the first successful answer came from)
    const provider = (entries.find((e) => e.data && e.data.Answer && e.data.Answer.length) || {}).provider
      || entries[0].provider
      || 'Google';

    setText('dns-target', domain + '  ·  ' + t_('dns_all_records'));
    setText('dns-resolver', provider);

    const list = $('#dns-answers');
    if (list) list.innerHTML = '';

    let totalAnswers = 0;
    let minTTL = null;
    const groups = entries.map((e) => {
      const answers = (e.data && e.data.Answer) || [];
      totalAnswers += answers.length;
      answers.forEach((ans) => {
        if (typeof ans.TTL === 'number' && (minTTL == null || ans.TTL < minTTL)) minTTL = ans.TTL;
      });
      return { type: e.type, answers };
    });

    if (totalAnswers === 0) {
      const li = document.createElement('li');
      li.className = 'dns-answer';
      li.style.color = '#94a3b8';
      li.textContent = t_('dns_no_records');
      list.appendChild(li);
      setText('dns-ttl', '—');
      return;
    }

    groups.forEach((g) => {
      if (!g.answers.length) return;
      // Section header for the record type
      const head = document.createElement('li');
      head.className = 'dns-answer-group-head';
      head.textContent = g.type + '  ·  ' + g.answers.length;
      list.appendChild(head);
      g.answers.forEach((ans) => {
        const li = document.createElement('li');
        li.className = 'dns-answer';
        const typeSpan = document.createElement('span');
        typeSpan.className = 'dns-answer__type';
        typeSpan.textContent = g.type;
        const dataSpan = document.createElement('span');
        dataSpan.textContent = ans.data;
        li.appendChild(typeSpan);
        li.appendChild(dataSpan);
        list.appendChild(li);
      });
    });

    setText('dns-ttl', minTTL == null ? '—' : (minTTL + 's'));
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
        setTimeout(() => { if (submit.disabled) { submit.disabled = false; submit.innerHTML = orig; } }, 50);
        submit.dataset.orig = submit.dataset.orig || orig;
      }
      try {
        if (type === 'ALL') {
          const entries = await resolveAllTypes(domain);
          renderAllResult(domain, entries);
        } else {
          // Use the first provider that returns a meaningful response (back-compat)
          let provider = null, data = null;
          for (const p of PROVIDERS) {
            try {
              const r = await resolveWith(p, domain, type);
              if (r && (r.Answer || typeof r.Status !== 'undefined')) {
                provider = p.name;
                data = r;
                break;
              }
            } catch (_) { /* try next */ }
          }
          if (!data) {
            showError(t_('dns_error'));
          } else {
            renderSingleResult(domain, type, provider, data);
          }
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
        // Also re-translate the "All records" option
        const allOpt = typeSel && typeSel.querySelector('option[value="ALL"]');
        if (allOpt) allOpt.textContent = t_('dns_type_all');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
