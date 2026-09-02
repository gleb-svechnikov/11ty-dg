# Mermaid Diagrams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Obsidian ` ```mermaid ` fences as baked light SVGs, and re-render with Mermaid.js only when the resolved theme is dark or the visitor changes theme.

**Architecture:** A Node helper renders SVG with `mermaid` + `jsdom`. An Eleventy transform wraps mermaid code blocks. A tiny layout script dynamic-imports pinned Mermaid ESM from jsDelivr when needed. Wikilink rewriting skips `pre`, `code`, and mermaid source tags.

**Tech Stack:** Eleventy 3, markdown-it (default), `mermaid`, `jsdom`, Node `node --test`, existing `theme.js` / `layout.njk`.

## Global Constraints

- Build SVG uses Mermaid theme `default` (light); no Chromium / mermaid-cli.
- Invalid or empty fences stay as `<pre><code class="language-mermaid">`; the build must not fail.
- Client loads Mermaid.js from jsDelivr, version-pinned to the npm `mermaid` major.minor, and only when diagrams exist and the resolved theme is dark (or Mermaid.js already loaded).
- `mermaid.initialize` uses `startOnLoad: false`, `securityLevel: "strict"`, `htmlLabels: false` on both Node and client.
- Notes stay in vaults; tests use publisher fixtures only.
- Do not commit unrelated last-edited WIP in `eleventy.config.js`, `layout.njk`, or `garden.css`.

## File structure

- Create: `scripts/lib/render-mermaid.js` — `renderMermaidSvg(source, id)`
- Create: `scripts/lib/mermaid-html.js` — fence decode, source escape, `transformMermaidHtml(html)`
- Create: `scripts/lib/html-regions.js` — `mapOutsideIgnored(html, fn)`
- Create: `scripts/lib/render-mermaid.test.js`, `scripts/lib/mermaid-html.test.js`, `scripts/lib/html-regions.test.js`
- Create: `src/public/js/mermaid.js`
- Modify: `eleventy.config.js` — mermaid transform before wiki; wiki uses `mapOutsideIgnored`
- Modify: `src/public/js/theme.js` — dispatch `garden-theme-change`
- Modify: `src/_includes/layout.njk` — script after theme.js
- Modify: `src/public/css/garden.css` — `.garden-mermaid` overflow
- Modify: `FEATURES.md`, `package.json`

---

### Task 1: Node SVG renderer

**Files:**
- Create: `scripts/lib/render-mermaid.js`
- Test: `scripts/lib/render-mermaid.test.js`
- Modify: `package.json` (add `mermaid`, `jsdom`, `"test": "node --test"`)

**Interfaces:**
- Consumes: mermaid source string, unique id string
- Produces: `export async function renderMermaidSvg(source: string, id: string): Promise<string>` — SVG markup starting with `<svg`. Throws on invalid source.

- [ ] **Step 1: Add deps and a failing test**

```sh
npm install mermaid jsdom
```

Add to `package.json` scripts: `"test": "node --test"`.

```js
// scripts/lib/render-mermaid.test.js
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderMermaidSvg } from "./render-mermaid.js";

test("renders a flowchart to SVG", async () => {
  const svg = await renderMermaidSvg("flowchart TD\n  A-->B", "garden-mermaid-0");
  assert.match(svg, /<svg[\s>]/i);
});

test("rejects invalid mermaid source", async () => {
  await assert.rejects(() =>
    renderMermaidSvg("this is not mermaid", "garden-mermaid-bad"),
  );
});
```

- [ ] **Step 2: Run tests — expect fail** (`Cannot find package` or `Cannot find module`)

Run: `node --test scripts/lib/render-mermaid.test.js`

- [ ] **Step 3: Implement `renderMermaidSvg`**

Install a `jsdom` window on `globalThis` before importing mermaid. Initialize once. `flowchart.htmlLabels` must be `false` as well as top-level `htmlLabels`.

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Record the installed mermaid version** from `node_modules/mermaid/package.json` for the CDN pin in Task 4.

---

### Task 2: HTML transform helper

**Files:**
- Create: `scripts/lib/mermaid-html.js`
- Test: `scripts/lib/mermaid-html.test.js`

**Interfaces:**
- Consumes: `renderMermaidSvg(source, id)`
- Produces:
  - `export function decodeFenceHtml(html: string): string`
  - `export function encodeMermaidSource(source: string): string` — `</script>` → `<\/script>`
  - `export function decodeMermaidSource(source: string): string` — reverse
  - `export async function transformMermaidHtml(html: string): Promise<string>`

