import type { ToolContent } from "./types";

const modules = import.meta.glob<{ default: ToolContent }>("./tools/*.ts", { eager: true });

export function contentFor(id: string): ToolContent | undefined {
  return modules[`./tools/${id}.ts`]?.default;
}
