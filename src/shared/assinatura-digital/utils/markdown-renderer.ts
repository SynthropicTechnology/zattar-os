// import type { PluggableList } from 'react-markdown/lib';
// import type { PluggableList } from "react-markdown";
import remarkGfm from "remark-gfm";

type Variables = Record<string, unknown>;

function replaceVars(input: string, vars: Variables): string {
  return input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => {
    const parts = key.split(".");
    let curr: unknown = vars;
    for (const part of parts) {
      if (
        curr &&
        typeof curr === "object" &&
        part in (curr as Record<string, unknown>)
      ) {
        curr = (curr as Record<string, unknown>)[part];
      } else {
        return "";
      }
    }
    return curr === null || curr === undefined ? "" : String(curr);
  });
}

export function renderMarkdownWithVariables(
  markdown: string,
  variables: Variables
): string {
  if (!markdown) return "";
  return replaceVars(markdown, variables);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMarkdownPlugins(): any {
  return [remarkGfm];
}

export function getMarkdownStyles(): string {
  // usa tokens do design system; o componente aplica className diretamente
  return "prose prose-sm max-w-none dark:prose-invert";
}
