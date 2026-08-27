/* ================================================================
 * SiteTrace — shared layout helpers
 * Used by every page to render the consistent header / footer
 * and to mark the active nav link.
 *
 * Pages call: SiteTrace.layout.mount({ active: 'whatismyip' });
 * ================================================================ */
(function (global) {
  'use strict';

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function navLink(href, label, key) {
    return '<a class="nav-link" href="' + href + '" data-i18n="' + key + '" data-nav-key="' + key + '">' + escapeHtml(label) + '</a>';
  }

  // Native-language labels for the language switcher. Keys are ISO 639-1 codes
  // (matching the i18n.js dictionary keys); values are the language name in
  // its own language — that's how users most easily identify their language.
  const LANG_LABELS = {
    en: 'English',
    es: 'Español',
    pt: 'Português',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    ja: '日本語',
    zh: '中文',
  };

  function languageOptions(current) {
    return Object.keys(LANG_LABELS).map(function (code) {
      const sel = code === current ? ' class="lang-option is-active"' : ' class="lang-option"';
      return '<button' + sel + ' data-lang="' + code + '" role="option">' + escapeHtml(LANG_LABELS[code]) + '</button>';
    }).join('');
  }

  function footerLanguageOptions(current) {
    return Object.keys(LANG_LABELS).map(function (code) {
      return '<li><button class="lang-link hover:text-white" data-lang="' + code + '">' + escapeHtml(LANG_LABELS[code]) + '</button></li>';
    }).join('');
  }

  function mount(opts) {
    opts = opts || {};
    const active = opts.active || '';
    const year = new Date().getFullYear();
    const lang = (global.I18N && global.I18N.getLanguage) ? global.I18N.getLanguage() : 'en';
    const t = global.I18N ? global.I18N.t : function (k) { return k; };

    const header = ''
      + '<header class="sticky top-0 z-40 backdrop-blur-xl bg-ink-900/70 border-b border-white/5">'
      + '  <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">'
      + '    <a href="/" data-route="home" class="flex items-center gap-2.5 group">'
      + '      <span class="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-brand transition-transform group-hover:scale-105">'
      + '        <svg viewBox="0 0 100 100" class="w-5 h-5" aria-hidden="true">'
      + '          <path d="M30 50 L45 50 L52 35 L62 65 L70 50 L80 50" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
      + '        </svg>'
      + '      </span>'
      + '      <span class="text-base sm:text-lg font-bold tracking-tight">'
      + '        <span data-i18n="brand">' + escapeHtml(t('brand')) + '</span>'
      + '        <span class="hidden sm:inline text-slate-500 font-normal text-xs ml-2" data-i18n="tagline">' + escapeHtml(t('tagline')) + '</span>'
      + '      </span>'
      + '    </a>'
      + '    <nav class="flex items-center gap-1 sm:gap-2" aria-label="Main">'
      +       navLink('/what-is-my-ip/', t('nav_whatismyip'), 'nav_whatismyip')
      +       navLink('/ping/', t('nav_ping'), 'nav_ping')
      +       navLink('/dns-tools/', t('nav_dns'), 'nav_dns')
      +       navLink('/is-it-down/', t('nav_status'), 'nav_status')
      + '      <a href="https://paypal.me/edyappenzeller" target="_blank" rel="noopener noreferrer"'
    + '         class="support-header-link ml-1 sm:ml-2 hidden sm:inline-flex"'
    + '         data-i18n-attr="title:support_tooltip;aria-label:support_tooltip">'
    + '        <span class="support-header-link-icon" aria-hidden="true">&#9749;</span>'
    + '        <span data-i18n="support_header">' + escapeHtml(t('support_header')) + '</span>'
    + '      </a>'
    + '      <div class="relative ml-1 sm:ml-2" id="lang-wrap">'
      + '        <button id="lang-toggle" class="nav-icon-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="' + escapeHtml(t('language')) + '">'
      + '          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>'
      + '          <span id="lang-current" class="text-[11px] font-semibold uppercase tracking-wider">' + lang.toUpperCase() + '</span>'
      + '        </button>'
      + '        <ul id="lang-menu" role="listbox" class="hidden absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-ink-800/95 backdrop-blur-xl shadow-2xl py-1 text-sm">'
      +           languageOptions(lang)
      + '        </ul>'
      + '      </div>'
      + '    </nav>'
      + '  </div>'
      + '</header>';

    const footer = ''
      + '<footer class="border-t border-white/5 mt-12">'
      + '  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-[2fr_1fr_1fr] gap-8 text-sm">'
      + '    <div>'
      + '      <div class="flex items-center gap-2 mb-3">'
      + '        <span class="w-7 h-7 rounded-lg bg-brand-gradient"></span>'
      + '        <span class="font-bold" data-i18n="brand">' + escapeHtml(t('brand')) + '</span>'
      + '      </div>'
      + '      <p class="text-slate-400 text-xs leading-relaxed max-w-md" data-i18n="footer_disclaimer">' + escapeHtml(t('footer_disclaimer')) + '</p>'
      + '    </div>'
      + '    <div>'
      + '      <div class="text-slate-500 text-xs uppercase tracking-widest mb-2" data-i18n="footer_about">' + escapeHtml(t('footer_about')) + '</div>'
      + '      <ul class="space-y-1 text-slate-300">'
      + '        <li><a href="/about/" class="hover:text-white" data-i18n="footer_about">' + escapeHtml(t('footer_about')) + '</a></li>'
      + '        <li><a href="/blog/" class="hover:text-white" data-i18n="footer_blog">Blog</a></li>'
      + '        <li><a href="/privacy/" class="hover:text-white" data-i18n="footer_privacy">' + escapeHtml(t('footer_privacy')) + '</a></li>'
      + '      </ul>'
      + '    </div>'
      + '    <div>'
      + '      <div class="text-slate-500 text-xs uppercase tracking-widest mb-2" data-i18n="language">' + escapeHtml(t('language')) + '</div>'
      + '      <ul class="space-y-1 text-slate-300 text-sm">'
      +         footerLanguageOptions(lang)
      + '      </ul>'
      + '    </div>'
      + '  </div>'
      + '  <div class="border-t border-white/5">'
      + '    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">'
      + '      <span>© ' + year + ' SiteTrace. <span data-i18n="footer_rights">' + escapeHtml(t('footer_rights')) + '</span></span>'
      + '      <span class="font-mono">v1.0.0</span>'
      + '    </div>'
      + '  </div>'
      + '</footer>';

    // Background
    const bg = ''
      + '<div class="fixed inset-0 -z-10 pointer-events-none">'
      + '  <div class="absolute inset-0 bg-hero-glow"></div>'
      + '  <div class="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]"></div>'
      + '</div>';

    // Inject
    const headerEl = document.getElementById('site-header');
    if (headerEl) headerEl.innerHTML = header;
    const footerEl = document.getElementById('site-footer');
    if (footerEl) footerEl.innerHTML = footer;
    const bgEl = document.getElementById('site-bg');
    if (bgEl) bgEl.innerHTML = bg;

    // Inject the floating "Support SiteTrace" donate button (always visible on every page).
    // Idempotent: replaces any existing #support-fab.
    const supportHtml = ''
      + '<a href="https://paypal.me/edyappenzeller"'
      + '   target="_blank" rel="noopener noreferrer"'
      + '   id="support-fab"'
      + '   class="support-fab"'
      + '   data-i18n-attr="title:support_tooltip;aria-label:support_tooltip">'
      + '  <span class="support-fab-icon" aria-hidden="true">&#9749;</span>'
      + '  <span class="support-fab-label" data-i18n="support_btn">' + escapeHtml(t('support_btn')) + '</span>'
      + '</a>';
    const existing = document.getElementById('support-fab');
    if (existing) existing.remove();
    const wrap = document.createElement('div');
    wrap.innerHTML = supportHtml;
    const fab = wrap.firstElementChild;
    if (fab) document.body.appendChild(fab);

    // Mark active nav
    if (active) {
      document.querySelectorAll('[data-nav-key]').forEach(function (el) {
        if (el.getAttribute('data-nav-key') === active) el.classList.add('is-active');
      });
    }

    // Wire up language switcher
    wireLanguage();
  }

  function wireLanguage() {
    const wrap = document.getElementById('lang-wrap');
    const btn  = document.getElementById('lang-toggle');
    const menu = document.getElementById('lang-menu');
    if (!wrap || !btn || !menu) return;

    function setActive(lang) {
      document.querySelectorAll('.lang-option').forEach(function (o) {
        o.classList.toggle('is-active', o.getAttribute('data-lang') === lang);
      });
      const cur = document.getElementById('lang-current');
      if (cur) cur.textContent = lang.toUpperCase();
    }

    function open(isOpen) {
      menu.classList.toggle('hidden', !isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      open(menu.classList.contains('hidden'));
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) open(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') open(false);
    });
    menu.addEventListener('click', function (e) {
      const b = e.target.closest('[data-lang]');
      if (!b) return;
      const lang = b.getAttribute('data-lang');
      if (global.I18N) {
        global.I18N.setLanguage(lang);
        setActive(lang);
      }
      open(false);
    });

    document.querySelectorAll('.lang-link').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        const lang = b.getAttribute('data-lang');
        if (global.I18N) {
          global.I18N.setLanguage(lang);
          setActive(lang);
        }
      });
    });

    if (global.I18N) {
      setActive(global.I18N.getLanguage());
      global.I18N.onChange(function (lang) { setActive(lang); });
    }
  }

  global.SiteTrace = global.SiteTrace || {};
  global.SiteTrace.layout = { mount: mount, wireLanguage: wireLanguage };
})(window);
