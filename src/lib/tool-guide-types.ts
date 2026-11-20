// Editorial content that lives on the /tools/<slug> pages themselves.
//
// Why this exists: the tool pages were 84-110 words each because they only
// rendered the interactive workspace. The long-form guides already existed
// under /blog/<slug>, but a tool page that says nothing is a thin page, and
// AdSense flagged the site for low value content.
//
// These guides are written for the tool page, not copied from the blog
// articles: they explain how to drive the workspace on this page and how to
// act on the numbers it returns. The /blog/<slug> article stays the deeper
// tutorial and is linked at the bottom of each tool page.

export type ToolPageGuide = {
  /** 70-110 words. What the tool actually does and the problem it solves. */
  overview: string;
  /** 4-6 short bullets. How to drive the workspace on this page. */
  howToUse: string[];
  /** 4-6 bullets. What each result field means and what to do with it. */
  readingResults: string[];
  /** 3-5 bullets. What this tool cannot tell you. */
  limits: string[];
  /** 2-4 sentences. What a healthy result looks like and what to do next. */
  nextSteps: string;
};
