import type MarkdownIt from "markdown-it";
import { mermaidPlugin as fencePlugin } from "./plugin.ts";
import { renderMermaidInHtml } from "./render.ts";

export { renderAsync, renderMermaidInHtml } from "./render.ts";
export { fencePlugin as mermaidFencePlugin };

interface MarpitRenderResult {
  html: string;
  css: string;
  comments: string[][];
}

/**
 * markdown-it plugin that replaces mermaid code blocks with
 * `<pre class="mermaid">` elements and wraps `md.render()` to
 * asynchronously replace them with server-rendered SVG.
 *
 * For Marp CLI v3.2.1+, `marp.use(mermaidPlugin)` is sufficient.
 * Marp CLI awaits the async render result automatically.
 *
 * For environments that do not support async render, use
 * `mermaidFencePlugin` from this module or import from the
 * `./plugin` subpath instead.
 */
export function mermaidPlugin(md: MarkdownIt): void {
  fencePlugin(md);

  const originalRender = md.render.bind(md);
  // Marpit.render returns {html, css, comments}, markdown-it returns string.
  // Marp CLI v3.2.1+ awaits the return value of render().
  const asyncRender = async (...args: Parameters<typeof md.render>) => {
    const result = originalRender(...args) as string | MarpitRenderResult;
    if (typeof result === "object" && "html" in result) {
      result.html = await renderMermaidInHtml(result.html);
      return result;
    }
    return renderMermaidInHtml(result);
  };
  Object.defineProperty(md, "render", { value: asyncRender });
}
