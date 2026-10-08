// Blog content loader. Markdown posts live in content/blog/*.md and are
// loaded at build time via Vite's import.meta.glob. The frontmatter is
// parsed manually (no gray-matter dep) to keep the bundle small.

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTime: string;
  category: string;
  command: { windows: string; linux: string; darwin: string; sampleOutput: string };
  walkthrough: WalkthroughStep[];
  content: string;
};

export type WalkthroughStep = { line: string; explanation: string };

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { meta: {}, body: raw };
  const fmBlock = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  const meta: Record<string, string> = {};
  for (const line of fmBlock.split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (m) meta[m[1]!] = m[2]!.replace(/^["']|["']$/g, "").trim();
  }
  return { meta, body };
}

function parseCommandBlock(body: string): { commandSection: string; rest: string } {
  const m = body.match(/## Command[\s\S]*?```(\w+)?\s*([\s\S]*?)```/);
  if (!m) return { commandSection: "", rest: body };
  return { commandSection: m[0], rest: body.replace(m[0], "##COMMAND_PLACEHOLDER##") };
}

function parseWalkthrough(body: string): WalkthroughStep[] {
  const m = body.match(/## Walkthrough\s+([\s\S]*?)(?=\n##\s|\s*$)/);
  if (!m) return [];
  const lines = m[1]!.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const steps: WalkthroughStep[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const line = lines[i] ?? "";
    const explanation = lines[i + 1] ?? "";
    if (line.startsWith("`") || line.startsWith("›") || line.startsWith("•")) {
      steps.push({ line: line.replace(/^[`›•]\s*/, "").replace(/[`›•]$/, ""), explanation });
    }
  }
  return steps;
}

// Load all posts at build time. Keys are the absolute paths.
const rawPosts = import.meta.glob("/content/blog/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export const blogPosts: BlogPost[] = Object.entries(rawPosts)
  .map(([path, raw]) => {
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    const { meta, body } = parseFrontmatter(raw);
    // Pull a single "command" fenced code block that contains all three OS variants.
    const commandMatch = body.match(/```command\s+([\s\S]*?)```/);
    let command: BlogPost["command"] = { windows: "", linux: "", darwin: "", sampleOutput: "" };
    if (commandMatch) {
      const block = commandMatch[1]!;
      const lines = block.split(/\r?\n/);
      let section: "windows" | "linux" | "darwin" | "sample" = "windows";
      for (const line of lines) {
        const tag = line.match(/^##\s*(windows|linux|darwin|sample)\s*$/i);
        if (tag) section = tag[1]!.toLowerCase() as typeof section;
        else if (line.startsWith("~")) command.sampleOutput += line.slice(1).trimEnd() + "\n";
        else if (line.trim()) command[section] += (command[section] ? "\n" : "") + line;
      }
    }
    const walkthrough = parseWalkthrough(body);
    const content = body
      .replace(/```command\s+[\s\S]*?```/, "")
      .replace(/## Walkthrough\s+[\s\S]*?(?=\n##\s|\s*$)/, "")
      .trim();
    return {
      slug,
      title: meta.title ?? slug,
      description: meta.description ?? "",
      date: meta.date ?? "",
      readingTime: meta.readingTime ?? "5 min",
      category: meta.category ?? "Network & IP",
      command: { ...command, sampleOutput: command.sampleOutput.trimEnd() },
      walkthrough,
      content,
    };
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(p => p.slug === slug);
}

// Minimal markdown → HTML. Handles paragraphs, headings, inline code, lists, fenced code.
export function renderMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  let inCode = false;
  let codeLang = "";
  let codeBody: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.startsWith("```")) {
      if (!inCode) { inCode = true; codeLang = line.slice(3).trim(); codeBody = []; continue; }
      else {
        out.push(`<pre class="code-block" data-lang="${escapeHtml(codeLang)}"><code>${escapeHtml(codeBody.join("\n"))}</code></pre>`);
        inCode = false; codeBody = []; codeLang = ""; continue;
      }
    }
    if (inCode) { codeBody.push(line); continue; }
    if (line.startsWith("## ")) { if (inList) { out.push("</ul>"); inList = false; } out.push(`<h2>${inline(line.slice(3))}</h2>`); continue; }
    if (line.startsWith("# ")) { if (inList) { out.push("</ul>"); inList = false; } out.push(`<h1>${inline(line.slice(2))}</h1>`); continue; }
    if (/^[-*]\s+/.test(line)) { if (!inList) { out.push("<ul>"); inList = true; } out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`); continue; }
    if (line.trim() === "") { if (inList) { out.push("</ul>"); inList = false; } continue; }
    if (inList) { out.push("</ul>"); inList = false; }
    out.push(`<p>${inline(line)}</p>`);
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}