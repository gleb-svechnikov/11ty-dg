import assert from "node:assert/strict";
import { test } from "node:test";
import { renderMermaidSvg } from "./render-mermaid.js";

test("renders a flowchart to SVG", async () => {
  const svg = await renderMermaidSvg("flowchart TD\n  A-->B", "garden-mermaid-0");
  assert.match(svg, /<svg[\s>]/i);
});

test("flowchart viewBox is tall enough for stacked nodes", async () => {
  const svg = await renderMermaidSvg(
    "flowchart TD\n  A[Start] --> B[End]",
    "garden-mermaid-box",
  );
  const match = svg.match(/viewBox="([^"]+)"/i);
  assert.ok(match, "svg has a viewBox");
  const parts = match[1].trim().split(/[\s,]+/).map(Number);
  const height = parts[3];
  assert.ok(height > 80, `expected viewBox height > 80, got ${height}`);
});

test("rejects invalid mermaid source", async () => {
  await assert.rejects(() =>
    renderMermaidSvg("this is not mermaid", "garden-mermaid-bad"),
  );
});
