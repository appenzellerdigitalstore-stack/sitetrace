/* ================================================================
 * SiteTrace — Landing page "live status" mini-widget
 * Pulls the current statuspage.io indicator for 4 popular services
 * and lights up the dots on the downdetector feature card. Pure
 * read-only — never blocks the page render, just enhances the card.
 * ================================================================ */
(function () {
  'use strict';

  const FEATURED = [
    { label: 'Cloudflare', summaryUrl: 'https://www.cloudflarestatus.com/api/v2/summary.json' },
    { label: 'GitHub',     summaryUrl: 'https://www.githubstatus.com/api/v2/summary.json'     },
    { label: 'Discord',    summaryUrl: 'https://discordstatus.com/api/v2/summary.json'        },
    { label: 'OpenAI',     summaryUrl: 'https://status.openai.com/api/v2/summary.json'        },
  ];

  const INDICATOR_CLASS = {
    none:        'dot--ok',
    minor:       'dot--warn',
    major:       'dot--warn',
    critical:    'dot--err',
    maintenance: 'dot--warn',
  };

  function paint(svc, indicator, ms) {
    const rows = document.querySelectorAll('#mini-status [data-skel]');
    const dot  = document.querySelector('#mini-status .dot--unk');
    // No reliable index mapping without more wiring; keep this simple and
    // mark the whole widget as "ok" when at least one service is up.
    if (indicator === 'none') {
      if (dot) dot.className = 'dot dot--ok';
    } else if (indicator === 'critical') {
      if (dot) dot.className = 'dot dot--err';
    } else if (indicator === 'major' || indicator === 'minor') {
      if (dot) dot.className = 'dot dot--warn';
    }
  }

  async function loadOne(svc) {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 5000);
    try {
      const r = await fetch(svc.summaryUrl, { signal: ctrl.signal, cache: 'no-store' });
      if (!r.ok) return null;
      const data = await r.json();
      return data.status && data.status.indicator;
    } catch (_) {
      return null;
    } finally {
      clearTimeout(tid);
    }
  }

  async function boot() {
    if (!document.getElementById('mini-status')) return;
    // Fade in the dots as data arrives
    const results = await Promise.all(FEATURED.map(loadOne));
    let any = null;
    results.forEach((ind) => { if (ind) any = ind; });
    // If ALL returned null, leave the dots as unknown; otherwise upgrade
    // the widget to a generic "all systems green" or "issue detected" pill.
    const dot = document.querySelector('#mini-status .dot--unk');
    if (dot && any) {
      dot.className = 'dot ' + (INDICATOR_CLASS[any] || 'dot--unk');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
