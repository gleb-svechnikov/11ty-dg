import path from "node:path";

function cleanWikiTarget(wikiTarget) {
  return wikiTarget.trim().replace(/^\/+/, "").split("|")[0].trim();
}

export function wikiAttachmentRels(noteRelDir, wikiTarget) {
  const cleaned = cleanWikiTarget(wikiTarget);
  if (!cleaned) return [];
  const base = path.posix.basename(cleaned);
  const rels = [];
  const add = (rel) => {
    const normalized = path.posix.normalize(rel).replace(/^\.\//, "");
    if (!normalized || normalized.startsWith("..")) return;
    if (!rels.includes(normalized)) rels.push(normalized);
  };
  const dir = noteRelDir && noteRelDir !== "." ? noteRelDir.replace(/\\/g, "/") : "";
  if (dir) {
    add(path.posix.join(dir, cleaned));
    add(path.posix.join(dir, base));
  }
  add(cleaned);
  add(path.posix.join("images", base));
  return rels;
}

export function wikiImageSrc(vaultId, noteRelDir, wikiTarget, exists) {
  const cleaned = cleanWikiTarget(wikiTarget);
  const rels = wikiAttachmentRels(noteRelDir, wikiTarget);
  const found = rels.find((rel) => exists(rel));
  const rel = found || path.posix.join("images", path.posix.basename(cleaned));
  const encoded = rel
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/${vaultId}/${encoded}`;
}
