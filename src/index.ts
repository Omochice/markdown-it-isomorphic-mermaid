import mermaid from "isomorphic-mermaid";
import type MarkdownIt from "markdown-it";
import type { Options } from "markdown-it";
import type Renderer from "markdown-it/lib/renderer.mjs";
import type Token from "markdown-it/lib/token.mjs";

interface MermaidEntry {
  id: string;
  content: string;
}

interface MermaidEnv {
  __mermaid?: MermaidEntry[];
}

/**
 * markdown-it plugin that renders mermaid code blocks to SVG
 * using isomorphic-mermaid.
 *
 * Since mermaid rendering is asynchronous, use {@link renderAsync}
 * instead of `md.render()` to get the final HTML with rendered diagrams.
 */
export function mermaidPlugin(md: MarkdownIt): void {
  const defaultFence =
    md.renderer.rules.fence ??
    ((
      tokens: Token[],
      idx: number,
      options: Options,
      _env: unknown,
      self: Renderer,
    ) => self.renderToken(tokens, idx, options));

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token === undefined) {
      return "";
    }
    if (token.info.trim() === "mermaid") {
      const mermaidEnv = env as MermaidEnv;
      const id = `mermaid-${idx}`;
      if (!mermaidEnv.__mermaid) {
        mermaidEnv.__mermaid = [];
      }
      mermaidEnv.__mermaid.push({ id, content: token.content });
      return `<div data-mermaid-placeholder="${id}"></div>`;
    }
    return defaultFence(tokens, idx, options, env, self);
  };
}

/**
 * Render markdown to HTML with mermaid diagrams resolved to SVG.
 *
 * @param md - markdown-it instance with {@link mermaidPlugin} applied
 * @param src - markdown source string
 * @param env - optional environment object passed to markdown-it
 * @returns HTML string with mermaid code blocks replaced by rendered SVG
 */
export async function renderAsync(
  md: MarkdownIt,
  src: string,
  env: Record<string, unknown> = {},
): Promise<string> {
  let html = md.render(src, env);

  const mermaidEnv = env as MermaidEnv;
  if (!mermaidEnv.__mermaid) {
    return html;
  }

  for (const entry of mermaidEnv.__mermaid) {
    const { svg } = await mermaid.render(entry.id, entry.content);
    html = html.replace(
      `<div data-mermaid-placeholder="${entry.id}"></div>`,
      svg,
    );
  }

  return html;
}
