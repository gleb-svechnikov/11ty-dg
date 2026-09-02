import assert from "node:assert/strict";
import { test } from "node:test";
import { mapOutsideIgnored } from "./html-regions.js";

function mark(html) {
  return mapOutsideIgnored(html, (chunk) => chunk.replaceAll("[[A]]", "LINK"));
}

test("transforms text outside ignored regions", () => {
  assert.equal(mark("<p>[[A]]</p>"), "<p>LINK</p>");
});

test("leaves [[A]] inside pre unchanged", () => {
  assert.equal(mark("<p>[[A]]</p><pre>[[A]]</pre>"), "<p>LINK</p><pre>[[A]]</pre>");
});

test("leaves [[A]] inside code unchanged", () => {
  assert.equal(mark("<p>see <code>[[A]]</code></p>"), "<p>see <code>[[A]]</code></p>");
});

test("leaves mermaid source script unchanged", () => {
  const html =
    '<p>[[A]]</p><script type="text/plain" class="garden-mermaid-source">[[A]]</script>';
  assert.equal(
    mark(html),
    '<p>LINK</p><script type="text/plain" class="garden-mermaid-source">[[A]]</script>',
  );
});
