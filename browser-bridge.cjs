/* =============================================================
 * SiteTrace — Browser Bridge
 * Drives the user's existing Chrome over CDP. No password is
 * ever seen by this script — the user keeps their session,
 * cookies, and credentials in their own browser window.
 *
 * Usage:
 *   1. Launch Chrome with remote debugging:
 *        chrome.exe --remote-debugging-port=9222 --remote-allow-origins=*
 *   2. Run any command:
 *        node browser-bridge.cjs <command> [args...]
 *
 * Commands:
 *   status                              Check CDP connection, list tabs
 *   open <url>                          Open a new tab at <url>
 *   goto <url>                          Navigate the active tab to <url>
 *   tabs                                List all open tabs
 *   focus <index>                       Bring tab <index> to the front
 *   close [index]                       Close the active (or given) tab
 *   click <selector>                    Click the first matching element
 *   type <selector> <text>              Type <text> into a field
 *   fill <selector> <text>              Clear and fill a field
 *   text <selector>                     Print the textContent of an element
 *   html <selector>                     Print the innerHTML of an element
 *   attr <selector> <name>              Print an attribute of an element
 *   eval <js-expression>                Run JS in the page, print the result
 *   shot <file.png>                     Save a screenshot of the active tab
 *   wait <selector> [timeoutMs]         Wait for a selector to appear
 *   url                                 Print the current URL
 *   title                               Print the current page title
 * ============================================================= */
'use strict';

const fs   = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CDP_URL  = process.env.CDP_URL  || 'http://127.0.0.1:9222';
const ACTIVE   = { index: 0 };

function out(obj) {
  // Always print JSON on the last line so it is easy to parse.
  process.stdout.write(typeof obj === 'string' ? obj + '\n' : JSON.stringify(obj) + '\n');
}

function err(msg, code) {
  process.stderr.write('[bridge] ' + msg + '\n');
  process.exit(code || 1);
}

async function connect() {
  try {
    return await puppeteer.connect({ browserURL: CDP_URL, defaultViewport: null });
  } catch (e) {
    err('Cannot connect to Chrome at ' + CDP_URL + '.\n' +
        'Launch Chrome first, e.g.:\n' +
        '  & "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222 --remote-allow-origins=*\n' +
        'Original error: ' + e.message, 2);
  }
}

async function getPage(browser) {
  const arr = await browser.pages();
  if (!arr.length) throw new Error('No tabs');
  return arr[ACTIVE.index] || arr[0];
}

async function requirePage(browser) {
  const p = await getPage(browser);
  if (!p) err('No active tab.', 3);
  return p;
}

// Tiny arg parser: first token is command, rest are positional
function parseArgs(argv) {
  const cmd = argv[0];
  const rest = argv.slice(1);
  return { cmd, rest };
}

