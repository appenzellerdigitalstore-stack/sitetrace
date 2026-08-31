// Bulk-apply og:image, og:image:width/height/alt, and Twitter Card meta
// tags to every HTML page in the site. Idempotent — safe to re-run.
//
// Mapping: each HTML path -> og:image filename under /og/

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Maps a path-under-root to the og-image slug, the page title (for the alt
// tag), and whether to skip the page (e.g. utility pages like /about/).
const PAGES = {
  'index.html':                       { slug: 'home',                       title: 'SiteTrace — five free network tools' },
  'what-is-my-ip/index.html':         { slug: 'what-is-my-ip',              title: 'What is my IP address?' },
  'ip-lookup/index.html':             { slug: 'ip-lookup',                  title: 'IP address lookup' },
  'ping/index.html':                  { slug: 'ping',                       title: 'Domain inspector' },
  'dns-tools/index.html':             { slug: 'dns-tools',                  title: 'DNS lookup' },
  'dns-propagation-checker/index.html': { slug: 'dns-propagation-checker', title: 'DNS propagation checker' },
  'is-it-down/index.html':            { slug: 'is-it-down',                 title: 'Is it down for me?' },
  'website-down-checker/index.html':  { slug: 'website-down-checker',       title: 'Website down checker' },
  'network-tools/index.html':         { slug: 'network-tools',              title: 'Free network tools' },
  'vpn-checker/index.html':           { slug: 'vpn-checker',                title: 'VPN checker' },
  'seo-checker/index.html':           { slug: 'seo-checker',                title: 'Free SEO checker' },
  'blog/index.html':                  { slug: 'blog',                       title: 'SiteTrace blog — networking, explained' },
  'blog/dns-propagation/index.html':  { slug: 'blog-dns-propagation',       title: 'What is DNS propagation?' },
  'blog/what-is-my-ip-address/index.html': { slug: 'blog-what-is-my-ip',    title: 'What is my IP address?' },
  'blog/how-to-read-ping-results/index.html': { slug: 'blog-how-to-read-ping', title: 'How to read a ping test' },
  // about and privacy intentionally skipped — no og:image, no twitter card.
};

const OG_BASE = 'https://sitetrace.it.com/og/';

function applyToFile(relPath, page) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) { console.error('  missing: ' + relPath); return; }
  let src = fs.readFileSync(full, 'utf8');
  const before = src;

  // 1. og:image — insert after the last existing og: meta (typically og:description).
  //    Idempotent: skip if already present.
  const ogImageUrl = OG_BASE + page.slug + '.png';
  const ogImageAlt = page.title + ' — SiteTrace';

  if (!/<meta\s+property=["']og:image["']/i.test(src)) {
    const ogBlock =
      '<meta property="og:image" content="' + ogImageUrl + '" />\n  ' +
      '<meta property="og:image:width" content="1200" />\n  ' +
      '<meta property="og:image:height" content="630" />\n  ' +
      '<meta property="og:image:alt" content="' + ogImageAlt + '" />\n  ' +
      '<meta property="og:image:type" content="image/png" />';
    // Insert after the og:description line if present, else after og:url, else
    // before </head>.
    const afterDesc = src.match(/(\s*<meta property="og:description"[^>]*\/?>\s*)/i);
    const afterUrl  = src.match(/(\s*<meta property="og:url"[^>]*\/?>\s*)/i);
    if (afterDesc) {
      src = src.replace(afterDesc[0], afterDesc[0] + ogBlock + '\n  ');
    } else if (afterUrl) {
      src = src.replace(afterUrl[0], afterUrl[0] + ogBlock + '\n  ');
    } else {
      src = src.replace(/(\s*<\/head>)/, '\n  ' + ogBlock + '$1');
    }
  }

  // 2. Twitter Card — add twitter:card, twitter:title, twitter:description,
  //    twitter:image if any of them is missing.
  const needsCard = !/<meta\s+name=["']twitter:card["']/i.test(src);
  if (needsCard) {
    // Try to grab og:title/og:description for sensible defaults
    const ogTitleMatch = src.match(/<meta property="og:title" content="([^"]*)"/);
    const ogDescMatch  = src.match(/<meta property="og:description" content="([^"]*)"/);
    const fallbackTitle = page.title;
    const fallbackDesc = page.title + ' — Free, no signup, no tracking.';
    const tTitle = ogTitleMatch ? ogTitleMatch[1] : fallbackTitle;
    const tDesc  = ogDescMatch  ? ogDescMatch[1]  : fallbackDesc;

    const twitterBlock =
      '<meta name="twitter:card" content="summary_large_image" />\n  ' +
      '<meta name="twitter:title" content="' + tTitle + '" />\n  ' +
      '<meta name="twitter:description" content="' + tDesc + '" />\n  ' +
      '<meta name="twitter:image" content="' + ogImageUrl + '" />\n  ' +
      '<meta name="twitter:image:alt" content="' + ogImageAlt + '" />';
    // Insert after the og:image block we just added, or at end of head.
    const afterOgImage = src.match(/(\s*<meta property="og:image:type"[^>]*\/?>\s*)/i);
    if (afterOgImage) {
      src = src.replace(afterOgImage[0], afterOgImage[0] + twitterBlock + '\n  ');
    } else {
      src = src.replace(/(\s*<\/head>)/, '\n  ' + twitterBlock + '$1');
    }
  }

  if (src !== before) {
    fs.writeFileSync(full, src);
    console.log('  updated: ' + relPath);
  } else {
    console.log('  unchanged: ' + relPath);
  }
}

console.log('Applying og:image + Twitter Card to ' + Object.keys(PAGES).length + ' pages...');
for (const [relPath, page] of Object.entries(PAGES)) {
  applyToFile(relPath, page);
}
console.log('Done.');
