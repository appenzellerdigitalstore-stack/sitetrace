// Shape of a SiteTrace guide.
//
// The guides behind /blog/<slug> were originally ported from another project.
// They have since been rewritten from scratch as original copy; this file only
// holds the shape so the content can live in parallel-editable group files.

export type GuideTerm = {
  label: string;
  meaning: string;
};

export type Guide = {
  /** The page title and H1. Written per guide, not derived from the slug. */
  title: string;
  /** One line, used as the meta description and on the blog index. */
  summary: string;
  /** 2-3 sentences: what this diagnostic is for and what it looks at. */
  purpose: string;
  /** 3-5 numbered steps. */
  steps: string[];
  /** The fields the output actually contains, and what each one means. */
  terms: GuideTerm[];
  /** 2-3 sentences: what a healthy result looks like. */
  takeaway: string;
  mac: { command?: string; note: string };
  windows: { command?: string; note: string };
  /** 2-3 sentences: what the diagnostic cannot tell you. */
  limit: string;
};