function usage() {
  const help = [
    'Usage:',
    '  node browser-bridge.cjs <command> [args...]',
    '',
    'Commands:',
    '  status                              Check CDP connection, list tabs',
    '  open <url>                          Open a new tab at <url>',
    '  goto <url>                          Navigate the active tab to <url>',
    '  tabs                                List all open tabs',
    '  focus <index>                       Bring tab <index> to the front',
    '  close [index]                       Close the active (or given) tab',
    '  click <selector>                    Click the first matching element',
    '  type <selector> <text>              Type <text> into a field',
    '  fill <selector> <text>              Clear and fill a field',
    '  text <selector>                     Print the textContent of an element',
    '  html <selector>                     Print the innerHTML of an element',
    '  attr <selector> <name>              Print an attribute of an element',
    '  eval <js-expression>                Run JS in the page, print the result',
    '  shot <file.png>                     Save a screenshot of the active tab',
    '  wait <selector> [timeoutMs]         Wait for a selector to appear',
    '  url                                 Print the current URL',
    '  title                               Print the current page title',
    '',
    'Set CDP_URL env var to override the default (http://127.0.0.1:9222).',
  ].join('\n');
  err(help, 64);
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv[0] === '-h' || argv[0] === '--help') usage();
  const { cmd, rest } = parseArgs(argv);

  const browser = await connect();

  switch (cmd) {
    case 'status': {
      const pages = await browser.pages();
      const tabs = [];
      for (let i = 0; i < pages.length; i++) {
        tabs.push({ index: i, url: pages[i].url(), title: await pages[i].title() });
      }
      out({ connected: true, target: CDP_URL, activeIndex: ACTIVE.index, tabs });
      break;
    }
    case 'tabs': {
      const pages = await browser.pages();
      const tabs = [];
      for (let i = 0; i < pages.length; i++) {
        tabs.push({ index: i, url: pages[i].url(), title: await pages[i].title() });
      }
      out(tabs);
      break;
    }
    case 'open': {
      const url = rest[0];
      if (!url) err('open: <url> required');
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const pages = await browser.pages();
      ACTIVE.index = pages.indexOf(page);
      out({ ok: true, index: ACTIVE.index, url: page.url(), title: await page.title() });
      break;
    }
    case 'goto': {
      const url = rest[0];
      if (!url) err('goto: <url> required');
      const page = await requirePage(browser);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      out({ ok: true, url: page.url(), title: await page.title() });
      break;
    }
    case 'focus': {
      const idx = parseInt(rest[0], 10);
      if (isNaN(idx)) err('focus: <index> required');
      const pages = await browser.pages();
      if (idx < 0 || idx >= pages.length) err('focus: index out of range');
      await pages[idx].bringToFront();
      ACTIVE.index = idx;
      out({ ok: true, index: idx, url: pages[idx].url() });
      break;
    }
    case 'close': {
      const idx = rest[0] != null ? parseInt(rest[0], 10) : ACTIVE.index;
      const pages = await browser.pages();
      if (isNaN(idx) || idx < 0 || idx >= pages.length) err('close: invalid index');
      await pages[idx].close();
      const after = await browser.pages();
      if (ACTIVE.index >= after.length) ACTIVE.index = Math.max(0, after.length - 1);
      out({ ok: true, closed: idx, remaining: after.length });
      break;
    }
    case 'click': {
      const sel = rest[0];
      if (!sel) err('click: <selector> required');
      const page = await requirePage(browser);
      await page.waitForSelector(sel, { timeout: 15000 });
      await page.click(sel);
      out({ ok: true, clicked: sel });
      break;
    }
    case 'type': {
      const sel = rest[0];
      const allPages = await browser.pages();
      const numArg = rest.find((a) => /^\d+$/.test(a));
      const tabIdx = numArg != null ? parseInt(numArg, 10) : NaN;
      const text = rest.slice(1).filter((a, i, arr) => !(numArg != null && a === numArg)).join(' ');
      if (!sel || !text) err('type: <selector> <text...> required');
      const page = (!isNaN(tabIdx) && allPages[tabIdx]) ? allPages[tabIdx] : (await requirePage(browser));
      await page.waitForSelector(sel, { timeout: 15000 });
      await page.type(sel, text, { delay: 12 });
      out({ ok: true, typed: text, into: sel, tabIndex: allPages.indexOf(page) });
      break;
    }
    case 'fill': {
      const sel = rest[0];
      const allPages = await browser.pages();
      const numArg = rest.find((a) => /^\d+$/.test(a));
      const tabIdx = numArg != null ? parseInt(numArg, 10) : NaN;
      const text = rest.slice(1).filter((a, i, arr) => !(numArg != null && a === numArg)).join(' ');
      if (!sel || !text) err('fill: <selector> <text...> required');
      const page = (!isNaN(tabIdx) && allPages[tabIdx]) ? allPages[tabIdx] : (await requirePage(browser));
      await page.waitForSelector(sel, { timeout: 15000 });
      const handle = await page.$(sel);
      await handle.evaluate((el) => { el.value = ''; });
      await handle.type(text, { delay: 8 });
      out({ ok: true, filled: text, into: sel, tabIndex: allPages.indexOf(page) });
      break;
    }
    case 'text': {
      const sel = rest[0];
      if (!sel) err('text: <selector> required');
      const allPages = await browser.pages();
      const numArg = rest.find((a) => /^\d+$/.test(a));
      const tabIdx = numArg != null ? parseInt(numArg, 10) : NaN;
      const page = (!isNaN(tabIdx) && allPages[tabIdx]) ? allPages[tabIdx] : (await requirePage(browser));
      await page.waitForSelector(sel, { timeout: 15000 });
      const t = await page.$eval(sel, (el) => el.textContent);
      out(t);
      break;
    }
    case 'html': {
      const sel = rest[0];
      if (!sel) err('html: <selector> required');
      const allPages = await browser.pages();
      const numArg = rest.find((a) => /^\d+$/.test(a));
      const tabIdx = numArg != null ? parseInt(numArg, 10) : NaN;
      const page = (!isNaN(tabIdx) && allPages[tabIdx]) ? allPages[tabIdx] : (await requirePage(browser));
      await page.waitForSelector(sel, { timeout: 15000 });
      const t = await page.$eval(sel, (el) => el.innerHTML);
      out(t);
      break;
    }
    case 'attr': {
      const sel = rest[0];
      const name = rest[1];
      if (!sel || !name) err('attr: <selector> <name> required');
      const allPages = await browser.pages();
      const numArg = rest.find((a) => /^\d+$/.test(a));
      const tabIdx = numArg != null ? parseInt(numArg, 10) : NaN;
      const page = (!isNaN(tabIdx) && allPages[tabIdx]) ? allPages[tabIdx] : (await requirePage(browser));
      await page.waitForSelector(sel, { timeout: 15000 });
      const t = await page.$eval(sel, (el, n) => el.getAttribute(n), name);
      out(t);
      break;
    }
    case 'eval': {
      let expr = rest.join(' ');
      if (!expr) err('eval: <js-expression> required');
      // Allow: eval --tab <index> <expression>  or  eval <expr> <index>
      const allPages = await browser.pages();
      const numArg = rest.find((a) => /^\d+$/.test(a));
      let page;
      if (numArg != null) {
        const idx = parseInt(numArg, 10);
        if (isNaN(idx) || !allPages[idx]) err('eval: invalid tab index ' + idx);
        page = allPages[idx];
        // Strip the index from the expression
        expr = rest.filter((a) => !/^\d+$/.test(a)).join(' ');
      } else {
        page = await requirePage(browser);
      }
      const r = await page.evaluate((src) => {
        // eslint-disable-next-line no-new-func
        const fn = new Function('return (' + src + ');');
        try { return fn(); } catch (e) { return '[threw: ' + e.message + ']'; }
      }, expr);
      out(r);
      break;
    }
    case 'shot': {
      const outPath = rest[0];
      if (!outPath) err('shot: <file.png> required');
      const abs = path.resolve(outPath);
      // Optional: a numeric arg anywhere in `rest` picks that tab index
      const allPages = await browser.pages();
      const numArg = rest.find((a) => /^\d+$/.test(a));
      const tabIdx = numArg != null ? parseInt(numArg, 10) : NaN;
      const page = (!isNaN(tabIdx) && allPages[tabIdx]) ? allPages[tabIdx] : (await getPage(browser));
      await page.screenshot({ path: abs, fullPage: false });
      out({ ok: true, file: abs, tabIndex: allPages.indexOf(page) });
      break;
    }
    case 'wait': {
      const sel = rest[0];
      const timeout = parseInt(rest[1], 10) || 15000;
      if (!sel) err('wait: <selector> [timeoutMs] required');
      const page = await requirePage(browser);
      await page.waitForSelector(sel, { timeout });
      out({ ok: true, found: sel });
      break;
    }
    case 'url': {
      const page = await requirePage(browser);
      out(page.url());
      break;
    }
    case 'title': {
      const page = await requirePage(browser);
      out(await page.title());
      break;
    }
    default:
      err('Unknown command: ' + cmd + '\nRun without args to see usage.', 64);
  }

  await browser.disconnect();
}

main().catch((e) => err(e && e.message ? e.message : String(e), 1));
