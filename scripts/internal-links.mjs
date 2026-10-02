// scripts/internal-links.mjs
//
// Convert tool-name mentions in essay text to actual internal <a> links.
// Idempotent — won't double-wrap text that's already a link.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = 'F:\\.Projects\\sitetrace';

// (literal → URL) pairs. Matched in order; first match wins.
// Each pattern requires the literal to NOT already be wrapped in <a> tags
// (we use a negative lookbehind for `<a ...>` ... `</a>` patterns).
const LINKS = [
  { from: 'what-is-my-IP lookup tool',     to: 'what-is-my-IP' },
  { from: 'IP lookup tool',                to: 'IP lookup' },
  { from: 'IP reputation tool',            to: 'IP reputation' },
  { from: 'IP reputation check',           to: 'IP reputation' },
  { from: 'subnet calculator behind',      to: 'subnet calculator' },
  { from: 'subnet calculator',            to: '/subnet-calculator/' },
  { from: '/what-is-my-ip/',               to: 'What is my IP' },
  { from: '/is-it-down/',                  to: 'Is it down' },
  { from: '/network-tools/',               to: 'Network tools' },
  { from: '/ip-lookup/',                   to: 'IP lookup' },
  { from: '/ip-reputation/',               to: 'IP reputation' },
  { from: '/dns-tools/',                   to: 'DNS tools' },
  { from: '/dns-propagation-checker/',     to: 'DNS propagation' },
  { from: '/website-down-checker/',        to: 'Website down check' },
  { from: '/http-headers/',                to: 'HTTP headers' },
  { from: '/seo-checker/',                 to: 'SEO checker' },
  { from: '/email-deliverability/',        to: 'Email deliverability' },
  { from: '/vpn-checker/',                 to: 'VPN checker' },
  { from: '/subnet-calculator/',           to: 'Subnet calculator' },
  { from: '/ping/',                        to: 'Ping' },
];

const PAGES = [
  'subnet-calculator/index.html',
  'vpn-checker/index.html',
  'ip-lookup/index.html',
  'ip-reputation/index.html',
  'dns-tools/index.html',
  'dns-propagation-checker/index.html',
  'website-down-checker/index.html',
  'seo-checker/index.html',
  'http-headers/index.html',
  'email-deliverability/index.html',
  'ping/index.html',
  'api/index.html',
  'about/index.html',
  'blog/what-is-my-ip-address/index.html',
  'blog/how-to-read-ping-results/index.html',
  'blog/dns-propagation/index.html',
];

function makeLink(href, label) {
  return `<a href="${href}" class="source-link">${label}</a>`;
}

for (const page of PAGES) {
  const path = resolve(ROOT, page);
  let html = readFileSync(path, 'utf8');
  let totalReplaced = 0;

  // Each page shouldn't link to itself.
  const selfName = page.replace('/index.html', '');
  const filteredLinks = LINKS.filter(l => {
    if (page === 'is-it-down/index.html') return true;
    if (selfName === 'subnet-calculator' && (l.from.includes('subnet'))) return false;
    if (selfName === 'ip-lookup' && (l.from.includes('IP lookup') || l.from.includes('/ip-lookup'))) return false;
    if (selfName === 'ip-reputation' && (l.from.includes('IP reputation') || l.from.includes('/ip-reputation'))) return false;
    if (selfName === 'vpn-checker' && (l.from.includes('/vpn-checker') || l.from.includes('VPN checker'))) return false;
    if (selfName === 'dns-tools' && (l.from.includes('/dns-tools') || l.from.includes('DNS tools'))) return false;
    if (selfName === 'dns-propagation-checker' && (l.from.includes('/dns-propagation'))) return false;
    if (selfName === 'website-down-checker' && (l.from.includes('/website-down') || l.from.includes('Website down'))) return false;
    if (selfName === 'seo-checker' && (l.from.includes('/seo-checker') || l.from.includes('SEO checker'))) return false;
    if (selfName === 'http-headers' && (l.from.includes('/http-headers') || l.from.includes('HTTP headers'))) return false;
    if (selfName === 'email-deliverability' && (l.from.includes('/email-deliverability') || l.from.includes('Email deliverability'))) return false;
    if (selfName === 'ping' && (l.from.includes('/ping') || l.from.includes('Ping'))) return false;
    if (selfName === 'api' && (l.from.includes('/api') || l.from.includes('API'))) return false;
    return true;
  });

  // Don't link inside <head> / <style> / <svg> / <pre>
  // We mark these with a temporary safe-replace token, do work, restore
  const skipRegions = [];
  const SKIP_PATTERNS = [
    /<head[\s\S]*?<\/head>/g,
    /<style[\s\S]*?<\/style>/g,
    /<svg[\s\S]*?<\/svg>/g,
    /<pre[\s\S]*?<\/pre>/g,
    /<script[\s\S]*?<\/script>/g,
  ];
  let maskedHtml = html;
  let maskCount = 0;
  for (const pat of SKIP_PATTERNS) {
    maskedHtml = maskedHtml.replace(pat, (match) => {
      const token = `__SKIP_REGION_${maskCount++}__`;
      skipRegions.push({ token, match });
      return token;
    });
  }

  for (const { from, to } of filteredLinks) {
    // Match plain text, not already inside an <a> tag
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'g');
    maskedHtml = maskedHtml.replace(re, (match, offset, fullText) => {
      // Check 40 chars before for an open <a> tag without closing >
      const context = fullText.substring(Math.max(0, offset - 200), offset);
      // If there's an unclosed <a> in the context, skip
      const lastOpenA = context.lastIndexOf('<a ');
      const lastCloseA = context.lastIndexOf('</a>');
      if (lastOpenA > lastCloseA) return match;
      totalReplaced++;
      return makeLink(to, from);
    });
  }

  // Restore skipped regions
  let restoredHtml = maskedHtml;
  for (const { token, match } of skipRegions) {
    restoredHtml = restoredHtml.split(token).join(match);
  }

  if (totalReplaced > 0 && restoredHtml !== html) {
    writeFileSync(path, restoredHtml, 'utf8');
    console.log(`${page}: ${totalReplaced} links added`);
  } else {
    console.log(`${page}: no changes`);
  }
}