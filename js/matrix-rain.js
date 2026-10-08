// matrix-rain.js — Lovable-style falling-code background.
// Based on the falling-code-sparkle.lovable.app implementation, adapted to vanilla JS.
//
// Visual: full-viewport canvas with vertical columns of falling Japanese katakana
// + digits. The leading char of each stream is brighter; the rest fade with depth.
// CSS variables (--rain-color, --rain-head, --background, --foreground) drive the
// palette so this matches whatever theme the page is in.
//
// Usage:
//   <div class="matrix-background" aria-hidden="true">
//     <canvas class="matrix-rain"></canvas>
//     <div class="matrix-shade"></div>
//   </div>
//   <script src="/js/matrix-rain.js" defer></script>

(function () {
  'use strict';

  // Self-skip if the user prefers reduced motion.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Character pool: 15 katakana + 10 digits = 25 chars, modulo 34 (matches Lovable).
  const POOL = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789';

  // Geometry constants (in CSS px — the canvas is then scaled for HiDPI inside).
  const CELL_W = 25;        // horizontal spacing between columns
  const CELL_H = 19;        // vertical spacing between chars in a stream
  const FONT_PX = 14;       // char font size
  const DPR_CAP = 2;        // cap devicePixelRatio for performance

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    const wrap = document.querySelector('.matrix-background');
    const canvas = document.querySelector('.matrix-rain');
    const shade = document.querySelector('.matrix-shade');
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Read CSS variables so the canvas can use whatever the theme defines.
    const cs = getComputedStyle(canvas);
    const rainColor = (cs.getPropertyValue('--rain-color') || '#22c55e').trim();
    const rainHead = (cs.getPropertyValue('--rain-head') || '#bbf7d0').trim();

    let width = 0;
    let height = 0;
    let columns = [];   // [{ y, speed, length }]
    let lastTs = 0;
    let rafId = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Resize: recompute column count and stream positions to fit the viewport.
    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const colCount = Math.ceil(width / CELL_W);
      columns = Array.from({ length: colCount }, () => ({
        y: Math.random() * (height + 400),
        speed: 100 + Math.random() * 110,   // px/sec
        length: 8 + Math.floor(Math.random() * 19),  // 8-26 chars
      }));
      paint();
    }

    // Paint a single frame.
    function paint() {
      ctx.clearRect(0, 0, width, height);
      ctx.font = FONT_PX + 'px monospace';
      ctx.textBaseline = 'top';
      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        // Every 5th column is slightly more opaque (the "highlight every 5th" trick).
        const baseAlpha = (c % 5 === 0) ? 0.95 : 0.65;
        for (let r = 0; r < col.length; r++) {
          // Tail fades with depth.
          ctx.globalAlpha = (1 - r / col.length) * baseAlpha;
          ctx.fillStyle = (r === 0) ? rainHead : rainColor;
          // Pseudo-random char per cell, stable per frame.
          const ch = POOL.charAt((c * 7 + r * 13 + Math.floor(col.y / 22)) % POOL.length);
          ctx.fillText(ch, c * CELL_W, col.y - r * CELL_H);
        }
      }
      ctx.globalAlpha = 1;
    }

    // Animation tick (delta-time based, clamped to avoid jumps after tab-switch).
    function tick(ts) {
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0;
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        col.y += col.speed * dt;
        // Reset the stream once its tail has fully scrolled off the bottom.
        if (col.y - col.length * CELL_H > height) {
          col.y = -20;
        }
      }
      paint();
      lastTs = ts;
      rafId = requestAnimationFrame(tick);
    }

    // Toggle on reduced-motion change.
    function motionChange() {
      cancelAnimationFrame(rafId);
      lastTs = 0;
      if (!reducedMotion.matches) {
        rafId = requestAnimationFrame(tick);
      }
    }

    window.addEventListener('resize', resize, { passive: true });
    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener('change', motionChange);
    }

    // Boot.
    resize();
    rafId = requestAnimationFrame(tick);
  });
})();
