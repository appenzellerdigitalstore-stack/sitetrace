// Fetch the 21 blog guide images from the Lovable CDN into public/blog-images/.
// Asset metadata was extracted from src/assets/blog/<slug>.jpg.asset.json in
// the falling-code-sparkle repo (commit ae4758f).
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "blog-images");
await mkdir(outDir, { recursive: true });

const base = "https://falling-code-sparkle.lovable.app/__l5e/assets-v1";
// slug, asset_id, original_filename
const assets = [
  ["bulk-url-status", "TBD", "guide-bulk-url-status.jpg"],
  ["dns-lookup", "TBD", "guide-dns-lookup.jpg"],
  ["dns-propagation", "TBD", "guide-dns-propagation.jpg"],
  ["email-deliverability", "TBD", "guide-email-deliverability.jpg"],
  ["http-headers", "TBD", "guide-http-headers.jpg"],
  ["ip-lookup", "49bfea72-cb9f-4a0a-a248-5eac7e5ffde0", "guide-ip-lookup.jpg"],
  ["ip-reputation", "TBD", "guide-ip-reputation.jpg"],
  ["is-it-down", "TBD", "guide-is-it-down.jpg"],
  ["open-graph-preview", "TBD", "guide-open-graph-preview.jpg"],
  ["password-generator", "TBD", "guide-password-generator.jpg"],
  ["ping-test", "TBD", "guide-ping-test.jpg"],
  ["port-check", "TBD", "guide-port-check.jpg"],
  ["random-color", "TBD", "guide-random-color.jpg"],
  ["security-headers", "TBD", "guide-security-headers.jpg"],
  ["seo-checker", "TBD", "guide-seo-checker.jpg"],
  ["smart-dispatcher", "TBD", "guide-smart-dispatcher.jpg"],
  ["ssl-certificate", "TBD", "guide-ssl-certificate.jpg"],
  ["subnet-calculator", "TBD", "guide-subnet-calculator.jpg"],
  ["traceroute", "TBD", "guide-traceroute.jpg"],
  ["vpn-check", "TBD", "guide-vpn-check.jpg"],
  ["word-counter", "TBD", "guide-word-counter.jpg"],
];

// We need to discover the asset_id for each .json metadata file. Walk the
// cloned source repo and read each .asset.json to grab (asset_id, original_filename).
import { readdir, readFile } from "node:fs/promises";
import { join as pathJoin } from "node:path";

const SRC = "F:/.Projects/falling-code-sparkle/src/assets/blog";
let resolved;
try {
  const entries = await readdir(SRC);
  resolved = {};
  for (const f of entries) {
    if (!f.endsWith(".asset.json")) continue;
    const slug = f.replace(".jpg.asset.json", "");
    const txt = await readFile(pathJoin(SRC, f), "utf8");
    const j = JSON.parse(txt);
    resolved[slug] = { id: j.asset_id, name: j.original_filename };
  }
} catch (e) {
  console.error("Failed to read source asset metadata:", e.message);
  process.exit(1);
}

let ok = 0, fail = 0;
for (const [slug, _tbd, fallback] of assets) {
  const meta = resolved[slug];
  if (!meta) {
    console.error(`No asset metadata for ${slug}`);
    fail++;
    continue;
  }
  const url = `${base}/${meta.id}/${meta.name}`;
  const dest = join(outDir, `${slug}.jpg`);
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) {
      console.error(`${slug}: HTTP ${res.status} ${url}`);
      fail++;
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, buf);
    console.log(`${slug}: ${buf.length} bytes`);
    ok++;
  } catch (e) {
    console.error(`${slug}: ${e.message}`);
    fail++;
  }
}
console.log(`\nDone. ${ok} ok, ${fail} fail.`);
process.exit(fail === 0 ? 0 : 1);
