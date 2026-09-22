import assert from "node:assert/strict";
import { test } from "node:test";
import { wikiImageSrc, wikiAttachmentRels } from "./wiki-images.js";

const exists = (files) => (rel) => files.has(rel);

test("points a same-folder embed at the file next to the note", () => {
  const src = wikiImageSrc(
    "ict",
    "Languages/Java",
    "Duke.svg",
    exists(new Set(["Languages/Java/Duke.svg"])),
  );
  assert.equal(src, "/ict/Languages/Java/Duke.svg");
});

test("points a vault-root embed at the root file, not images/", () => {
  const src = wikiImageSrc(
    "ict",
    "Languages/Java",
    "java_logo.png",
    exists(new Set(["java_logo.png"])),
  );
  assert.equal(src, "/ict/java_logo.png");
});

test("keeps embeds that live in the vault images folder", () => {
  const src = wikiImageSrc(
    "ict",
    "Concepts",
    "images/globe.jpg",
    exists(new Set(["images/globe.jpg"])),
  );
  assert.equal(src, "/ict/images/globe.jpg");
});

test("lists vault-root and images fallbacks for a bare filename", () => {
  const rels = wikiAttachmentRels("Languages/Java", "java_logo.png");
  assert.deepEqual(rels, [
    "Languages/Java/java_logo.png",
    "java_logo.png",
    "images/java_logo.png",
  ]);
});
