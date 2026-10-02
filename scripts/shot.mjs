// scripts/shot.mjs — one-shot puppeteer-core screenshot of a local URL via Edge CDP.
// Usage: node scripts/shot.mjs <url> <outputPath> [tabIndex] [height]
import puppeteer from 'puppeteer-core';

const [, , urlArg, outArg, tabArg = '50', heightArg = '1600'] = process.argv;
if (!urlArg || !outArg) {
  console.error('Usage: node scripts/shot.mjs <url> <outputPath> [tabIndex] [height]');
  process.exit(1);
}
const tabIndex = parseInt(tabArg, 10);
const height = parseInt(heightArg, 10);

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9223', defaultViewport: null });
const pages = await browser.pages();
const page = pages[tabIndex] || pages[0];
if (!page) { console.error('No tab available'); process.exit(2); }
await page.setViewport({ width: 1280, height, deviceScaleFactor: 1 });
await page.goto(urlArg, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: outArg, fullPage: true });
console.log('Saved', outArg);
await browser.disconnect();