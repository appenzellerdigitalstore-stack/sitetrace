// Blog guide data.
//
// The guides were originally ported from another project. They have since
// been rewritten from scratch as original copy, so the site carries writing
// that is its own. Each guide teaches the underlying technique - the command
// to run, the raw output to read and what each field means - rather than
// repeating the on-page tool editorial.
//
// The content lives in three group files so it can be written and reviewed in
// parallel; this map is the single source of truth at runtime.

import type { Guide } from "./guide-types";
import { groupA } from "./blog-guides/group-a";
import { groupB } from "./blog-guides/group-b";
import { groupC } from "./blog-guides/group-c";

export const guides: Record<string, Guide> = {
  ...groupA,
  ...groupB,
  ...groupC,
};

export type { Guide };
