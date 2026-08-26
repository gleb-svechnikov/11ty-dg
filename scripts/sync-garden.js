import { existsSync } from "node:fs";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config from "../garden.config.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set([
  ".git",
  ".obsidian",
  ".claude",
  "node_modules",
  "_site",
  "ict-in-faces",
]);

function hasGardenFlag(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return Boolean(match && /^garden:\s*true\s*$/m.test(match[1]));
}

function isMarkdown(filePath) {
  return /\.md$/i.test(filePath);
}

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

function referencedFiles(notePath, text, notesRoot) {
  const dir = path.dirname(notePath);
  const refs = new Set();
  const add = (raw) => {
    const rel = raw.trim().replace(/^['"]|['"]$/g, "").split(/[?#]/)[0];
    if (!rel || /^(https?:|mailto:|#)/i.test(rel)) return;
    if (rel.startsWith("/")) {
      refs.add(path.normalize(path.join(notesRoot, rel)));
      refs.add(
        path.normalize(path.join(notesRoot, "collages", path.basename(rel))),
      );
      return;
    }
    refs.add(path.normalize(path.join(dir, decodeURIComponent(rel))));
  };
  for (const match of text.matchAll(/\[[^\]]*]\(([^)]+)\)/g)) add(match[1]);
  for (const match of text.matchAll(/^cover:\s*(.+)$/gm)) add(match[1]);
  for (const match of text.matchAll(/!\[\[([^\]|#]+)/g)) add(match[1]);
  return [...refs];
}

async function copyImageDir(src, dest) {
  let entries;
  try {
    entries = await readdir(src, { withFileTypes: true });
  } catch {
    return;
  }
  await mkdir(dest, { recursive: true });
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyImageDir(from, to);
    } else if (/\.(png|jpe?g|gif|svg|webp|avif|bmp|ico)$/i.test(entry.name)) {
      await cp(from, to);
    }
  }
}

async function copyIfExists(from, to) {
  try {
    await mkdir(path.dirname(to), { recursive: true });
    await cp(from, to);
    return true;
  } catch {
    return false;
  }
}

async function sync() {
  const contentRoot = path.join(ROOT, "content");
  await rm(contentRoot, { recursive: true, force: true });
  await mkdir(contentRoot, { recursive: true });
  await writeFile(path.join(contentRoot, ".gitkeep"), "");

  let notes = 0;
  let attachments = 0;

  for (const vault of config.vaults) {
    const vaultRoot = path.join(ROOT, vault.path);
    const notesRoot = vault.notes
      ? path.join(vaultRoot, vault.notes)
      : vaultRoot;
    const destRoot = path.join(contentRoot, vault.id);
    await mkdir(destRoot, { recursive: true });
    await writeFile(
      path.join(destRoot, `${vault.id}.11tydata.json`),
      `${JSON.stringify({ layout: "layout.njk" }, null, 2)}\n`,
    );

    for await (const file of walk(notesRoot)) {
      if (!isMarkdown(file)) continue;
      const text = await readFile(file, "utf8");
      if (!hasGardenFlag(text)) continue;
      const rel = path.relative(notesRoot, file);
      const dest = path.join(destRoot, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, text);
      notes += 1;
      for (const ref of referencedFiles(file, text, notesRoot)) {
        const relRef = path.relative(notesRoot, ref);
        if (relRef.startsWith("..")) continue;
        if (await copyIfExists(ref, path.join(destRoot, relRef))) {
          attachments += 1;
          continue;
        }
        const byName = path.join(notesRoot, "images", path.basename(ref));
        if (await copyIfExists(byName, path.join(destRoot, "images", path.basename(ref)))) {
          attachments += 1;
        }
      }
    }

    const imagesSrc = path.join(notesRoot, "images");
    if (existsSync(imagesSrc)) {
      await copyImageDir(imagesSrc, path.join(destRoot, "images"));
    }
  }

  console.log(`Synced ${notes} notes, ${attachments} attachments → content/`);
}

await sync();
