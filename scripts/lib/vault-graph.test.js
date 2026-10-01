import { test } from "node:test";
import assert from "node:assert/strict";
import { noteTitle } from "./vault-graph.js";

test("noteTitle uses the first H1", () => {
  assert.equal(noteTitle("---\ngarden: true\n---\n# Real title\n", "x/Note.md"), "Real title");
});

test("noteTitle ignores # lines inside fenced code", () => {
  const md = "---\ngarden: true\n---\n\n## Section\n```python\n# a comment\nx = 1\n```\n~~~sh\n# shell\n~~~\n";
  assert.equal(noteTitle(md, "Languages/Comment.md"), "Comment");
});

test("noteTitle finds an H1 after a code block", () => {
  assert.equal(noteTitle("```js\n# not this\n```\n# This one\n", "a/B.md"), "This one");
});

test("noteTitle falls back to the file name", () => {
  assert.equal(noteTitle("no heading here", "people/Grace_Hopper.md"), "Grace Hopper");
});
