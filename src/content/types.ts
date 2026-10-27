import type { Lang } from "../i18n/ui";

export interface ToolCopy {
  /** <title> – include the main search phrase, ~50–60 chars, without the site name */
  title: string;
  /** meta description, ~140–160 chars */
  description: string;
  /** H1 on the page (defaults to the registry name) */
  h1?: string;
  /** one or two sentences under the H1 */
  lead: string;
  /** 3–5 short steps */
  steps: string[];
  /** 3–6 questions people actually search for */
  faq: { q: string; a: string }[];
  /** optional extra explainer paragraphs (plain text, may contain `code`) */
  about?: string[];
}

export type ToolContent = Record<Lang, ToolCopy>;