Wrapper HTML:

```html
<figure class="garden-mermaid tex2jax_ignore" data-mermaid-theme="default">
  <div class="garden-mermaid-svg">SVG</div>
  <script type="text/plain" class="garden-mermaid-source" data-pagefind-ignore>SOURCE</script>
</figure>
```

Match fences with `class` containing `language-mermaid`. Decode entities (`&amp;` last). Empty/whitespace source: leave the `<pre>` unchanged. If `renderMermaidSvg` throws: leave that `<pre>` unchanged; continue other blocks. Ids: `garden-mermaid-${index}` in document order.

- [ ] **Step 1: Write failing tests** for wrap, empty, invalid, `</script>` in source, entity decode (`A--&gt;B`).

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Implement `mermaid-html.js`**

- [ ] **Step 4: Run — expect pass**

---

### Task 3: Skip wikilinks inside code and mermaid source

**Files:**
- Create: `scripts/lib/html-regions.js`
- Test: `scripts/lib/html-regions.test.js`
- Modify: `eleventy.config.js` (`obsidianTransform` image + wikilink replaces)

**Interfaces:**
- Produces: `export function mapOutsideIgnored(html, fn)` — `fn` applied to text outside `<pre>…</pre>`, `<code>…</code>`, and `<script class="…garden-mermaid-source…">…</script>`.

- [ ] **Step 1: Failing tests** — `[[A]]` outside becomes transformed; `[[B]]` inside `pre` / `code` / mermaid source script is unchanged.

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Implement matcher** (pre first so inner code is part of the pre chunk). Wire `obsidianTransform` so both `![[` and `[[` replaces run through `mapOutsideIgnored`.

- [ ] **Step 4: Run — expect pass**

---

### Task 4: Eleventy + client restyle

**Files:**
- Modify: `eleventy.config.js` — `addTransform("mermaid-diagrams", …)` **before** `obsidian-wiki`; only `.md` / HTML strings; async.
- Modify: `src/public/js/theme.js`
- Create: `src/public/js/mermaid.js`
- Modify: `src/_includes/layout.njk`
- Modify: `src/public/css/garden.css`
- Modify: `FEATURES.md`

`theme.js` `applyTheme` ends with:

```js
document.documentElement.dispatchEvent(
  new CustomEvent("garden-theme-change", { detail: { theme } }),
);
```

`mermaid.js`:

- Exit if no `.garden-mermaid`.
- Resolve `localStorage garden-theme`: `light` | `dark` | `auto` (default auto). Auto uses `matchMedia("(prefers-color-scheme: dark)")`.
- Light and mermaid never loaded → return.
- Else dynamic-import `https://cdn.jsdelivr.net/npm/mermaid@MAJOR.MINOR/dist/mermaid.esm.min.mjs` once (MAJOR.MINOR from Task 1).
- Initialize with `theme: "dark"` or `"default"`, same strict/htmlLabels flags.
- `mermaid.render("garden-mermaid-live-" + index, decodeMermaidSource(script.textContent))`; replace `.garden-mermaid-svg`; set `data-mermaid-theme`.
- CDN / render errors: `console.error`, keep last SVG.
- Listen to `garden-theme-change` and `prefers-color-scheme` when stored theme is `auto`.

CSS (next to `mjx-container` rules):

```css
.garden-mermaid {
  max-width: 100%;
  margin: 1.25em 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.garden-mermaid .garden-mermaid-svg svg {
  max-width: 100%;
  height: auto;
}
```

Layout: `<script src="/js/mermaid.js"></script>` immediately after `theme.js`.

FEATURES: `- Mermaid diagrams`.

- [ ] **Step 1: Implement the wiring** (no Eleventy test harness; covered by helpers + browser check).

- [ ] **Step 2: `SKIP_PAGEFIND=1 npx eleventy` succeeds**

---

### Task 5: Browser verification

Do not commit vault notes. Use a local `content/` fixture (gitignored) or an existing published note.

- [ ] Light / Auto-light: diagram visible; Network has no `mermaid.esm`.
- [ ] Dark (saved or Auto + dark OS): Mermaid.js loads; diagram restyles.
- [ ] Toggle light ↔ dark updates without reload.
- [ ] Page with no mermaid: no Mermaid.js request.
- [ ] Invalid fence remains a source listing.
