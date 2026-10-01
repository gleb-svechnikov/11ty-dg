import { test } from "node:test";
import assert from "node:assert/strict";
import { highlightCode } from "./highlight.js";

test("highlightCode tokenizes known languages", () => {
  const html = highlightCode("# note\nx = 'hi'\n", "python");
  assert.match(html, /<span class="token comment"># note<\/span>/);
  assert.match(html, /<span class="token string">'hi'<\/span>/);
});

test("highlightCode resolves aliases like js and sh", () => {
  assert.match(highlightCode("const a = 1;", "js"), /token keyword/);
  assert.match(highlightCode("echo hi", "sh"), /token/);
});

test("highlightCode escapes HTML in highlighted code", () => {
  assert.doesNotMatch(highlightCode("a < b && c", "java"), /a < b/);
});

test("highlightCode defers plain, unknown and mermaid fences to markdown-it", () => {
  for (const info of ["", "text", "mermaid", "twine", "query"]) {
    assert.equal(highlightCode("<b>x</b>", info), "", info);
  }
});
