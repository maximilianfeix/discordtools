import { existsSync, readFileSync } from "node:fs";

export interface LegalBlock {
  heading?: string;
  lines: string[];
}

/** Reads legal/<name>.md at build time. Returns null when the file is missing (e.g. in forks). */
export function readLegal(name: string): LegalBlock[] | null {
  const path = `${process.cwd()}/legal/${name}.md`;
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8")
    .trim()
    .split(/\n\s*\n/)
    .map((chunk) => {
      const lines = chunk.split("\n").map((l) => l.trimEnd());
      if (lines[0]?.startsWith("## ")) return { heading: lines[0].slice(3), lines: lines.slice(1) };
      return { lines };
    });
}
