import type MarkdownIt from "markdown-it";
import type { Options } from "markdown-it";
import type Renderer from "markdown-it/lib/renderer.mjs";
import type Token from "markdown-it/lib/token.mjs";

/**
 * markdown-it plugin that replaces mermaid code blocks with
 * `<pre class="mermaid">` elements.
 *
 * When combined with `renderAsync` or `renderMermaidInHtml` from the
 * `/render` subpath, diagrams are rendered server-side to SVG.
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
      const escaped = md.utils.escapeHtml(token.content);
      return `<pre class="mermaid">${escaped}</pre>\n`;
    }
    return defaultFence(tokens, idx, options, env, self);
  };
}
