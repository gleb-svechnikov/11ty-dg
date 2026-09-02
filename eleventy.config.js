/**
 * Site chrome lives in src/. Opted-in vault notes are copied into
 * content/<vault-id>/ by `npm run sync`.
 *
 * Vault submodules in vaults/ are never an Eleventy input — unpublished
 * notes must not become pages.
 */
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import garden from "./garden.config.js";
import { mapOutsideIgnored } from "./scripts/lib/html-regions.js";
import { transformMermaidHtml } from "./scripts/lib/mermaid-html.js";
import { buildVaultGraph, noteTitle } from "./scripts/lib/vault-graph.js";

function vaultIdFromInput(inputPath) {
  const match = inputPath.replace(/\\/g, "/").match(/\/content\/([^/]+)\//);
  return match?.[1] ?? null;
}

function relFromInput(inputPath, vaultId) {
  const normalized = inputPath.replace(/\\/g, "/");
  const marker = `/content/${vaultId}/`;
  return normalized.slice(normalized.indexOf(marker) + marker.length);
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function obsidianTransform(content, inputPath) {
  const vaultId = vaultIdFromInput(inputPath);
  if (!vaultId || !inputPath.endsWith(".md")) return content;

  content = mapOutsideIgnored(content, (chunk) => {
    chunk = chunk.replace(/!\[\[(.*?)\]\]/g, (_, imagePath) => {
      let actualImagePath = imagePath;
      let altText = path.parse(imagePath).name;
      if (imagePath.includes("|")) {
        const parts = imagePath.split("|");
        actualImagePath = parts[0];
        altText = parts.slice(1).join("|");
      }
      const imageName = path.basename(actualImagePath.trim());
      return `<img src="/${vaultId}/images/${encodeURI(imageName)}" alt="${escapeAttr(altText)}">`;
    });

    return chunk.replace(/\[\[(.*?)\]\]/g, (_, linkText) => {
      let actualLink = linkText;
      let displayText = linkText;
      if (linkText.includes("|")) {
        const parts = linkText.split("|");
        actualLink = parts[0];
        displayText = parts.slice(1).join("|");
      }
      if (actualLink.match(/^https?:\/\//) || actualLink.includes(".")) {
        return `<a href="${escapeAttr(actualLink)}">${escapeAttr(displayText)}</a>`;
      }
      const slug = actualLink.trim().replace(/ /g, "%20");
      if (displayText === linkText) {
        displayText = path.basename(actualLink, path.extname(actualLink));
      }
      return `<a href="/${vaultId}/${slug}/">${escapeAttr(displayText)}</a>`;
    });
  });

  content = transformCallouts(content);

  content = content.replace(
    /<table\b[\s\S]*?<\/table>/gi,
    (table) => `<div class="table-scroll">${table}</div>`,
  );

  return content;
}

const CALLOUT_TYPES = new Set([
  "note",
  "abstract",
  "info",
  "todo",
  "tip",
  "success",
  "question",
  "faq",
  "warning",
  "attention",
  "caution",
  "failure",
  "error",
  "danger",
  "bug",
  "example",
  "quote",
]);

function calloutLabel(type) {
  if (type === "faq") return "FAQ";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function transformCallouts(content) {
  return content.replace(
    /<blockquote>([\s\S]*?)<\/blockquote>/gi,
    (full, inner) => {
      const match = inner.match(
        /^\s*<p(?:\s[^>]*)?>\s*\[!\s*([a-z0-9_-]+)\]([+-]?)\s*([\s\S]*)$/i,
      );
      if (!match) return full;

      const type = match[1].toLowerCase();
      const slug = CALLOUT_TYPES.has(type) ? type : "note";
      let body = match[3];

      if (/^\s*<\/p>/i.test(body)) {
        body = body.replace(/^\s*<\/p>/i, "");
      } else if (!/^\s*</.test(body)) {
        body = `<p>${body}`;
      }

      body = body.trim();
      if (!body) body = "";

      return `<aside class="callout callout--${escapeAttr(slug)}" data-callout="${escapeAttr(type)}"><p class="callout-label">${escapeAttr(calloutLabel(type))}</p><div class="callout-body">${body}</div></aside>`;
    },
  );
}

export default async function (eleventyConfig) {
  // content/ is gitignored, but it is a real input once sync exists.
  eleventyConfig.setUseGitIgnore(false);

  for (const pattern of [
    "node_modules/**",
    "_site/**",
    "vaults/**",
    "README.md",
    "AGENTS.md",
    "FEATURES.md",
    "garden.config.js",
    "scripts/**",
  ]) {
    eleventyConfig.ignores.add(pattern);
  }

  eleventyConfig.addWatchTarget("content/");
  eleventyConfig.addWatchTarget("src/public/");
  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
  eleventyConfig.addPassthroughCopy({ "src/public": "/" });
  for (const vault of garden.vaults) {
    eleventyConfig.addPassthroughCopy({
      [`content/${vault.id}`]: vault.id,
    });
  }

  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink(data) {
      const stem = data.page?.filePathStem ?? "";
      if (stem.startsWith("/content/")) {
        return `${stem.slice("/content".length)}/`;
      }
      return data.permalink;
    },
    title(data) {
      if (data.title) return data.title;
      const inputPath = data.page?.inputPath;
      if (
        inputPath &&
        inputPath.replace(/\\/g, "/").includes("/content/") &&
        inputPath.endsWith(".md")
      ) {
        return noteTitle(readFileSync(inputPath, "utf8"), inputPath);
      }
      return data.title;
    },
    gardenVault(data) {
      return vaultIdFromInput(data.page?.inputPath ?? "");
    },
    coverUrl(data) {
      const cover = data.cover;
      if (!cover || typeof cover !== "string") return null;
      const stem = data.page?.filePathStem ?? "";
      const match = stem.match(/^\/content\/([^/]+)\/(.*)$/);
      if (!match) return null;
      const vaultId = match[1];
      const noteDir = path.posix.dirname(match[2]);
      const cleaned = cover.trim().replace(/^['"]|['"]$/g, "");
      if (/^https?:/i.test(cleaned)) return cleaned;
      const candidates = [];
      if (cleaned.startsWith("/")) {
        candidates.push(cleaned.replace(/^\/+/, ""));
        candidates.push(`collages/${path.posix.basename(cleaned)}`);
      } else {
        candidates.push(path.posix.normalize(`${noteDir}/${cleaned}`));
      }
      for (const candidate of candidates) {
        const file = path.join("content", vaultId, candidate);
        if (existsSync(file)) {
          return `/${vaultId}/${candidate}`.replace(/\/{2,}/g, "/");
        }
      }
      return null;
    },
    coverPosition(data) {
      if (data.coverY == null || data.coverY === "") return "center 30%";
      const value = Number(data.coverY);
      if (Number.isNaN(value)) return "center 30%";
      const percent = value >= 0 && value <= 1 ? value * 100 : value;
      return `center ${percent}%`;
    },
  });

  eleventyConfig.addCollection("gardenNotes", (api) =>
    api
      .getFilteredByGlob("content/**/*.md")
      .map((item) => {
        const vaultId = vaultIdFromInput(item.inputPath);
        if (!vaultId) return item;
        const markdown = readFileSync(item.inputPath, "utf8");
        item.data.gardenVault = vaultId;
        item.data.gardenRel = relFromInput(item.inputPath, vaultId);
        item.data.gardenTitle = noteTitle(markdown, item.inputPath);
        return item;
      })
      .filter((item) => item.data.gardenVault)
      .sort((a, b) => a.data.gardenRel.localeCompare(b.data.gardenRel)),
  );

  eleventyConfig.addFilter("notesInVault", (notes, vaultId) =>
    (notes || []).filter((note) => note.data.gardenVault === vaultId),
  );

  eleventyConfig.addFilter("notesTree", (notes) => {
    const root = { type: "dir", name: "", children: [] };

    const ensureDir = (parts) => {
      let node = root;
      for (const part of parts) {
        let child = node.children.find(
          (entry) => entry.type === "dir" && entry.name === part,
        );
        if (!child) {
          child = { type: "dir", name: part, children: [] };
          node.children.push(child);
        }
        node = child;
      }
      return node;
    };

    for (const note of notes || []) {
      const rel = String(note.data.gardenRel || "").replace(/\\/g, "/");
      const parts = rel.split("/").filter(Boolean);
      const fileName = parts.pop() || rel;
      const dir = ensureDir(parts);
      dir.children.push({
        type: "file",
        name: fileName,
        title: note.data.gardenTitle || fileName,
        url: note.url,
      });
    }

    const sortNode = (node) => {
      node.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
      for (const child of node.children) {
        if (child.type === "dir") sortNode(child);
      }
    };
    sortNode(root);
    return root.children;
  });

  eleventyConfig.addFilter("vaultGraph", (notes) =>
    buildVaultGraph(
      (notes || []).map((note) => ({
        rel: note.data.gardenRel,
        title: note.data.gardenTitle,
        url: note.url,
        markdown: readFileSync(note.inputPath, "utf8"),
      })),
    ),
  );

  eleventyConfig.addFilter("toJson", (value) =>
    JSON.stringify(value).replace(/</g, "\\u003c"),
  );

  eleventyConfig.addTransform("mermaid-diagrams", async function (content) {
    const inputPath = this.inputPath?.replace(/\\/g, "/") ?? "";
    if (!inputPath.endsWith(".md") || typeof content !== "string") {
      return content;
    }
    return transformMermaidHtml(content);
  });

  eleventyConfig.addTransform("obsidian-wiki", function (content) {
    return obsidianTransform(content, this.inputPath?.replace(/\\/g, "/") ?? "");
  });

  eleventyConfig.on("eleventy.after", () => {
    if (process.env.SKIP_PAGEFIND === "1") return;
    const output = path.resolve("_site");
    if (!existsSync(output)) return;
    execFileSync("npx", ["pagefind", "--site", output], {
      stdio: "inherit",
    });
  });

  return {
    dir: {
      input: ".",
      includes: "src/_includes",
      data: "src/_data",
      output: "_site",
    },
    templateFormats: ["md", "njk", "html"],
    // Vault notes are Obsidian markdown. Preprocessing them as Nunjucks
    // breaks on Logseq queries, Vue snippets, and anything with `{{ }}`.
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
