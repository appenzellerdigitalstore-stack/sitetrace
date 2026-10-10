import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, Copy, Download, Info, LoaderCircle, RotateCcw, ScanLine, Image, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatrixRain } from "./matrix-rain";
import { SiteHeader } from "./site-header";
import { getToolSlug, tools, type Tool } from "@/lib/tools";
import { defaultValues, validateTarget, workspaces, type ToolResult } from "@/lib/tool-workspaces";
import { getDiagnosticSample, runLocalUtility } from "@/lib/tool-results";
import { guides } from "@/lib/blog-guides";

type OS = "windows" | "darwin" | "linux";

function detectOS(): OS {
  if (typeof navigator === "undefined") return "linux";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "darwin";
  return "linux";
}

function interpolateCommand(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
}

const OS_LABELS: Record<OS, string> = {
  windows: "Windows (PowerShell/CMD)",
  darwin: "macOS (Terminal)",
  linux: "Linux (bash)",
};

export function ToolWorkspace({ tool }: { tool: Tool }) {
  const slug = getToolSlug(tool);
  const workspace = workspaces[slug];
  const [values, setValues] = useState(() => workspace ? defaultValues(workspace) : {});
  const [result, setResult] = useState<ToolResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [showSample, setShowSample] = useState(false);
  const [resultSource, setResultSource] = useState<"live" | "sample">("sample");
  const [selectedOS, setSelectedOS] = useState<OS>(detectOS());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); if (copyTimer.current) clearTimeout(copyTimer.current); }, []);
  useEffect(() => { if (workspace && workspace.fields.length === 0 && !result && !busy) { void run(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug]);
  const noFields = workspace?.fields.length === 0;
  if (!workspace) return null;
  const related = tools.filter(item => item.category === tool.category && item.name !== tool.name).slice(0, 3);
  const change = (key: string, value: string) => { setValues(previous => ({ ...previous, [key]: value })); setError(""); };
  const run = async () => {
    setError(""); setCopied(false); setResult(null);
    const issue = validateTarget(slug, values);
    if (issue) { setError(issue); return; }
    try {
      if (workspace.local || workspace.live) {
        setBusy(true);
        try {
          const r = await runLocalUtility(slug, values);
          setResult({ ...r, live: true });
          setResultSource("live");
        } finally { setBusy(false); }
        return;
      }
      setBusy(true);
      timer.current = setTimeout(() => { setResult({ ...getDiagnosticSample(slug), live: false }); setResultSource("sample"); setBusy(false); }, 550);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not generate a result."); setBusy(false); }
  };
  const copyCommand = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedCmd(true); if (copyTimer.current) clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopiedCmd(false), 1500); }
    catch { setError("Copy unavailable. Select the text manually."); }
  };
  const isLive = workspace.live === true;
  const isCommand = workspace.command !== undefined;
  const badgeLabel = isLive ? "LIVE DIAGNOSTIC" : isCommand ? "RUN LOCALLY" : workspace.local ? "LOCAL UTILITY" : "DIAGNOSTIC PREVIEW";
  const badgeClass = isLive ? "status-pill status-pill--live" : isCommand ? "status-pill status-pill--command" : workspace.local ? "status-pill status-pill--local" : "status-pill";
  const noteText = isLive ? "Live data is fetched from a real network source for each run." : isCommand ? "Your browser can't run this — copy the command and run it in your terminal." : workspace.local ? "Processed in your browser. Nothing is saved or sent." : "Sample results only — no live network request is made.";
  const resultBadgeLabel = resultSource === "live" ? "LIVE" : workspace.local ? "COMPLETE" : "SAMPLE";
  const exportText = result ? [result.title, resultSource === "live" ? "Live diagnostic result" : "SAMPLE DATA — not a live diagnostic", ...result.metrics.map(([label, value]) => `${label}: ${value}`), result.text ?? "", result.columns?.join("\t") ?? "", ...(result.rows?.map(row => row.join("\t")) ?? [])].filter(Boolean).join("\n") : "";
  const reset = () => { if (timer.current) clearTimeout(timer.current); setValues(defaultValues(workspace)); setResult(null); setBusy(false); setError(""); setCopied(false); setResultSource("sample"); };
  const commandText = workspace.command ? interpolateCommand(workspace.command[selectedOS], values) : "";
  const sampleOutput = workspace.command ? interpolateCommand(workspace.command.sampleOutput, values) : "";
  return <div className="site-page"><MatrixRain /><SiteHeader /><main className="shell tool-page">
    {guides[slug] ? <p className="guide-cta-top">New to {tool.name.toLowerCase()}? <Link to="/blog/$slug" params={{ slug }}><BookOpen size={12} />Learn how to read the output<ArrowUpRight size={12} /></Link></p> : null}
    <nav aria-label="Breadcrumb" className="tool-breadcrumb"><Link to="/">SiteTrace</Link><ChevronRight size={12} /><Link to="/" hash="tools">All tools</Link><ChevronRight size={12} /><span>{tool.name}</span></nav>
    <div className="workspace-heading"><div><div className="eyebrow">{tool.category}</div><h1>{tool.name}<span className="brand-dot">.</span></h1><p>{tool.description}</p><span className={badgeClass}><span className="status-dot" />{badgeLabel}</span></div><div className="workspace-symbol"><tool.icon /></div></div>
    <div className="workspace-layout">
      {isCommand && workspace.command ? <div className="workspace-input">
        <h2>{workspace.inputTitle}</h2>
        <div className="workspace-fields">{workspace.fields.map(field => field.type === "checkbox" ? <label key={field.key} className="workspace-check"><input type="checkbox" checked={values[field.key] === "true"} disabled={busy} onChange={event => change(field.key, String(event.target.checked))} />{field.label}</label> : <label key={field.key} className="workspace-field"><span>{field.label}</span>{field.type === "select" ? <select disabled={busy} value={values[field.key] ?? ""} onChange={event => change(field.key, event.target.value)}>{field.options?.map(option => <option key={option}>{option}</option>)}</select> : field.type === "textarea" ? <textarea disabled={busy} value={values[field.key] ?? ""} onChange={event => change(field.key, event.target.value)} placeholder={field.placeholder} required={slug !== "word-counter"} /> : <input disabled={busy} type={field.type === "number" ? "number" : "text"} min={field.min} max={field.max} value={values[field.key] ?? ""} onChange={event => change(field.key, event.target.value)} placeholder={field.placeholder} required spellCheck={false} autoCapitalize="none" />}</label>)}</div>
        <div className="command-block">
          <div className="command-block-head">
            <Terminal size={14} />
            <span>{OS_LABELS[selectedOS]}</span>
            <select className="command-os-picker" value={selectedOS} onChange={e => setSelectedOS(e.target.value as OS)} aria-label="Select operating system">
              <option value="windows">Windows</option>
              <option value="darwin">macOS</option>
              <option value="linux">Linux</option>
            </select>
            <Button variant="glossy" size="sm" onClick={() => void copyCommand(commandText)} title="Copy command" aria-label="Copy command">{copiedCmd ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy command</>}</Button>
          </div>
          <code className="command-block-body">{commandText}</code>
        </div>
        {error && <p className="workspace-error" role="alert">{error}</p>}
        <p className="workspace-note">{noteText}</p>
        <details className="command-sample" onToggle={e => setShowSample((e.target as HTMLDetailsElement).open)}>
          <summary>What you'll see when you run it</summary>
          <pre className="command-sample-body">{sampleOutput}</pre>
        </details>
      </div> : <form className="workspace-input" onSubmit={event => { event.preventDefault(); run(); }}><h2>{workspace.inputTitle}</h2><div className="workspace-fields">{workspace.fields.map(field => field.type === "checkbox" ? <label key={field.key} className="workspace-check"><input type="checkbox" checked={values[field.key] === "true"} disabled={busy} onChange={event => change(field.key, String(event.target.checked))} />{field.label}</label> : <label key={field.key} className="workspace-field"><span>{field.label}</span>{field.type === "select" ? <select disabled={busy} value={values[field.key] ?? ""} onChange={event => change(field.key, event.target.value)}>{field.options?.map(option => <option key={option}>{option}</option>)}</select> : field.type === "textarea" ? <textarea disabled={busy} value={values[field.key] ?? ""} onChange={event => change(field.key, event.target.value)} placeholder={field.placeholder} required={slug !== "word-counter"} /> : <input disabled={busy} type={field.type === "number" ? "number" : "text"} min={field.min} max={field.max} value={values[field.key] ?? ""} onChange={event => change(field.key, event.target.value)} placeholder={field.placeholder} required spellCheck={false} autoCapitalize="none" />}</label>)}</div>
        {!noFields && <Button variant="glossy" type="submit" disabled={busy} className="workspace-submit">{busy ? <><LoaderCircle className="animate-spin" />{isLive ? "Fetching live data" : "Preparing preview"}</> : <>{workspace.action}<ArrowRight /></>}</Button>}
        {error && <p className="workspace-error" role="alert">{error}</p>}
        <p className="workspace-note">{noFields ? (busy ? "Fetching your network details..." : "Detection complete — see results on the right.") : noteText}</p>
      </form>}
      <section className="workspace-results" aria-label="Tool results"><div className="results-toolbar"><h2>{result?.title ?? "Results"}</h2><div className="results-actions">{result && <span className="result-state"><span className="status-dot" />{resultBadgeLabel}</span>}<Button variant="ghost" size="icon" disabled={!result} title={copied ? "Copied" : "Copy results"} aria-label={copied ? "Copied" : "Copy results"} onClick={async () => { try { await navigator.clipboard.writeText(exportText); setCopied(true); } catch { setError("Copy unavailable. Download the results instead."); } }}>{copied ? <Check /> : <Copy />}</Button><Button variant="ghost" size="icon" disabled={!result} title="Download results" aria-label="Download results" onClick={() => { const objectUrl = URL.createObjectURL(new Blob([exportText], { type: "text/plain" })); const anchor = document.createElement("a"); anchor.href = objectUrl; anchor.download = `sitetrace-${slug}.txt`; anchor.click(); setTimeout(() => URL.revokeObjectURL(objectUrl), 1000); }}><Download /></Button><Button variant="ghost" size="icon" onClick={reset} aria-label="Reset tool" title="Reset tool"><RotateCcw /></Button></div></div>
      {resultSource === "sample" && result && <div className="sample-disclosure"><Info size={14} /><span>{noFields ? "Detection didn't return — check your network and retry." : `Showing sample data for ${slug === "what-is-my-ip" ? "an example connection" : "example.com / 8.8.8.8"}. ${isLive ? "Click " + workspace.action + " to fetch live data for your input." : ""}`}</span></div>}
      <div aria-live="polite" aria-busy={busy}>{result ? <><dl className="result-metrics">{result.metrics.map(([label, value]) => <div className="result-metric" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{result.text && <div className="result-text">{result.color && <ColorSwatch color={result.color} />}<code>{result.text}</code></div>}{result.preview && <div className="social-preview"><div className="social-preview-image"><Image size={28} /><span>No social image</span></div><div className="social-preview-body"><span>{result.preview.domain}</span><h3>{result.preview.title}</h3><p>{result.preview.description}</p></div></div>}{result.columns && <div className="result-table-scroll"><table className="result-table"><caption className="sr-only">{result.title}{resultSource === "live" ? "" : " — sample data"}</caption><thead><tr>{result.columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{result.rows?.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>}</> : <div className="results-empty">{busy ? <LoaderCircle size={30} className="animate-spin" /> : <ScanLine size={30} />}<h3>{busy ? (isLive ? "Fetching live data" : "Preparing sample results") : "Ready when you are."}</h3><p>{workspace.local ? (isCommand ? "Type a target above to build the command." : "Your result will appear here.") : "Your diagnostic preview will appear here."}</p></div>}</div>
      {result && slug === "smart-dispatcher" && <div className="mt-5 flex flex-wrap gap-2">{result.rows?.map(([name]) => { const suggested = tools.find(item => item.name === name); return suggested ? <Button key={name} variant="outline" size="sm" asChild><Link to="/tools/$slug" params={{ slug: getToolSlug(suggested) }}>{name}<ArrowUpRight /></Link></Button> : null; })}</div>}
    </section></div>
    <section className="workspace-related"><div className="workspace-related-heading"><h2>More in {tool.category}</h2><Button variant="ghost" size="sm" asChild><Link to="/" hash="tools"><ArrowLeft />All tools</Link></Button></div><div className="tool-grid">{related.map(item => <Button variant="tool" key={item.name} asChild><Link to="/tools/$slug" params={{ slug: getToolSlug(item) }}><div className="tool-card-top"><span className="tool-icon"><item.icon /></span><span className="tool-command">$ {item.label}</span></div><h4>{item.name}</h4><p>{item.description}</p><div className="tool-card-bottom"><span>Open tool</span><ArrowUpRight /></div></Link></Button>)}</div></section>
  </main></div>;
}

function ColorSwatch({ color }: { color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const context = ref.current?.getContext("2d"); if (!context) return; context.fillStyle = color; context.fillRect(0, 0, 72, 72); }, [color]);
  return <canvas ref={ref} width={72} height={72} className="color-swatch" role="img" aria-label={`Generated color ${color}`} />;
}
