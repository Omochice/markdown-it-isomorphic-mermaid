import mermaid from "isomorphic-mermaid";
import type MarkdownIt from "markdown-it";

const MERMAID_PRE_RE = /<pre class="mermaid">([\s\S]*?)<\/pre>\n?/g;

function unescapeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Replace `<pre class="mermaid">` elements in an HTML string with
 * server-rendered SVG using isomorphic-mermaid.
 *
 * Operates on any HTML string, independent of markdown-it.
 *
 * @param html - HTML string containing mermaid pre elements
 * @returns HTML string with mermaid elements replaced by rendered SVG
 */
export async function renderMermaidInHtml(html: string): Promise<string> {
  const entries = Array.from(html.matchAll(MERMAID_PRE_RE), (match) => ({
    fullMatch: match[0],
    content: unescapeHtml(match[1] ?? ""),
  }));

  let result = html;
  let counter = 0;
  for (const entry of entries) {
    const id = `mermaid-ssr-${counter}`;
    counter += 1;
    const { svg } = await mermaid.render(id, entry.content);
    result = result.replace(entry.fullMatch, svg);
  }

  return result;
}

/**
 * Render markdown to HTML with mermaid diagrams resolved to SVG.
 *
 * Requires `mermaidPlugin` from the `/plugin` subpath to be applied
 * to the markdown-it instance beforehand.
 *
 * @param md - markdown-it instance with mermaidPlugin applied
 * @param src - markdown source string
 * @param env - optional environment object passed to markdown-it
 * @returns HTML string with mermaid code blocks replaced by rendered SVG
 */
export async function renderAsync(
  md: MarkdownIt,
  src: string,
  env: Record<string, unknown> = {},
): Promise<string> {
  const html = md.render(src, env);
  return renderMermaidInHtml(html);
}
