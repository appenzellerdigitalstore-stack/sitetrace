/* ================================================================
 * SiteTrace — layout upgrade helpers
 * Every page now ships with static <header>, <footer>, <div id="site-bg">
 * and #support-fab baked into the HTML, so the page is fully populated
 * without JavaScript. This script only UPGRADES the static markup:
 *   - sets the active nav link class
 *   - injects the floating support FAB if missing
 *   - keeps a fallback path: if a page is missing the static markup
 *     (e.g. an older cache), it will inject minimal chrome rather than
 *     leave the page naked.
 *
 * Language switcher is owned by i18n.js (event-delegated, no DOMContentLoaded
 * race). wireLanguage() is kept as a no-op for back-compat with any caller.
 * ================================================================ */
(function (global) {
  'use strict';

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": ''' })[c];
    });
  }

  const LANG_LABELS = {
    en: 'English', es: 'Español'
  };

  // ---- Active nav marker ----
  function setActiveNav(active) {
    if (!active) return;
    document.querySelectorAll('[data-nav-key]').forEach(function (el) {
      if (el.getAttribute('data-nav-key') === active) el.classList.add('is-active');
    });
  }

  // ---- Language switcher ----
  // Switcher is owned by i18n.js (event-delegated, no DOMContentLoaded race).
  // This is kept as a no-op for back-compat with any caller that still invokes
  // it. The actual binding lives in i18n.js → wireSwitcher().
  function wireLanguage() { /* no-op: see i18n.js */ }

  // ---- Support FAB: only inject if missing ----
  function ensureSupportFab() {
    if (document.getElementById('support-fab')) return;
    const lang = (global.I18N && global.I18N.getLanguage) ? global.I18N.getLanguage() : 'en';
    const t = global.I18N ? global.I18N.t : function (k) { return k; };
    const html = ''
      + '<a href="https://paypal.me/edyappenzeller"'
      + '   target="_blank" rel="noopener noreferrer"'
      + '   id="support-fab"'
      + '   class="support-fab"'
      + '   data-i18n-attr="title:support_tooltip;aria-label:support_tooltip">'
      + '  <span class="support-fab-icon" aria-hidden="true">&#9749;</span>'
      + '  <span class="support-fab-label" data-i18n="support_btn">' + escapeHtml(t('support_btn')) + '</span>'
      + '</a>';
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    const fab = wrap.firstElementChild;
    if (fab) document.body.appendChild(fab);
  }

  // ---- Fallback inject: only if a placeholder is empty (older cache) ----
  function fallbackIfEmpty() {
    const lang = (global.I18N && global.I18N.getLanguage) ? global.I18N.getLanguage() : 'en';
    const t = global.I18N ? global.I18N.t : function (k) { return k; };

    const headerEl = document.getElementById('site-header');
    if (headerEl && !headerEl.children.length) {
      const html = ''
        + '<header class="site-header sticky top-0 z-40 backdrop-blur-xl bg-ink-900/70 border-b border-white/5">'
        + '  <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">'
        + '    <a href="/" class="flex items-center gap-2.5 group">'
        + '      <span class="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-brand">'
        + '        <svg viewBox="0 0 100 100" class="w-5 h-5" aria-hidden="true"><path d="M30 50 L45 50 L52 35 L62 65 L70 50 L80 50" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>'
        + '      </span>'
        + '      <span class="text-base sm:text-lg font-bold tracking-tight">'
        + '        <span data-i18n="brand">' + escapeHtml(t('brand')) + '</span>'
        + '        <span class="hidden sm:inline text-slate-500 font-normal text-xs ml-2" data-i18n="tagline">' + escapeHtml(t('tagline')) + '</span>'
        + '      </span>'
        + '    </a>'
        + '    <nav class="flex items-center gap-1 sm:gap-2" aria-label="Main">'
        + '      <a class="nav-link" href="/what-is-my-ip/" data-i18n="nav_whatismyip" data-nav-key="whatismyip">' + escapeHtml(t('nav_whatismyip')) + '</a>'
        + '      <a class="nav-link" href="/ping/" data-i18n="nav_ping" data-nav-key="ping">' + escapeHtml(t('nav_ping')) + '</a>'
        + '      <a class="nav-link" href="/dns-tools/" data-i18n="nav_dns" data-nav-key="dns">' + escapeHtml(t('nav_dns')) + '</a>'
        + '      <a class="nav-link" href="/is-it-down/" data-i18n="nav_status" data-nav-key="status">' + escapeHtml(t('nav_status')) + '</a>'
        + '    </nav>'
        + '  </div>'
        + '</header>';
      headerEl.innerHTML = html;
    }

    const bgEl = document.getElementById('site-bg');
    if (bgEl && !bgEl.children.length) {
      bgEl.innerHTML = ''
        + '<div class="fixed inset-0 -z-10 pointer-events-none">'
        + '  <div class="absolute inset-0 bg-hero-glow"></div>'
        + '  <div class="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]"></div>'
        + '</div>';
    }

    const footerEl = document.getElementById('site-footer');
    if (footerEl && !footerEl.children.length) {
      const year = new Date().getFullYear();
      const html = ''
        + '<footer class="border-t border-white/5 mt-12">'
        + '  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-[2fr_1fr_1fr] gap-8 text-sm">'
        + '    <div><div class="flex items-center gap-2 mb-3"><span class="w-7 h-7 rounded-lg bg-brand-gradient"></span><span class="font-bold" data-i18n="brand">' + escapeHtml(t('brand')) + '</span></div>'
        + '    <p class="text-slate-400 text-xs leading-relaxed max-w-md" data-i18n="footer_disclaimer">' + escapeHtml(t('footer_disclaimer')) + '</p></div>'
        + '    <div><div class="text-slate-500 text-xs uppercase tracking-widest mb-2" data-i18n="footer_about">' + escapeHtml(t('footer_about')) + '</div>'
        + '    <ul class="space-y-1 text-slate-300"><li><a href="/about/" class="hover:text-white">' + escapeHtml(t('footer_about')) + '</a></li>'
        + '    <li><a href="/blog/" class="hover:text-white">Blog</a></li>'
        + '    <li><a href="/privacy/" class="hover:text-white">' + escapeHtml(t('footer_privacy')) + '</a></li></ul></div>'
        + '    <div><div class="text-slate-500 text-xs uppercase tracking-widest mb-2" data-i18n="language">' + escapeHtml(t('language')) + '</div>'
        + '    <ul class="space-y-1 text-slate-300 text-sm">'
        +       Object.keys(LANG_LABELS).map(function(code){ return '<li><button class="lang-link hover:text-white" data-lang="' + code + '">' + escapeHtml(LANG_LABELS[code]) + '</button></li>'; }).join('')
        + '    </ul></div></div>'
        + '  <div class="border-t border-white/5"><div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-slate-500">&copy; ' + year + ' SiteTrace.</div></div>'
        + '</footer>';
      footerEl.innerHTML = html;
    }
  }

  function mount(opts) {
    opts = opts || {};
    setActiveNav(opts.active || '');
    fallbackIfEmpty();         // defensive: only injects when placeholders are empty
    ensureSupportFab();         // always safe — no-op if FAB already present in static HTML
    wireLanguage();             // always — interactive part
  }

  global.SiteTrace = global.SiteTrace || {};
  global.SiteTrace.layout = { mount: mount, wireLanguage: wireLanguage };
})(window);
