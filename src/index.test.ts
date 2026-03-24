import assert from "node:assert/strict";
import { describe, it } from "node:test";
import MarkdownIt from "markdown-it";
import {
  mermaidFencePlugin,
  mermaidPlugin,
  renderAsync,
  renderMermaidInHtml,
} from "./index.ts";

// pie chart does not use HTML labels, so it works with svgdom
const pieDiagram = ["pie", '  "A" : 30', '  "B" : 70'].join("\n");

describe("mermaidPlugin", () => {
  it("should pass through non-mermaid fenced code blocks unchanged", async () => {
    const md = new MarkdownIt();
    md.use(mermaidPlugin);

    const src = "```js\nconsole.log('hello');\n```";
    const html = await md.render(src);

    assert.ok(html.includes("console.log"));
    assert.ok(!html.includes('class="mermaid"'));
  });

  it("should render mermaid code blocks to SVG", async () => {
    const md = new MarkdownIt();
    md.use(mermaidPlugin);

    const src = `\`\`\`mermaid\n${pieDiagram}\n\`\`\``;
    const html = await md.render(src);

    assert.ok(html.includes("<svg"));
    assert.ok(!html.includes('<pre class="mermaid"'));
  });
});

describe("renderAsync", () => {
  it("should render mermaid code blocks to SVG", async () => {
    const md = new MarkdownIt();
    md.use(mermaidFencePlugin);

    const src = `\`\`\`mermaid\n${pieDiagram}\n\`\`\``;
    const html = await renderAsync(md, src);

    assert.ok(html.includes("<svg"));
    assert.ok(!html.includes('<pre class="mermaid"'));
  });

  it("should render markdown without mermaid blocks normally", async () => {
    const md = new MarkdownIt();
    md.use(mermaidFencePlugin);

    const src = "# Hello\n\nworld";
    const html = await renderAsync(md, src);

    assert.ok(html.includes("<h1>Hello</h1>"));
    assert.ok(html.includes("<p>world</p>"));
  });

  it("should handle multiple mermaid blocks", async () => {
    const md = new MarkdownIt();
    md.use(mermaidFencePlugin);

    const src = [
      "```mermaid",
      pieDiagram,
      "```",
      "",
      "Some text",
      "",
      "```mermaid",
      pieDiagram,
      "```",
    ].join("\n");

    const html = await renderAsync(md, src);

    assert.ok(!html.includes('<pre class="mermaid"'));
    assert.ok(html.includes("Some text"));
    const svgCount = (html.match(/<svg/g) ?? []).length;
    assert.equal(svgCount, 2);
  });
});

describe("renderMermaidInHtml", () => {
  it("should replace pre.mermaid elements with SVG", async () => {
    const html = `<pre class="mermaid">${pieDiagram}</pre>\n`;
    const result = await renderMermaidInHtml(html);

    assert.ok(result.includes("<svg"));
    assert.ok(!result.includes('<pre class="mermaid"'));
  });

  it("should pass through HTML without mermaid content", async () => {
    const html = "<h1>Hello</h1>\n<p>world</p>\n";
    const result = await renderMermaidInHtml(html);

    assert.equal(result, html);
  });
});
