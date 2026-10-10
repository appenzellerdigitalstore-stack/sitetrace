// Capture screenshots of the new blog index and a guide page using the
// headless Edge DevTools protocol connection on ws://127.0.0.1:9223.
import { writeFile } from "node:fs/promises";
import { WebSocket } from "ws";

const targets = [
  { url: "http://127.0.0.1:4173/blog", out: "F:/.Projects/sitetrace/.verify/blog-index.png" },
  { url: "http://127.0.0.1:4173/blog/ip-lookup", out: "F:/.Projects/sitetrace/.verify/blog-ip-lookup.png" },
  { url: "http://127.0.0.1:4173/blog/what-is-my-ip", out: "F:/.Projects/sitetrace/.verify/blog-what-is-my-ip.png" },
];

// Connect to the existing Edge DevTools instance.
const list = await fetch("http://127.0.0.1:9223/json").then(r => r.json());
const page = list.find(t => t.type === "page") || list[0];
if (!page) throw new Error("No browser targets on 9223");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, fail) => { ws.once("open", ok); ws.once("error", fail); });

let id = 0;
const pending = new Map();
ws.on("message", m => {
  const msg = JSON.parse(m.toString());
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const i = ++id;
  pending.set(i, { resolve, reject });
  ws.send(JSON.stringify({ id: i, method, params }));
});

await send("Page.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });

for (const { url, out } of targets) {
  console.log("Visiting", url);
  const navP = new Promise(resolve => {
    const handler = m => {
      const msg = JSON.parse(m.toString());
      if (msg.method === "Page.loadEventFired") { ws.off("message", handler); resolve(); }
    };
    ws.on("message", handler);
  });
  await send("Page.navigate", { url });
  await navP;
  // Give React a moment to render + images to lazy-load
  await new Promise(r => setTimeout(r, 1500));
  // Scroll to trigger lazy images
  await send("Runtime.evaluate", { expression: "window.scrollTo(0, document.body.scrollHeight);" });
  await new Promise(r => setTimeout(r, 600));
  await send("Runtime.evaluate", { expression: "window.scrollTo(0, 0);" });
  await new Promise(r => setTimeout(r, 400));
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(out, Buffer.from(data, "base64"));
  console.log("  wrote", out);
}
ws.close();
console.log("done");
