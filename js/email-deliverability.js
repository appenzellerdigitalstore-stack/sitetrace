// SiteTrace — Email deliverability page logic
// Form submit -> POST /api/email-deliverability -> render
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

  function showLoading() {
    $('emd-form-card').classList.add('hidden');
    $('emd-loading').classList.remove('hidden');
    $('emd-result').classList.add('hidden');
    $('emd-error').classList.add('hidden');
  }
  function showForm() {
    $('emd-form-card').classList.remove('hidden');
    $('emd-loading').classList.add('hidden');
    $('emd-result').classList.add('hidden');
    $('emd-error').classList.add('hidden');
  }
  function showError(key) {
    $('emd-form-card').classList.add('hidden');
    $('emd-loading').classList.add('hidden');
    $('emd-result').classList.add('hidden');
    $('emd-error').classList.remove('hidden');
    const el = $('emd-error-msg');
    if (el) el.textContent = t(key || 'emd_error');
  }

  // ---- per-record helpers ----
  function recPill(present) {
    if (present) {
      return '<span class="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">' + escapeHtml(t('emd_status_present')) + '</span>';
    }
    return '<span class="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/20">' + escapeHtml(t('emd_status_missing')) + '</span>';
  }

  function spfCard(spf) {
    let details = '';
    if (spf.present) {
      const qualBadge = spf.qualifier === '-all'
        ? '<span class="text-xs font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">-all (strict)</span>'
        : (spf.qualifier
            ? '<span class="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">' + escapeHtml(spf.qualifier) + ' (soft)</span>'
            : '<span class="text-xs font-mono px-1.5 py-0.5 rounded bg-red-500/15 text-red-300">' + escapeHtml(t('emd_no_qualifier')) + '</span>');
      details += '<div class="mt-2 text-xs text-slate-500">' + escapeHtml(t('emd_qualifier')) + ': ' + qualBadge + '</div>';
      details += '<div class="mt-2 text-xs text-slate-500">' + escapeHtml(t('emd_mechanisms')) + ': ' + spf.mechanismCount + '</div>';
      if (spf.tooManyLookups) {
        details += '<div class="mt-2 text-xs text-amber-300">⚠ ' + escapeHtml(t('emd_spf_too_many_lookups')) + '</div>';
      }
      details += '<pre class="mt-2 p-2 rounded bg-ink-900/60 border border-white/5 text-[11px] text-slate-400 font-mono break-all whitespace-pre-wrap">' + escapeHtml(spf.record) + '</pre>';
    } else {
      details = '<p class="text-sm text-slate-500 mt-1">' + escapeHtml(t('emd_spf_missing_help')) + '</p>';
    }
    return '<div class="card">'
      + '  <div class="flex items-center justify-between gap-3">'
      + '    <div class="flex items-center gap-2"><h3 class="text-base font-bold">SPF</h3>' + recPill(spf.present) + '</div>'
      + '    <span class="text-xs text-slate-500 font-mono">TXT @ apex</span>'
      + '  </div>'
      + '  <p class="text-xs text-slate-500 mt-1">' + escapeHtml(t('emd_spf_desc')) + '</p>'
      + '  ' + details
      + '</div>';
  }

  function dkimCard(dkim) {
    let details = '';
    if (dkim.present) {
      details = '<div class="mt-2 text-xs text-slate-500">'
        + escapeHtml(t('emd_selector')) + ': <span class="font-mono">' + escapeHtml(dkim.selector) + '._domainkey.' + escapeHtml(dkim.domain || '') + '</span></div>';
      details += '<div class="mt-1 text-xs text-slate-500">' + escapeHtml(t('emd_key_type')) + ': ' + escapeHtml(dkim.keyType) + '</div>';
      details += '<pre class="mt-2 p-2 rounded bg-ink-900/60 border border-white/5 text-[11px] text-slate-400 font-mono break-all whitespace-pre-wrap">' + escapeHtml(dkim.record) + '</pre>';
    } else {
      details = '<p class="text-sm text-slate-500 mt-1">'
        + escapeHtml(t('emd_dkim_missing_help').replace('{n}', String(dkim.probedCount || 0)))
        + '</p>';
    }
    return '<div class="card">'
      + '  <div class="flex items-center justify-between gap-3">'
      + '    <div class="flex items-center gap-2"><h3 class="text-base font-bold">DKIM</h3>' + recPill(dkim.present) + '</div>'
      + '    <span class="text-xs text-slate-500 font-mono">TXT @ &lt;selector&gt;._domainkey</span>'
      + '  </div>'
      + '  <p class="text-xs text-slate-500 mt-1">' + escapeHtml(t('emd_dkim_desc')) + '</p>'
      + '  ' + details
      + '</div>';
  }

  function dmarcCard(dmarc) {
    let details = '';
    if (dmarc.present) {
      const policyBadge = dmarc.policy === 'reject'
        ? '<span class="text-xs font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">reject (strict)</span>'
        : dmarc.policy === 'quarantine'
          ? '<span class="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">quarantine</span>'
          : '<span class="text-xs font-mono px-1.5 py-0.5 rounded bg-red-500/15 text-red-300">none (monitor only)</span>';
      details = '<div class="mt-2 text-xs text-slate-500">' + escapeHtml(t('emd_policy')) + ': ' + policyBadge + '</div>';
      if (dmarc.subdomainPolicy && dmarc.subdomainPolicy !== dmarc.policy) {
        details += '<div class="mt-1 text-xs text-slate-500">' + escapeHtml(t('emd_subdomain_policy')) + ': <span class="font-mono">' + escapeHtml(dmarc.subdomainPolicy) + '</span></div>';
      }
      if (dmarc.percentage !== 100) {
        details += '<div class="mt-1 text-xs text-slate-500">' + escapeHtml(t('emd_percentage')) + ': <span class="font-mono">' + escapeHtml(String(dmarc.percentage)) + '%</span></div>';
      }
      if (dmarc.reportingAggregate) {
        details += '<div class="mt-1 text-xs text-slate-500">' + escapeHtml(t('emd_aggregate_reports')) + ': <span class="font-mono break-all">' + escapeHtml(dmarc.reportingAggregate) + '</span></div>';
      }
      details += '<pre class="mt-2 p-2 rounded bg-ink-900/60 border border-white/5 text-[11px] text-slate-400 font-mono break-all whitespace-pre-wrap">' + escapeHtml(dmarc.record) + '</pre>';
    } else {
      details = '<p class="text-sm text-slate-500 mt-1">' + escapeHtml(t('emd_dmarc_missing_help')) + '</p>';
    }
    return '<div class="card">'
      + '  <div class="flex items-center justify-between gap-3">'
      + '    <div class="flex items-center gap-2"><h3 class="text-base font-bold">DMARC</h3>' + recPill(dmarc.present) + '</div>'
      + '    <span class="text-xs text-slate-500 font-mono">TXT @ _dmarc</span>'
      + '  </div>'
      + '  <p class="text-xs text-slate-500 mt-1">' + escapeHtml(t('emd_dmarc_desc')) + '</p>'
      + '  ' + details
      + '</div>';
  }

  function mxCard(mx) {
    let body = '';
    if (mx.present && mx.hosts.length) {
      const rows = mx.hosts.map(function (h) {
        return '<div class="flex items-center justify-between gap-2 py-1.5 border-b border-white/5 last:border-b-0 text-sm">'
          + '  <span class="font-mono text-slate-200 truncate" title="' + escapeHtml(h.host) + '">' + escapeHtml(h.host) + '</span>'
          + '  <span class="text-xs text-slate-500 font-mono">pref ' + h.preference + '</span>'
          + '</div>';
      }).join('');
      body = '<div class="mt-2">' + rows + '</div>';
    } else {
      body = '<p class="text-sm text-slate-500 mt-1">' + escapeHtml(t('emd_mx_missing_help')) + '</p>';
    }
    return '<div class="card">'
      + '  <div class="flex items-center justify-between gap-3">'
      + '    <div class="flex items-center gap-2"><h3 class="text-base font-bold">MX</h3>' + recPill(mx.present) + '</div>'
      + '    <span class="text-xs text-slate-500 font-mono">MX @ apex</span>'
      + '  </div>'
      + '  <p class="text-xs text-slate-500 mt-1">' + escapeHtml(t('emd_mx_desc')) + '</p>'
      + '  ' + body
      + '</div>';
  }

  function bimiCard(bimi) {
    let body;
    if (bimi.present) {
      body = '<pre class="mt-2 p-2 rounded bg-ink-900/60 border border-white/5 text-[11px] text-slate-400 font-mono break-all whitespace-pre-wrap">' + escapeHtml(bimi.record) + '</pre>';
    } else {
      body = '<p class="text-sm text-slate-500 mt-1">' + escapeHtml(t('emd_bimi_missing_help')) + '</p>';
    }
    return '<div class="card">'
      + '  <div class="flex items-center justify-between gap-3">'
      + '    <div class="flex items-center gap-2"><h3 class="text-base font-bold">BIMI</h3>' + recPill(bimi.present) + '</div>'
      + '    <span class="text-xs text-slate-500 font-mono">TXT @ default._bimi</span>'
      + '  </div>'
      + '  <p class="text-xs text-slate-500 mt-1">' + escapeHtml(t('emd_bimi_desc')) + '</p>'
      + '  ' + body
      + '</div>';
  }

  function issuesList(issues) {
    if (!issues || !issues.length) {
      return '<div class="card border-emerald-500/20 bg-emerald-500/5">'
        + '  <div class="text-emerald-300 text-sm font-semibold">✓ ' + escapeHtml(t('emd_no_issues')) + '</div>'
        + '</div>';
    }
    const items = issues.map(function (s) {
      return '<li class="flex items-start gap-2 py-1.5 text-sm text-amber-200">'
        + '<span class="text-amber-400 mt-0.5">⚠</span>'
        + '<span>' + escapeHtml(s) + '</span>'
        + '</li>';
    }).join('');
    return '<div class="card border-amber-500/20 bg-amber-500/5">'
      + '  <h3 class="text-base font-bold text-amber-200 mb-2">' + escapeHtml(t('emd_issues_h3')) + '</h3>'
      + '  <ul>' + items + '</ul>'
      + '</div>';
  }

  // ---- render ----
  function renderResult(data) {
    $('emd-form-card').classList.add('hidden');
    $('emd-loading').classList.add('hidden');
    $('emd-error').classList.add('hidden');
    $('emd-result').classList.remove('hidden');

    let scoreClass = 'text-emerald-300';
    if (data.score < 50) scoreClass = 'text-red-300';
    else if (data.score < 80) scoreClass = 'text-amber-300';

    let riskClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
    if (data.risk === 'medium') riskClass = 'bg-amber-500/15 text-amber-300 border-amber-500/20';
    else if (data.risk === 'high') riskClass = 'bg-red-500/15 text-red-300 border-red-500/20';

    const summary = (data.issues && data.issues.length)
      ? data.issues.length + ' ' + t('emd_issues_found')
      : t('emd_all_good');

    const html = ''
      + '<div class="card">'
      + '  <div class="flex flex-wrap items-center justify-between gap-4">'
      + '    <div class="min-w-0">'
      + '      <div class="text-xs text-slate-500">' + escapeHtml(t('emd_results_for')) + '</div>'
      + '      <div class="text-base sm:text-lg font-mono font-semibold break-all">' + escapeHtml(data.domain) + '</div>'
      + '      <div class="mt-1 text-xs text-slate-500">' + escapeHtml(summary) + '</div>'
      + '    </div>'
      + '    <div class="text-right">'
      + '      <div class="text-xs text-slate-500">' + escapeHtml(t('emd_score_label')) + '</div>'
      + '      <div class="text-4xl font-extrabold ' + scoreClass + '">' + data.score + '<span class="text-sm text-slate-500 font-normal"> / 100</span></div>'
      + '      <div class="mt-1"><span class="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ' + riskClass + '">' + escapeHtml(t('emd_risk_' + data.risk)) + '</span></div>'
      + '    </div>'
      + '  </div>'
      + '</div>'

      + issuesList(data.issues)

      + '<div class="grid lg:grid-cols-2 gap-5">'
      + '  ' + spfCard(data.records.spf)
      + '  ' + dkimCard(data.records.dkim)
      + '  ' + dmarcCard(data.records.dmarc)
      + '  ' + mxCard(data.records.mx)
      + '  ' + bimiCard(data.records.bimi)
      + '</div>'

      + '<div class="flex flex-wrap gap-2 justify-center">'
      + '  <button id="emd-recheck" type="button" class="btn-ghost">' + escapeHtml(t('emd_recheck')) + '</button>'
      + '  <button id="emd-copy" type="button" class="btn-ghost">' + escapeHtml(t('emd_copy')) + '</button>'
      + '</div>';

    $('emd-result').innerHTML = html;

    const reBtn = $('emd-recheck');
    if (reBtn) reBtn.addEventListener('click', function () {
      $('emd-result').classList.add('hidden');
      $('emd-form-card').classList.remove('hidden');
      const input = $('emd-input');
      if (input) { input.value = ''; input.focus(); }
    });
    const cpBtn = $('emd-copy');
    if (cpBtn) cpBtn.addEventListener('click', function () {
      const recs = data.records;
      const lines = [
        'Domain: ' + data.domain,
        'Score: ' + data.score + '/100 (' + t('emd_risk_' + data.risk) + ')',
        'SPF: ' + (recs.spf.present ? 'present' : 'MISSING'),
        'DKIM: ' + (recs.dkim.present ? 'present at ' + recs.dkim.selector : 'MISSING'),
        'DMARC: ' + (recs.dmarc.present ? 'present, p=' + recs.dmarc.policy : 'MISSING'),
        'MX: ' + (recs.mx.present ? recs.mx.hosts.length + ' host(s)' : 'MISSING'),
        'BIMI: ' + (recs.bimi.present ? 'present' : 'MISSING (optional)'),
      ];
      const text = lines.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { showToast(t('emd_copy') + ' ✓'); }).catch(function () {});
      }
    });
  }

  async function check(domain) {
    showLoading();
    let data;
    try {
      const resp = await fetch('/api/email-deliverability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain }),
      });
      data = await resp.json().catch(function () { return { error: 'parse_failed' }; });
      if (!resp.ok) {
        const map = { 'invalid_domain': 'emd_error_invalid' };
        const key = map[data && data.error] || 'emd_error';
        showError(key);
        return;
      }
    } catch (e) {
      showError('emd_error');
      return;
    }
    renderResult(data);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const form = $('emd-form');
    const input = $('emd-input');
    if (form && input) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const d = (input.value || '').trim();
        if (!d) { input.focus(); return; }
        check(d);
      });
      input.focus();
    }
    document.querySelectorAll('.emd-preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const d = btn.getAttribute('data-domain');
        if (input) input.value = d;
        check(d);
      });
    });
  });
})();
