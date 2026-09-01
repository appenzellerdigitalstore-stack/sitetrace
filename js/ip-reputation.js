// SiteTrace — IP reputation page logic
// Form submit (or "Use my IP") -> POST /api/ip-reputation -> render
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function t(key) {
    if (window.I18N && typeof window.I18N.t === 'function') return window.I18N.t(key);
    return key;
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function showToast(msg) {
    const el = $('toast');
    const txt = $('toast-text');
    if (!el || !txt) return;
    txt.textContent = msg;
    el.classList.remove('opacity-0');
    el.classList.add('opacity-100');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      el.classList.remove('opacity-100');
      el.classList.add('opacity-0');
    }, 1800);
  }

  // ---- view state helpers -----------------------------------------
  function showForm() {
    $('iprep-form-card').classList.remove('hidden');
    $('iprep-loading').classList.add('hidden');
    $('iprep-result').classList.add('hidden');
    $('iprep-error').classList.add('hidden');
  }
  function showLoading() {
    $('iprep-form-card').classList.add('hidden');
    $('iprep-loading').classList.remove('hidden');
    $('iprep-result').classList.add('hidden');
    $('iprep-error').classList.add('hidden');
  }
  function showError(key) {
    $('iprep-form-card').classList.add('hidden');
    $('iprep-loading').classList.add('hidden');
    $('iprep-result').classList.add('hidden');
    $('iprep-error').classList.remove('hidden');
    const errEl = $('iprep-error-msg');
    if (errEl) errEl.textContent = t(key || 'iprep_error');
    const retry = $('iprep-error-retry');
    if (retry) retry.addEventListener('click', showForm, { once: true });
  }

  // ---- render -----------------------------------------------------
  function renderResult(data) {
    $('iprep-form-card').classList.add('hidden');
    $('iprep-loading').classList.add('hidden');
    $('iprep-error').classList.add('hidden');
    $('iprep-result').classList.remove('hidden');

    // Score color
    let scoreClass = 'text-emerald-300';
    if (data.score < 50) scoreClass = 'text-red-300';
    else if (data.score < 80) scoreClass = 'text-amber-300';

    // Risk pill color
    let riskClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
    if (data.risk === 'medium') riskClass = 'bg-amber-500/15 text-amber-300 border-amber-500/20';
    else if (data.risk === 'high') riskClass = 'bg-red-500/15 text-red-300 border-red-500/20';
    else if (data.risk === 'unknown') riskClass = 'bg-slate-500/15 text-slate-300 border-slate-500/20';

    // Per-list rows
    const blRows = (data.dnsbl && data.dnsbl.results ? data.dnsbl.results : []).map(function (r) {
      let pill;
      if (r.listed === true) {
        const codeText = r.codes && r.codes.length ? ' (' + r.codes.join(', ') + ')' : '';
        pill = '<span class="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/20">' +
               escapeHtml(t('iprep_status_listed')) + escapeHtml(codeText) + '</span>';
      } else if (r.listed === false) {
        pill = '<span class="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">' +
               escapeHtml(t('iprep_status_clean')) + '</span>';
      } else {
        pill = '<span class="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/20">' +
               escapeHtml(t('iprep_status_error')) + '</span>';
      }
      return ''
        + '<div class="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-b-0">'
        + '  <div class="text-sm text-slate-200">' + escapeHtml(r.label) + '</div>'
        + '  ' + pill
        + '</div>';
    }).join('');

    // Geolocation
    let geoHtml;
    if (data.geo) {
      const country = (data.geo.country || '—') + (data.geo.countryCode ? ' (' + data.geo.countryCode + ')' : '');
      const city = (data.geo.city || '—') + (data.geo.regionName ? ', ' + data.geo.regionName : '');
      geoHtml =
        '<dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">'
        + '  <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('iprep_geo_country')) + '</dt><dd class="font-medium">' + escapeHtml(country) + '</dd></div>'
        + '  <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('iprep_geo_city')) + '</dt><dd class="font-medium">' + escapeHtml(city) + '</dd></div>'
        + '  <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('iprep_geo_isp')) + '</dt><dd class="font-medium truncate" title="' + escapeHtml(data.geo.isp || '') + '">' + escapeHtml(data.geo.isp || '—') + '</dd></div>'
        + '  <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('iprep_geo_asn')) + '</dt><dd class="font-mono text-xs break-all">' + escapeHtml(data.geo.as || '—') + '</dd></div>'
        + '</dl>';
    } else {
      geoHtml = '<p class="text-sm text-slate-500">' + escapeHtml(t('iprep_error_unreachable')) + '</p>';
    }

    // Connection type pills
    let connHtml;
    if (data.geo) {
      const tags = [];
      if (data.geo.hosting) tags.push({ key: 'iprep_conn_hosting', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/20' });
      if (data.geo.proxy)   tags.push({ key: 'iprep_conn_proxy',   cls: 'bg-red-500/15 text-red-300 border-red-500/20' });
      if (data.geo.mobile)  tags.push({ key: 'iprep_conn_mobile',  cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' });
      if (tags.length === 0) tags.push({ key: 'iprep_conn_residential', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/20' });
      connHtml = '<div class="flex flex-wrap gap-2">'
        + tags.map(function (tag) {
            return '<span class="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ' + tag.cls + '">' + escapeHtml(t(tag.key)) + '</span>';
          }).join('')
        + '</div>';
    } else {
      connHtml = '<p class="text-sm text-slate-500">—</p>';
    }

    // Blacklist summary
    const blSummary = data.dnsbl.listed === 0
      ? t('iprep_blacklists_clean')
      : t('iprep_blacklists_listed')
          .replace('{n}', String(data.dnsbl.listed))
          .replace('{total}', String(data.dnsbl.total));

    $('iprep-result').innerHTML =
      '<div class="card">'
      + '  <div class="flex flex-wrap items-center justify-between gap-4">'
      + '    <div class="min-w-0">'
      + '      <div class="text-xs text-slate-500">' + escapeHtml(t('iprep_results_for')) + '</div>'
      + '      <div class="text-base sm:text-lg font-mono font-semibold break-all">' + escapeHtml(data.ip) + '</div>'
      + '      <div class="mt-1 text-xs text-slate-500">' + escapeHtml(blSummary) + '</div>'
      + '    </div>'
      + '    <div class="text-right">'
      + '      <div class="text-xs text-slate-500">' + escapeHtml(t('iprep_score_label')) + '</div>'
      + '      <div class="text-4xl font-extrabold ' + scoreClass + '">' + data.score + '<span class="text-sm text-slate-500 font-normal"> / 100</span></div>'
      + '      <div class="mt-1"><span class="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ' + riskClass + '">' + escapeHtml(t('iprep_risk_' + data.risk)) + '</span></div>'
      + '    </div>'
      + '  </div>'
      + '</div>'

      + '<div class="card">'
      + '  <h2 class="text-lg font-bold mb-3">' + escapeHtml(t('iprep_blacklists_h2')) + '</h2>'
      + '  <div>' + blRows + '</div>'
      + '</div>'

      + '<div class="grid lg:grid-cols-2 gap-5">'
      + '  <div class="card">'
      + '    <h2 class="text-lg font-bold mb-3">' + escapeHtml(t('iprep_geo_h2')) + '</h2>'
      + '    ' + geoHtml
      + '  </div>'
      + '  <div class="card">'
      + '    <h2 class="text-lg font-bold mb-3">' + escapeHtml(t('iprep_connection_h2')) + '</h2>'
      + '    ' + connHtml
      + '  </div>'
      + '</div>'

      + '<div class="flex flex-wrap gap-2 justify-center">'
      + '  <button id="iprep-recheck" type="button" class="btn-ghost">' + escapeHtml(t('iprep_recheck')) + '</button>'
      + '  <button id="iprep-copy" type="button" class="btn-ghost">' + escapeHtml(t('iprep_copy')) + '</button>'
      + '</div>';

    const reBtn = $('iprep-recheck');
    if (reBtn) reBtn.addEventListener('click', function () {
      showForm();
      const input = $('iprep-input');
      if (input) { input.value = ''; input.focus(); }
    });
    const copyBtn = $('iprep-copy');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      const text = 'IP ' + data.ip
        + ' — score ' + data.score + '/100 (' + t('iprep_risk_' + data.risk) + ')'
        + ' — ' + blSummary;
      const done = function () { showToast(t('iprep_copy') + ' ✓'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          // Fallback for older browsers
          const ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (_) {}
          document.body.removeChild(ta);
        });
      }
    });
  }

  // ---- network call ----------------------------------------------
  async function check(ip) {
    showLoading();
    let data;
    try {
      const resp = await fetch('/api/ip-reputation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ip }),
      });
      data = await resp.json().catch(function () { return { error: 'parse_failed' }; });
      if (!resp.ok) {
        const map = { 'invalid_ip': 'iprep_error_invalid' };
        const key = map[data && data.error] || 'iprep_error';
        showError(key);
        return;
      }
    } catch (e) {
      showError('iprep_error');
      return;
    }
    renderResult(data);
  }

  // ---- wire up ----------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    const form = $('iprep-form');
    const input = $('iprep-input');
    if (form && input) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const ip = (input.value || '').trim();
        if (!ip) { input.focus(); return; }
        check(ip);
      });
    }
    const myIpBtn = $('iprep-myip');
    if (myIpBtn) {
      myIpBtn.addEventListener('click', function () {
        // Empty ip -> server falls back to CF-Connecting-IP
        check('');
      });
    }
  });
})();
