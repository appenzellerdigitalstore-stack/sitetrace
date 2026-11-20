import type { ToolPageGuide } from "./tool-guide-types";
import { groupA } from "./tool-guides/group-a";
import { groupB } from "./tool-guides/group-b";
import { dnsLookupGuide } from "./tool-guides/exemplar";

// Every tool page carries its own editorial block. The guides are grouped in
// separate files purely so the content can be written and reviewed in
// parallel; this map is the single source of truth at runtime.
const all: Record<string, ToolPageGuide> = {
  ...groupA,
  ...groupB,
  "dns-lookup": dnsLookupGuide,
};

export const toolPageGuides: Record<string, ToolPageGuide> = all;

export function getToolPageGuide(slug: string): ToolPageGuide | undefined {
  return all[slug];
}

export type { ToolPageGuide };
