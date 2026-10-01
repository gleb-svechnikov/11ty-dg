import path from "node:path";

export function stripFrontmatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

export function noteTitle(markdown, filePath) {
  // Drop fenced code first so `# comment` lines in code are not taken as an H1.
  const prose = stripFrontmatter(markdown).replace(
    /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1[ \t]*$|(?![\s\S]))/gm,
    "",
  );
  const heading = prose.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return path.basename(filePath, path.extname(filePath)).replace(/_/g, " ");
}

export function extractLinkTargets(markdown) {
  const body = stripFrontmatter(markdown);
  const targets = [];
  for (const match of body.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g)) {
    targets.push(match[1].trim());
  }
  for (const match of body.matchAll(/\[[^\]]*]\(([^)]+)\)/g)) {
    const href = match[1].trim().replace(/\\/g, "").split(/[?#]/)[0];
    if (!href || /^(https?:|mailto:|#)/i.test(href)) continue;
    targets.push(href);
  }
  return targets;
}

function normalizeKey(value) {
  return value
    .replace(/\\/g, "")
    .replace(/\.md$/i, "")
    .replace(/\\/g, "/")
    .replace(/_/g, " ")
    .replace(/\/+/g, "/")
    .replace(/^\.\//, "")
    .trim()
    .toLowerCase();
}

export function buildLookups(notes) {
  const byKey = new Map();
  for (const note of notes) {
    const rel = note.rel.replace(/\\/g, "/");
    const noExt = rel.replace(/\.md$/i, "");
    const keys = new Set([
      normalizeKey(rel),
      normalizeKey(noExt),
      normalizeKey(path.posix.basename(noExt)),
      normalizeKey(path.posix.basename(rel)),
    ]);
    for (const key of keys) {
      if (!byKey.has(key)) byKey.set(key, note);
    }
  }
  return byKey;
}

export function resolveTarget(sourceRel, target, lookups) {
  const fromDir = path.posix.dirname(sourceRel.replace(/\\/g, "/"));
  const cleaned = target.replace(/\\/g, "").replace(/^\/+/, "");
  const joined = path.posix.normalize(`${fromDir}/${cleaned}`);
  const candidates = [cleaned, joined, path.posix.basename(cleaned)];
  for (const candidate of candidates) {
    const hit = lookups.get(normalizeKey(candidate));
    if (hit && hit.rel !== sourceRel) return hit;
  }
  return null;
}

export function noteFolder(rel) {
  const normalized = String(rel || "").replace(/\\/g, "/");
  const slash = normalized.indexOf("/");
  return slash === -1 ? "Root" : normalized.slice(0, slash);
}

export function buildVaultGraph(notes) {
  const lookups = buildLookups(notes);
  const nodes = notes.map((note) => ({
    id: note.rel,
    title: note.title,
    url: note.url,
    folder: noteFolder(note.rel),
  }));
  const seen = new Set();
  const edges = [];
  for (const note of notes) {
    for (const target of extractLinkTargets(note.markdown)) {
      const resolved = resolveTarget(note.rel, target, lookups);
      if (!resolved) continue;
      const key = `${note.rel}→${resolved.rel}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ source: note.rel, target: resolved.rel });
    }
  }
  return { nodes, edges };
}
