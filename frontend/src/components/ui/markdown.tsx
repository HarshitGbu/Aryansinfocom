import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugify } from "@/lib/format";

function toPlainText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toPlainText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return toPlainText(node.props.children);
  return "";
}

// The TOC on service detail pages links to `#slugified` anchors; give every h2
// a matching id (tabIndex -1 so fragment navigation can move focus for AT).
const components: Partial<Components> = {
  h2: ({ children }) => <h2 id={slugify(toPlainText(children))} tabIndex={-1}>{children}</h2>,
};

export function Markdown({ content }: { content: string }): React.JSX.Element {
  return (
    <div className="max-w-[65ch] space-y-4 text-[1rem] leading-[1.6] text-text-muted [&>h2]:mt-10 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-text [&>p]:max-w-[65ch] [&_a]:text-cyan [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_pre]:overflow-x-auto [&_pre]:rounded-[12px] [&_pre]:border [&_pre]:border-white/10 [&_pre]:bg-surface-2 [&_pre]:p-4 [&_table]:w-full [&_td]:border [&_td]:border-white/10 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-white/10 [&_th]:px-3 [&_th]:py-2 [&_ul]:list-disc [&_ul]:pl-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown>
    </div>
  );
}
