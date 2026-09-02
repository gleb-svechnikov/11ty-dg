import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodeFenceHtml,
  decodeMermaidSource,
  encodeMermaidSource,
  transformMermaidHtml,
} from "./mermaid-html.js";

test("decodeFenceHtml unescapes markdown-it entities", () => {
  assert.equal(decodeFenceHtml("A--&gt;B &amp; C"), "A-->B & C");
});

test("encodeMermaidSource escapes a closing script tag", () => {
  assert.equal(encodeMermaidSource("x</script>y"), "x<\\/script>y");
  assert.equal(decodeMermaidSource("x<\\/script>y"), "x</script>y");
});

test("wraps a mermaid fence in a figure with baked SVG", async () => {
  const html = `<pre><code class="language-mermaid">flowchart TD
A--&gt;B
</code></pre>`;
  const out = await transformMermaidHtml(html);
  assert.match(out, /<figure class="garden-mermaid tex2jax_ignore" data-mermaid-theme="default">/);
  assert.match(out, /<div class="garden-mermaid-svg">[\s\S]*<svg/i);
  assert.match(
    out,
    /<script type="text\/plain" class="garden-mermaid-source" data-pagefind-ignore>/,
  );
  assert.match(out, /flowchart TD/);
  assert.doesNotMatch(out, /<pre><code class="language-mermaid">/);
});

test("leaves an empty mermaid fence as a code block", async () => {
  const html = `<pre><code class="language-mermaid">\n  \n</code></pre>`;
  const out = await transformMermaidHtml(html);
  assert.equal(out, html);
});

test("leaves invalid mermaid as a code block", async () => {
  const html = `<pre><code class="language-mermaid">this is not mermaid</code></pre>`;
  const out = await transformMermaidHtml(html);
  assert.equal(out, html);
});

test("escapes </script> in stored mermaid source", async () => {
  const html = `<pre><code class="language-mermaid">flowchart TD
A--&gt;B
%% &lt;/script&gt;
</code></pre>`;
  const out = await transformMermaidHtml(html);
  assert.match(out, /%% <\\\/script>/);
  const source = out.match(
    /class="garden-mermaid-source"[^>]*>([\s\S]*?)<\/script>/,
  )?.[1];
  assert.ok(source);
  assert.equal(decodeMermaidSource(source).includes("</script>"), true);
});
