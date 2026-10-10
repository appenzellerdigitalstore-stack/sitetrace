// Diff class selectors between lovable and public sitetrace styles.css
import { readFile } from "node:fs/promises";

const lovable = await readFile("F:/.Projects/falling-code-sparkle/src/styles.css", "utf8");
const pub = await readFile("F:/.Projects/sitetrace/src/styles.css", "utf8");

function classes(text) {
  const out = new Set();
  for (const m of text.matchAll(/^\.([a-zA-Z0-9_-]+)/gm)) out.add(m[1]);
  return out;
}

const l = classes(lovable);
const p = classes(pub);
const onlyLovable = [...l].filter(c => !p.has(c)).sort();
const onlyPublic = [...p].filter(c => !l.has(c)).sort();
console.log("Only in lovable (need to add to public):");
onlyLovable.forEach(c => console.log("  ." + c));
console.log("\nOnly in public (lovable doesn't have these):");
onlyPublic.forEach(c => console.log("  ." + c));
