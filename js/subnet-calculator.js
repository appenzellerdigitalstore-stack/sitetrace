// SiteTrace — Subnet calculator page logic
// Pure client-side. Parses CIDR, computes every value a network engineer
// typically needs (network, broadcast, usable range, host count, mask,
// wildcard, IP class, binary breakdown), renders it.
//
// All math is integer-only using 32-bit signed JS numbers, but we treat
// the top bit as a sign carefully. To avoid signed-bit weirdness, every
// value that represents a 32-bit IPv4 address is stored as a positive
// uint32 computed from the input octets (which are 0–255 each, so the
// high bit is naturally not set for normal addresses).

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

  // ---- parsing ----------------------------------------------------
  // Accepts "10.0.0.0/8", "192.168.1.5/24" (host bits are normalized to
  // network), or "192.168.1.0" (defaults to /32). Returns either
  // { ok: true, ip, prefix } or { ok: false, errorKey }.
  function parseCidr(input) {
    const raw = (input || '').trim();
    if (!raw) return { ok: false, errorKey: 'snc_error_empty' };

    let body = raw, prefix = null;
    if (raw.indexOf('/') !== -1) {
      const idx = raw.indexOf('/');
      body = raw.slice(0, idx).trim();
      const pStr = raw.slice(idx + 1).trim();
      if (!/^\d{1,2}$/.test(pStr)) return { ok: false, errorKey: 'snc_error_prefix' };
      prefix = parseInt(pStr, 10);
      if (prefix < 0 || prefix > 32) return { ok: false, errorKey: 'snc_error_prefix' };
    }

    const parts = body.split('.');
    if (parts.length !== 4) return { ok: false, errorKey: 'snc_error_octets' };
    const oct = [];
    for (const p of parts) {
      if (!/^\d{1,3}$/.test(p)) return { ok: false, errorKey: 'snc_error_octets' };
      const n = parseInt(p, 10);
      if (n < 0 || n > 255) return { ok: false, errorKey: 'snc_error_octets' };
      oct.push(n);
    }

    // Default prefix: /32 (single host) if the user typed a bare address.
    if (prefix === null) prefix = 32;

    return { ok: true, octets: oct, prefix: prefix };
  }

  // ---- math -------------------------------------------------------
  function octetsToUint(o) {
    // 0 <= o[i] <= 255 — sum fits safely in 32 bits unsigned.
    return ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
  }
  function uintToOctets(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  }
  function uintToDotted(n) { const o = uintToOctets(n); return o.join('.'); }
  function uintToBinary(n) {
    const o = uintToOctets(n);
    return o.map(function (b) { return b.toString(2).padStart(8, '0'); }).join('.');
  }
  function prefixToMaskUint(prefix) {
    if (prefix === 0) return 0;
    return (0xFFFFFFFF << (32 - prefix)) >>> 0;
  }
  function wildcardFromMask(mask) {
    return ((~mask) >>> 0);
  }
  function ipClass(firstOctet) {
    if (firstOctet < 128) return 'A';
    if (firstOctet < 192) return 'B';
    if (firstOctet < 224) return 'C';
    if (firstOctet < 240) return 'D';
    return 'E';
  }
  function ipClassType(c) {
    if (c === 'A') return 'snc_class_a';
    if (c === 'B') return 'snc_class_b';
    if (c === 'C') return 'snc_class_c';
    if (c === 'D') return 'snc_class_d';
    return 'snc_class_e';
  }
  function ipClassDesc(c) {
    if (c === 'A') return 'snc_class_a_desc';
    if (c === 'B') return 'snc_class_b_desc';
    if (c === 'C') return 'snc_class_c_desc';
    if (c === 'D') return 'snc_class_d_desc';
    return 'snc_class_e_desc';
  }

  function compute(input) {
    const ip = octetsToUint(input.octets);
    const prefix = input.prefix;
    const mask = prefixToMaskUint(prefix);
    const network = (ip & mask) >>> 0;
    const wildcard = wildcardFromMask(mask);
    const broadcast = (network | wildcard) >>> 0;
    const hostBits = 32 - prefix;
    // Math.pow(2, 32) is exactly 4294967296 in JS, so we don't need a
    // special case here. /0 -> 2^32 addresses, /32 -> 2^0 = 1 address.
    const totalAddresses = Math.pow(2, hostBits);
    // Usable hosts:
    //   /32 -> 1 (the host itself, no network/broadcast reserved)
    //   /31 -> 2 (RFC 3021: both addresses are usable)
    //   else -> total - 2 (network and broadcast addresses)
    let usableHosts;
    if (prefix === 32) usableHosts = 1;
    else if (prefix === 31) usableHosts = 2;
    else usableHosts = Math.max(0, totalAddresses - 2);
    const firstUsable = (prefix >= 31) ? network : ((network + 1) >>> 0);
    const lastUsable  = (prefix >= 31) ? broadcast : ((broadcast - 1) >>> 0);

    return {
      input: input,
      ip: ip,
      prefix: prefix,
      mask: mask,
      network: network,
      broadcast: broadcast,
      firstUsable: firstUsable,
      lastUsable: lastUsable,
      totalAddresses: totalAddresses,
      usableHosts: usableHosts,
      wildcard: wildcard,
      ipClass: ipClass(input.octets[0]),
      // binary forms
      ipBin: uintToBinary(ip),
      maskBin: uintToBinary(mask),
      networkBin: uintToBinary(network),
      broadcastBin: uintToBinary(broadcast),
      wildcardBin: uintToBinary(wildcard),
    };
  }

  // ---- rendering --------------------------------------------------
  function renderResult(r) {
    $('snc-form-card').classList.add('hidden');
    $('snc-error').classList.add('hidden');
    $('snc-result').classList.remove('hidden');

    // Pick the "main" usable-range label based on prefix
    const rangeLabel = (r.prefix === 32)
      ? t('snc_single_host')
      : (r.prefix === 31)
        ? t('snc_p2p_range')
        : t('snc_usable_range');

    const html = ''
      + '<div class="card">'
      + '  <div class="flex flex-wrap items-center justify-between gap-3">'
      + '    <div>'
      + '      <div class="text-xs text-slate-500">' + escapeHtml(t('snc_results_for')) + '</div>'
      + '      <div class="text-base sm:text-lg font-mono font-semibold break-all">' + escapeHtml(r.input.octets.join('.')) + ' / ' + r.prefix + '</div>'
      + '      <div class="mt-1 text-xs text-slate-500">' + escapeHtml(t('snc_class') + ': ' + t(ipClassType(r.ipClass))) + '</div>'
      + '    </div>'
      + '    <div class="text-right">'
      + '      <div class="text-xs text-slate-500">' + escapeHtml(t('snc_usable_hosts')) + '</div>'
      + '      <div class="text-3xl font-extrabold text-brand-300">' + r.usableHosts.toLocaleString() + '</div>'
      + '      <div class="text-[10px] text-slate-500 mt-1">' + escapeHtml(t('snc_total') + ' ' + r.totalAddresses.toLocaleString()) + '</div>'
      + '    </div>'
      + '  </div>'
      + '</div>'

      + '<div class="card">'
      + '  <h2 class="text-lg font-bold mb-3">' + escapeHtml(t('snc_addresses_h2')) + '</h2>'
      + '  <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">'
      + '    <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('snc_network')) + '</dt><dd class="font-mono">' + escapeHtml(uintToDotted(r.network)) + '</dd></div>'
      + '    <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('snc_broadcast')) + '</dt><dd class="font-mono">' + escapeHtml(uintToDotted(r.broadcast)) + '</dd></div>'
      + '    <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('snc_first_usable')) + '</dt><dd class="font-mono">' + escapeHtml(uintToDotted(r.firstUsable)) + '</dd></div>'
      + '    <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('snc_last_usable')) + '</dt><dd class="font-mono">' + escapeHtml(uintToDotted(r.lastUsable)) + '</dd></div>'
      + '    <div class="sm:col-span-2"><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(rangeLabel) + '</dt><dd class="font-mono break-all">' + escapeHtml(uintToDotted(r.firstUsable) + ' — ' + uintToDotted(r.lastUsable)) + '</dd></div>'
      + '  </dl>'
      + '</div>'

      + '<div class="grid lg:grid-cols-2 gap-5">'
      + '  <div class="card">'
      + '    <h2 class="text-lg font-bold mb-3">' + escapeHtml(t('snc_masks_h2')) + '</h2>'
      + '    <dl class="grid grid-cols-1 gap-3 text-sm">'
      + '      <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('snc_subnet_mask')) + '</dt><dd class="font-mono">' + escapeHtml(uintToDotted(r.mask)) + '</dd></div>'
      + '      <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('snc_wildcard_mask')) + '</dt><dd class="font-mono">' + escapeHtml(uintToDotted(r.wildcard)) + '</dd></div>'
      + '      <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('snc_cidr')) + '</dt><dd class="font-mono">/' + r.prefix + '</dd></div>'
      + '    </dl>'
      + '  </div>'
      + '  <div class="card">'
      + '    <h2 class="text-lg font-bold mb-3">' + escapeHtml(t('snc_class_h2')) + '</h2>'
      + '    <dl class="grid grid-cols-1 gap-3 text-sm">'
      + '      <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('snc_class')) + '</dt><dd class="font-mono">' + escapeHtml(r.ipClass) + ' — ' + escapeHtml(t(ipClassType(r.ipClass))) + '</dd></div>'
      + '      <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('snc_total_hosts')) + '</dt><dd class="font-mono">' + r.totalAddresses.toLocaleString() + '</dd></div>'
      + '      <div><dt class="text-slate-500 text-xs mb-1">' + escapeHtml(t('snc_usable_hosts')) + '</dt><dd class="font-mono">' + r.usableHosts.toLocaleString() + '</dd></div>'
      + '    </dl>'
      + '  </div>'
      + '</div>'

      + '<div class="card">'
      + '  <h2 class="text-lg font-bold mb-3">' + escapeHtml(t('snc_binary_h2')) + '</h2>'
      + '  <dl class="grid grid-cols-1 gap-3 text-xs font-mono break-all">'
      + '    <div><dt class="text-slate-500 text-xs mb-1 not-italic font-sans">' + escapeHtml(t('snc_ip')) + '</dt><dd class="text-slate-300">' + escapeHtml(r.ipBin) + '</dd></div>'
      + '    <div><dt class="text-slate-500 text-xs mb-1 not-italic font-sans">' + escapeHtml(t('snc_subnet_mask')) + '</dt><dd class="text-slate-300">' + escapeHtml(r.maskBin) + '</dd></div>'
      + '    <div><dt class="text-slate-500 text-xs mb-1 not-italic font-sans">' + escapeHtml(t('snc_network')) + '</dt><dd class="text-slate-300">' + escapeHtml(r.networkBin) + '</dd></div>'
      + '    <div><dt class="text-slate-500 text-xs mb-1 not-italic font-sans">' + escapeHtml(t('snc_broadcast')) + '</dt><dd class="text-slate-300">' + escapeHtml(r.broadcastBin) + '</dd></div>'
      + '  </dl>'
      + '</div>'

      + '<div class="flex flex-wrap gap-2 justify-center">'
      + '  <button id="snc-recalc" type="button" class="btn-ghost">' + escapeHtml(t('snc_recalc')) + '</button>'
      + '  <button id="snc-copy" type="button" class="btn-ghost">' + escapeHtml(t('snc_copy')) + '</button>'
      + '</div>';

    $('snc-result').innerHTML = html;

    const re = $('snc-recalc');
    if (re) re.addEventListener('click', function () {
      $('snc-result').classList.add('hidden');
      $('snc-form-card').classList.remove('hidden');
      const input = $('snc-input');
      if (input) { input.value = ''; input.focus(); }
    });
    const cp = $('snc-copy');
    if (cp) cp.addEventListener('click', function () {
      const text = r.input.octets.join('.') + ' /' + r.prefix + '\n'
        + 'Network: ' + uintToDotted(r.network) + '\n'
        + 'Broadcast: ' + uintToDotted(r.broadcast) + '\n'
        + 'Usable: ' + uintToDotted(r.firstUsable) + ' — ' + uintToDotted(r.lastUsable) + '\n'
        + 'Usable hosts: ' + r.usableHosts + '\n'
        + 'Subnet mask: ' + uintToDotted(r.mask) + '\n'
        + 'Wildcard: ' + uintToDotted(r.wildcard) + '\n'
        + 'Class: ' + r.ipClass;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { showToast(t('snc_copy') + ' ✓'); }).catch(function () {});
      }
    });
  }

  function showError(key) {
    $('snc-form-card').classList.add('hidden');
    $('snc-result').classList.add('hidden');
    $('snc-error').classList.remove('hidden');
    const el = $('snc-error-msg');
    if (el) el.textContent = t(key || 'snc_error');
  }

  function showForm() {
    $('snc-error').classList.add('hidden');
    $('snc-result').classList.add('hidden');
    $('snc-form-card').classList.remove('hidden');
  }

  function calculate(input) {
    const parsed = parseCidr(input);
    if (!parsed.ok) { showError(parsed.errorKey); return; }
    const r = compute(parsed);
    renderResult(r);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const form = $('snc-form');
    const input = $('snc-input');
    if (form && input) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        calculate(input.value);
      });
      // Auto-focus the input on first paint.
      input.focus();
    }
    document.querySelectorAll('.snc-preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const cidr = btn.getAttribute('data-cidr');
        if (input) input.value = cidr;
        calculate(cidr);
      });
    });
  });
})();
