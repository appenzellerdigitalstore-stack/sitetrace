// SiteTrace — SEO Checker page logic
// Form submit -> POST /api/seo-check -> render the report
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

  function setStatus(msg, kind) {
    const el = $('seo-status');
    if (!el) return;
    el.className = 'text-xs text-center mt-2 ' + (kind === 'error' ? 'text-amber-300' : 'text-slate-500');
    el.textContent = msg || '';
  }

  function showLoading() {
    $('seo-form-card').classList.add('hidden');
    $('seo-loading').classList.remove('hidden');
    $('seo-result').classList.add('hidden');
    setStatus('', '');
  }

  function showForm() {
    $('seo-form-card').classList.remove('hidden');
    $('seo-loading').classList.add('hidden');
    $('seo-result').classList.add('hidden');
    setStatus('', '');
  }

  function showError(messageKey) {
    $('seo-form-card').classList.add('hidden');
    $('seo-loading').classList.add('hidden');
    $('seo-result').classList.remove('hidden');
    $('seo-result').innerHTML =
      '<div class="card text-center py-10">'
      + '  <div class="text-amber-300 text-sm mb-3">' + escapeHtml(t(messageKey || 'seo_error')) + '</div>'
      + '  <button id="seo-retry" class="btn-ghost">' + escapeHtml(t('seo_recheck')) + '</button>'
      + '</div>';
    const btn = $('seo-retry');
    if (btn) btn.addEventListener('click', showForm);
  }

  function renderReport(data) {
    $('seo-form-card').classList.add('hidden');
    $('seo-loading').classList.add('hidden');
    $('seo-result').classList.remove('hidden');

    const score = data.score;
    const total = data.total;
    const counts = data.counts;
    const passed = counts.passing;
    const failed = counts.warnings;

    // Score color: green 75+, amber 50-74, red 0-49
    let scoreClass = 'text-emerald-300';
    if (score < 50) scoreClass = 'text-red-300';
    else if (score < 75) scoreClass = 'text-amber-300';

    const rows = data.results.map(function (r) {
      const statusKey = r.pass ? 'seo_status_pass' : 'seo_status_fail';
      const statusText = t(statusKey);
      const statusPill = r.pass
        ? '<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">' + escapeHtml(statusText) + '</span>'
        : '<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/20">' + escapeHtml(statusText) + '</span>';

      let valueLine = '';
      if (r.value !== null && r.value !== undefined && r.value !== '' && !(typeof r.value === 'object' && r.value !== null)) {
        const v = String(r.value);
        if (v.length > 0 && v.length < 200) {
          valueLine = '<div class="mt-1 text-xs text-slate-500 font-mono break-all">' + escapeHtml(v) + '</div>';
        }
      } else if (r.value && typeof r.value === 'object') {
        try {
          const compact = JSON.stringify(r.value);
          if (compact.length < 200) valueLine = '<div class="mt-1 text-xs text-slate-500 font-mono break-all">' + escapeHtml(compact) + '</div>';
        } catch (_) { /* ignore */ }
      }

      return ''
        + '<div class="flex items-start justify-between gap-3 py-2.5 border-b border-white/5 last:border-b-0">'
        + '  <div class="min-w-0 flex-1">'
        + '    <div class="text-sm text-slate-200">' + escapeHtml(r.message) + '</div>'
        +     valueLine
        + '  </div>'
        + '  <div class="flex flex-col items-end gap-1 shrink-0">'
        +     statusPill
        + '    <div class="text-[10px] text-slate-500 font-mono">+' + r.weight + ' pts</div>'
        + '  </div>'
        + '</div>';
    }).join('');

    $('seo-result').innerHTML =
      '<div class="card">'
      + '  <div class="flex flex-wrap items-center justify-between gap-3 mb-1">'
      + '    <div>'
      + '      <div class="text-xs text-slate-500">' + escapeHtml(t('seo_results_for')) + '</div>'
      + '      <div class="text-base sm:text-lg font-mono font-semibold break-all">' + escapeHtml(data.url) + '</div>'
      + '    </div>'
      + '    <div class="text-right">'
      + '      <div class="text-xs text-slate-500">' + escapeHtml(t('seo_score_label')) + '</div>'
      + '      <div class="text-3xl font-extrabold ' + scoreClass + '">' + score + '<span class="text-sm text-slate-500 font-normal"> / ' + total + '</span></div>'
      + '      <div class="text-[10px] text-slate-500 mt-1">' + escapeHtml(t('seo_status_legend')) + '</div>'
      + '    </div>'
      + '  </div>'
      + '  <div class="mt-4 text-xs text-slate-500">'
      + '    <span class="text-emerald-300 font-semibold">' + passed + '</span> ' + escapeHtml(t('seo_passing')) + ' · '
      + '    <span class="text-red-300 font-semibold">' + failed + '</span> ' + escapeHtml(t('seo_issues')) + ' · '
      + '    <span class="text-slate-500">fetched in ' + data.fetchedMs + ' ms</span>'
      + '  </div>'
      + '  <div class="mt-5 pt-4 border-t border-white/5">'
      +     rows
      + '  </div>'
      + '  <div class="mt-6 text-center">'
      + '    <button id="seo-retry" class="btn-ghost">' + escapeHtml(t('seo_recheck')) + '</button>'
      + '  </div>'
      + '</div>';

    const btn = $('seo-retry');
    if (btn) btn.addEventListener('click', showForm);
  }

  async function check(url) {
    showLoading();
    let data;
    try {
      const resp = await fetch('/api/seo-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url }),
      });
      data = await resp.json().catch(function () { return { error: 'parse_failed' }; });
      if (!resp.ok) {
        // Map known error codes to i18n keys.
        const map = {
          'invalid_url': 'seo_error_invalid',
          'blocked_url': 'seo_error_invalid',
          'unreachable': 'seo_error_unreachable',
          'too_large': 'seo_error_too_large',
        };
        const key = map[data && data.error] || 'seo_error';
        showError(key);
        return;
      }
    } catch (e) {
      showError('seo_error');
      return;
    }
    renderReport(data);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const form = $('seo-form');
    const input = $('seo-input');
    if (form && input) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const url = (input.value || '').trim();
        if (!url) return;
        check(url);
      });
    }
  });
})();
