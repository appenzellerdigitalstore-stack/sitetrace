// matrix-bg.js — falling-code sparkle background for inner pages (NOT landing).
// Landing already has its own live animated matrix via .matrix-bg div in index.html.
// This script self-skips on landing (.home class) and on reduced-motion preference.
//
// Visual: canvas with falling green terminal characters. Random sparkle highlights
// at the leading edge of each column to give it the "code falling through night" feel.

(function () {
  'use strict';

  // Skip on landing.
  if (document.body && document.body.classList.contains('home')) return;

  // Skip on reduced motion.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    // Skip if no body (defensive).
    if (!document.body) return;

    var canvas = document.createElement('canvas');
    canvas.id = 'matrix-rain-bg';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    // Sitetrace-themed character pool — mix of binary, hex, IP-like, terminal syntax.
    var POOL = '01$><#&@!?/%abcdef0123456789$ dig +short @8.8.8.8 curl -I https://0xCAFE ' +
               '0xDEADBEEF RFC1918 192.168 10.0.0 trace-route 99% 0xFEED 22:33:44:55:66:77 ' +
               'A 2001:db8:: 0x7F000001 192.168.1.1 UDP 53 TCP 443 $ whois -h iana.org ' +
               'AAAA 2001:4860 TXT spf1 include:_spf traceroute -m 30 10110101010 ' +
               '01010101010 10101010101 $ nslookup $ arp -a 8.8.8.8:443';

    function fontSize() { return 14; }

    var columns = 0;
    var drops = [];

    function resize() {
      var fs = fontSize();
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.max(1, Math.floor(canvas.width / fs));
      drops = [];
      for (var i = 0; i < columns; i++) drops[i] = Math.random() * (canvas.height / fs);
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    var last = 0;
    function tick(now) {
      // Frame interval ~60ms (about 16fps for this effect — not too CPU-heavy)
      if (now - last < 60) { requestAnimationFrame(tick); return; }
      last = now;

      var fs = fontSize();
      // Trail fade — leaves a faint ghost trail as chars fall.
      ctx.fillStyle = 'rgba(5, 8, 16, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = fs + 'px JetBrains Mono, ui-monospace, monospace';
      ctx.textBaseline = 'top';

      for (var i = 0; i < drops.length; i++) {
        var x = i * fs;
        var y = drops[i] * fs;
        var ch = POOL.charAt(Math.floor(Math.random() * POOL.length));

        // Sparkle: 4% of chars render in bright color (#bbf7d0) and a bit larger glow.
        var sparkle = Math.random() < 0.04;
        if (sparkle) {
          ctx.fillStyle = '#bbf7d0';
          ctx.shadowColor = 'rgba(74, 222, 128, 0.95)';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = 'rgba(74, 222, 128, 0.78)';
          ctx.shadowBlur = 0;
        }
        ctx.fillText(ch, x, y);
        ctx.shadowBlur = 0;

        // Occasionally reset column to top so it starts over.
        if (y > canvas.height && Math.random() > 0.972) {
          drops[i] = 0;
        }
        drops[i] += 0.55; // fall speed
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
})();