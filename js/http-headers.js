// SiteTrace — HTTP headers viewer page logic
// Form submit -> POST /api/http-headers -> render
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
    $('hhd-form-card').classList.add('hidden');
    $('hhd-loading').classList.remove('hidden');
    $('hhd-result').classList.add('hidden');
    $('hhd-error').classList.add('hidden');
  }
  function showForm() {
    $('hhd-form-card').classList.remove('hidden');
    $('hhd-loading').classList.add('hidden');
    $('hhd-result').classList.add('hidden');
    $('hhd-error').classList.add('hidden');
  }
  function showError(key) {
    $('hhd-form-card').classList.add('hidden');
    $('hhd-loading').classList.add('hidden');
    $('hhd-result').classList.add('hidden');
    $('hhd-error').classList.remove('hidden');
    const el = $('hhd-error-msg');
    if (el) el.textContent = t(key || 'hhd_error');
  }

  // ---- helpers ----
  function gradePill(grade) {
    let cls = 'bg-slate-500/15 text-slate-300 border-slate-500/20';
    if (grade === 'A+') cls = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
    else if (grade === 'A')  cls = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
    else if (grade === 'B')  cls = 'bg-lime-500/15 text-lime-300 border-lime-500/20';
    else if (grade === 'C')  cls = 'bg-amber-500/15 text-amber-300 border-amber-500/20';
    else if (grade === 'D')  cls = 'bg-orange-500/15 text-orange-300 border-orange-500/20';
    else if (grade === 'F')  cls = 'bg-red-500/15 text-red-300 border-red-500/20';
    return '<span class="inline-flex items-center text-sm font-bold px-2.5 py-1 rounded-full border ' + cls + '">' + escapeHtml(grade) + '</span>';
  }
  function checkPill(pass) {
    if (pass) {
      return '<span class="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">✓ ' + escapeHtml(t('hhd_check_pass')) + '</span>';
    }
    return '<span class="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/20">✗ ' + escapeHtml(t('hhd_check_fail')) + '</span>';
  }
  function statusPill(code) {
    let cls = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
    if (code >= 400) cls = 'bg-red-500/15 text-red-300 border-red-500/20';
    else if (code >= 300) cls = 'bg-amber-500/15 text-amber-300 border-amber-500/20';
    return '<span class="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ' + cls + '">' + escapeHtml(String(code)) + '</span>';
  }

  // ---- render ----
  function renderResult(data) {
    $('hhd-form-card').classList.add('hidden');
    $('hhd-loading').classList.add('hidden');
    $('hhd-error').classList.add('hidden');
    $('hhd-result').classList.remove('hidden');

    // Security checks
    const checkRows = (data.checks || []).map(function (c) {
      const v = c.value ? c.value : '';
      const vTrunc = v.length > 200 ? v.slice(0, 200) + '…' : v;
      return ''
        + '<div class="py-3 border-b border-white/5 last:border-b-0">'
        + '  <div class="flex items-start justify-between gap-3">'
        + '    <div class="min-w-0 flex-1">'
        + '      <div class="flex items-center gap-2 flex-wrap">'
        + '        <span class="text-sm font-semibold text-slate-100">' + escapeHtml(c.label) + '</span>'
        + '        <span class="text-xs text-slate-500 font-mono break-all">' + escapeHtml(c.header) + '</span>'
        + '      </div>'
        + '      <p class="text-xs text-slate-500 mt-1">' + escapeHtml(c.why) + '</p>'
        +      (c.present
            ? '      <pre class="mt-2 p-2 rounded bg-ink-900/60 border border-white/5 text-[11px] text-slate-300 font-mono break-all whitespace-pre-wrap">' + escapeHtml(vTrunc) + '</pre>'
            : '')
        + '    </div>'
        + '    <div class="shrink-0">' + checkPill(c.pass) + '</div>'
        + '  </div>'
        + '</div>';
    }).join('');

    // Info leaks
    let leaksHtml = '';
    if (data.infoLeaks && data.infoLeaks.length) {
      const rows = data.infoLeaks.map(function (l) {
        return '<div class="flex items-center justify-between gap-3 py-1.5 text-sm border-b border-white/5 last:border-b-0">'
          + '  <span class="font-mono text-amber-300">' + escapeHtml(l.header) + '</span>'
          + '  <span class="font-mono text-xs text-slate-400 break-all">' + escapeHtml(l.value) + '</span>'
          + '</div>';
      }).join('');
      leaksHtml = '<div class="card border-amber-500/20 bg-amber-500/5">'
        + '  <h3 class="text-base font-bold text-amber-200 mb-2">⚠ ' + escapeHtml(t('hhd_info_leaks_h3')) + '</h3>'
        + '  <p class="text-xs text-slate-400 mb-3">' + escapeHtml(t('hhd_info_leaks_desc')) + '</p>'
        + '  <div>' + rows + '</div>'
        + '</div>';
    } else {
      leaksHtml = '<div class="card border-emerald-500/20 bg-emerald-500/5">'
        + '  <div class="text-emerald-300 text-sm">✓ ' + escapeHtml(t('hhd_no_info_leaks')) + '</div>'
        + '</div>';
    }

    // All headers table (alphabetical)
    const allHeaderKeys = Object.keys(data.headers || {}).sort();
    const headerRows = allHeaderKeys.map(function (k) {
      const v = String(data.headers[k] || '');
      const vTrunc = v.length > 200 ? v.slice(0, 200) + '…' : v;
      return '<div class="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 py-1.5 text-sm border-b border-white/5 last:border-b-0">'
        + '  <span class="font-mono text-slate-400 break-all">' + escapeHtml(k) + '</span>'
        + '  <span class="font-mono text-xs text-slate-200 break-all">' + escapeHtml(vTrunc) + '</span>'
        + '</div>';
    }).join('');

    const html = ''
      + '<div class="card">'
      + '  <div class="flex flex-wrap items-center justify-between gap-4">'
      + '    <div class="min-w-0">'
      + '      <div class="text-xs text-slate-500">' + escapeHtml(t('hhd_results_for')) + '</div>'
      + '      <div class="text-base sm:text-lg font-mono font-semibold break-all">' + escapeHtml(data.finalUrl || data.inputUrl) + '</div>'
      +      (data.redirected
          ? '      <div class="mt-1 text-xs text-amber-300">↪ ' + escapeHtml(t('hhd_redirected_from')) + ' <span class="font-mono">' + escapeHtml(data.inputUrl) + '</span></div>'
          : '')
      + '    </div>'
      + '    <div class="text-right">'
      + '      <div class="flex items-center gap-2">'
      + '        <span class="text-xs text-slate-500">' + escapeHtml(t('hhd_grade_label')) + '</span>'
      +          gradePill(data.grade)
      + '        <span class="text-2xl font-extrabold text-brand-300">' + data.score + '<span class="text-xs text-slate-500 font-normal"> / 100</span></span>'
      + '      </div>'
      + '      <div class="text-[10px] text-slate-500 mt-1">'
      +          escapeHtml(t('hhd_present_of_total').replace('{p}', String(data.present)).replace('{t}', String(data.total)))
      + '        · ' + statusPill(data.status) + ' ' + escapeHtml(data.statusText || '')
      + '        · ' + data.fetchedMs + ' ms'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '</div>'

      + '<div class="card">'
      + '  <h2 class="text-lg font-bold mb-1">' + escapeHtml(t('hhd_checks_h2')) + '</h2>'
      + '  <p class="text-xs text-slate-500 mb-3">' + escapeHtml(t('hhd_checks_desc')) + '</p>'
      + '  <div>' + checkRows + '</div>'
      + '</div>'

      + leaksHtml

      + '<div class="card">'
      + '  <h2 class="text-lg font-bold mb-3">' + escapeHtml(t('hhd_all_headers_h2')) + ' <span class="text-xs text-slate-500 font-normal">(' + allHeaderKeys.length + ')</span></h2>'
      + '  <div class="max-h-[600px] overflow-y-auto">' + headerRows + '</div>'
      + '</div>'

      + '<div class="flex flex-wrap gap-2 justify-center">'
      + '  <button id="hhd-recheck" type="button" class="btn-ghost">' + escapeHtml(t('hhd_recheck')) + '</button>'
      + '  <button id="hhd-copy" type="button" class="btn-ghost">' + escapeHtml(t('hhd_copy')) + '</button>'
      + '</div>';

    $('hhd-result').innerHTML = html;

    const reBtn = $('hhd-recheck');
    if (reBtn) reBtn.addEventListener('click', function () {
      $('hhd-result').classList.add('hidden');
      $('hhd-form-card').classList.remove('hidden');
      const input = $('hhd-input');
      if (input) { input.value = ''; input.focus(); }
    });
    const cpBtn = $('hhd-copy');
    if (cpBtn) cpBtn.addEventListener('click', function () {
      const lines = ['URL: ' + (data.finalUrl || data.inputUrl), 'Status: ' + data.status + ' ' + (data.statusText || ''), 'Security grade: ' + data.grade + ' (' + data.score + '/100)', ''];
      allHeaderKeys.forEach(function (k) { lines.push(k + ': ' + data.headers[k]); });
      const text = lines.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { showToast(t('hhd_copy') + ' ✓'); }).catch(function () {});
      }
    });
  }

  async function check(url) {
    showLoading();
    let data;
    try {
      const resp = await fetch('/api/http-headers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url }),
      });
      data = await resp.json().catch(function () { return { error: 'parse_failed' }; });
      if (!resp.ok) {
        const map = {
          'invalid_url': 'hhd_error_invalid',
          'blocked_url': 'hhd_error_invalid',
          'unreachable': 'hhd_error_unreachable',
          'too_large': 'hhd_error_too_large',
        };
        const key = map[data && data.error] || 'hhd_error';
        showError(key);
        return;
      }
    } catch (e) {
      showError('hhd_error');
      return;
    }
    renderResult(data);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const form = $('hhd-form');
    const input = $('hhd-input');
    if (form && input) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const url = (input.value || '').trim();
        if (!url) { input.focus(); return; }
        check(url);
      });
      input.focus();
    }
    document.querySelectorAll('.hhd-preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const url = btn.getAttribute('data-url');
        if (input) input.value = url;
        check(url);
      });
    });
  });
})();
