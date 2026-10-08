import { describe, expect, it } from "vitest";
import { tools, getToolSlug } from "@/lib/tools";
import { workspaces, defaultValues, validateTarget } from "@/lib/tool-workspaces";
import { runLocalUtility, getDiagnosticSample } from "@/lib/tool-results";

describe("Tool workspaces", () => {
  it.each(tools)("has a configured workspace for $name", tool => {
    const slug = getToolSlug(tool); const workspace = workspaces[slug];
    expect(workspace).toBeDefined();
    if (!workspace) return;
    expect(validateTarget(slug, defaultValues(workspace))).toBe("");
    expect(workspace.fields.length).toBeGreaterThan(0);
  });
  it("rejects malformed addresses and unsafe URL schemes", () => {
    expect(validateTarget("ip-lookup", { target: "999.2.3.4" })).not.toBe("");
    expect(validateTarget("ip-lookup", { target: "::::" })).not.toBe("");
    expect(validateTarget("ip-lookup", { target: "2001:db8::1" })).toBe("");
    expect(validateTarget("http-headers", { target: "javascript:alert(1)" })).not.toBe("");
    expect(validateTarget("bulk-url-status", { target: "https://example.com\nnope" })).not.toBe("");
    expect(validateTarget("subnet-calculator", { target: "192.168.1.0/33" })).not.toBe("");
  });
  it("calculates normal and point-to-point IPv4 ranges", () => {
    const result = runLocalUtility("subnet-calculator", { target: "192.168.1.123/24" });
    expect(result.metrics).toContainEqual(["Network", "192.168.1.0/24"]);
    expect(result.metrics).toContainEqual(["Usable hosts", "254"]);
    expect(runLocalUtility("subnet-calculator", { target: "10.0.0.0/31" }).metrics).toContainEqual(["Usable hosts", "2"]);
  });
  it("counts empty and nonempty text", () => {
    expect(runLocalUtility("word-counter", { target: "one two three" }).metrics).toContainEqual(["Words", "3"]);
    expect(runLocalUtility("word-counter", { target: "" }).metrics).toContainEqual(["Words", "0"]);
  });
  it("classifies URLs and IP addresses", () => {
    expect(runLocalUtility("smart-dispatcher", { target: "https://example.com/path" }).metrics).toContainEqual(["Type", "Website URL"]);
    expect(runLocalUtility("smart-dispatcher", { target: "8.8.8.8" }).metrics).toContainEqual(["Type", "IP address"]);
  });
  it("does not mutate diagnostic fixtures", () => {
    const result = getDiagnosticSample("ip-lookup"); result.metrics.length = 0;
    expect(getDiagnosticSample("ip-lookup").metrics.length).toBe(4);
  });
  it("generates passwords respecting settings", () => {
    const result = runLocalUtility("password-generator", { length: "32", upper: "true", lower: "true", digits: "true", symbols: "true" });
    expect(result.text).toHaveLength(32);
    expect(result.text).toMatch(/[A-Z]/); expect(result.text).toMatch(/[a-z]/); expect(result.text).toMatch(/[0-9]/); expect(result.text).toMatch(/[^a-z0-9]/i);
    expect(() => runLocalUtility("password-generator", { length: "24" })).toThrow("Select at least");
  });
  it("produces hex and RGB colors", () => {
    expect(runLocalUtility("random-color", { format: "HEX" }).text).toMatch(/^#[A-F0-9]{6}$/);
    expect(runLocalUtility("random-color", { format: "RGB" }).text).toMatch(/^rgb\(/);
  });
});