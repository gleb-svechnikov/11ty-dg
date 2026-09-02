# Mermaid diagrams in the garden

Obsidian ` ```mermaid ` fences should publish as diagrams, not as source listings. The garden already follows a static-HTML-first model (with MathJax as the one client renderer). Mermaid follows that model: bake an SVG at build, and load Mermaid.js only when the resolved theme does not match that SVG.

## Decisions

- **Hybrid rendering.** Build one SVG. The browser does not load Mermaid.js unless it needs a different theme.
- **One baked theme.** The build SVG uses Mermaid’s `default` (light) theme.
- **Theme mismatch re-renders.** On first load, if the resolved theme is dark, load Mermaid.js and replace the baked SVG. The same path runs on every later Light / Dark / Auto change.
- **No Chromium.** Build-time SVG comes from the `mermaid` package in Node (DOM shim via `jsdom`), not mermaid-cli / Puppeteer.
- **Notes stay in vaults.** This repo does not add sample garden notes. Publisher tests use fixtures, not `vaults/`.

## Architecture

Eleventy’s default markdown-it already turns ` ```mermaid ` into `<pre><code class="language-mermaid">`. A new Eleventy transform finds those blocks, renders SVG, and wraps each diagram with the original source kept in a non-executed `<script type="text/plain">`.

A small layout script inspects those wrappers. If none exist, it exits. Otherwise it resolves Auto → light/dark and dynamic-imports a version-pinned Mermaid ESM from jsDelivr only when the resolved theme is not `default`, or when the visitor later changes theme. `theme.js` dispatches `garden-theme-change` so diagrams restyle without duplicating theme logic.

MathJax ignores mermaid wrappers (`tex2jax_ignore`) so `$` in labels is not TeX. Pagefind ignores the source `<script>` so search can still index SVG label text.

Wikilink rewriting must not run inside mermaid source (or other fenced code). The existing `[[…]]` transform is global today; it will skip `pre`, `code`, and `.garden-mermaid-source`.

```
vault note (```mermaid)
        │
        ▼
   markdown-it  →  <pre><code class="language-mermaid">
        │
        ▼
 mermaid transform  →  <figure.garden-mermaid> + baked SVG + source script
        │
        ▼
 obsidian-wiki transform (skips pre/code/mermaid source)
        │
        ▼
   _site HTML
        │
        ▼
 mermaid.js (no-op, or dynamic-import mermaid on dark / theme change)
```

## Components

### `scripts/lib/render-mermaid.js`

Node helper. Initializes Mermaid once:

- `startOnLoad: false`
- `securityLevel: "strict"`
- `htmlLabels: false` (SVG text, required for Node)
- `theme: "default"`

Exports `renderMermaidSvg(source, id) → Promise<string>` (SVG markup). Unique `id` values are required; the caller passes `garden-mermaid-${index}`. Installs a `jsdom` `window` / `document` before importing `mermaid` if those globals are missing.

### Eleventy transform `mermaid-diagrams`

In `eleventy.config.js`, an async transform on HTML from `.md` files. Register it **before** `obsidian-wiki` so mermaid source is already in a skipped `<script>` when wikilinks run. For each `<pre><code class="language-mermaid">…</code></pre>`:

1. Decode the code text (markdown-it HTML-escapes it).
2. Call `renderMermaidSvg`.
3. Replace the `<pre>` with:

```html
<figure class="garden-mermaid tex2jax_ignore" data-mermaid-theme="default">
  <div class="garden-mermaid-svg">…svg…</div>
  <script type="text/plain" class="garden-mermaid-source" data-pagefind-ignore>…source…</script>
</figure>
```

The source script’s text must not contain a raw `</script>`. Replace that sequence with `<\/script>` when writing, and reverse it when reading on the client.

Invalid mermaid at build does **not** fail the site. Leave the original `<pre><code class="language-mermaid">` in place.

### `src/public/js/mermaid.js`

Always included from `layout.njk` (tiny). If `document.querySelector(".garden-mermaid")` is null, return.

Resolve theme:

- stored `garden-theme` `light` | `dark` | `auto` (default `auto`)
- `auto` → `matchMedia("(prefers-color-scheme: dark)")` → `dark` or `light`

If resolved is `light` and Mermaid.js has never been loaded, leave the baked SVG.

If resolved is `dark`, or Mermaid.js is already loaded and the theme changed:

1. Dynamic-import `https://cdn.jsdelivr.net/npm/mermaid@<pinned>/dist/mermaid.esm.min.mjs` (same major.minor as the npm `mermaid` dependency).
2. `mermaid.initialize({ startOnLoad: false, securityLevel: "strict", htmlLabels: false, theme })` where `theme` is `"dark"` or `"default"` — same options as Node besides `theme`, so a re-render does not change label layout.
3. For each figure, `mermaid.render("garden-mermaid-live-" + index, source)` (new ids each pass so leftover SVG ids do not collide) and replace `.garden-mermaid-svg` inner HTML.
4. Set `data-mermaid-theme` to the theme just applied.

Listen to `garden-theme-change` and `matchMedia("(prefers-color-scheme: dark")` (only while stored theme is `auto`).

Once Mermaid.js has loaded, later toggles (including back to light) re-render with Mermaid.js rather than trying to restore a cloned baked SVG.

### `src/public/js/theme.js`

`applyTheme` dispatches `new CustomEvent("garden-theme-change", { detail: { theme } })` on `document.documentElement` after setting `data-theme`. `theme` is `auto` | `light` | `dark`.

### Layout, CSS, MathJax, features

- `src/_includes/layout.njk` — `<script src="/js/mermaid.js">` after `theme.js`.
- `src/public/css/garden.css` — `.garden-mermaid` / SVG `max-width: 100%`, horizontal overflow like `mjx-container[display="true"]` and tables.
- `src/public/js/mathjax-config.js` — keep `ignoreHtmlClass: "tex2jax_ignore"` (wrappers already have that class).
- `FEATURES.md` — add a mermaid bullet next to MathJax.
- `package.json` — `mermaid` and `jsdom` as dependencies (build-time). Client Mermaid comes from the CDN, not a passthrough copy.

### Wikilink transform

`obsidianTransform` skips replacements inside `<pre>`, `<code>`, and `script.garden-mermaid-source` so diagram source cannot become `<a href>`.

## Data flow

**Build, per note**

1. markdown-it emits a mermaid code block.
2. `mermaid-diagrams` extracts source, renders light SVG, writes the figure wrapper.
3. `obsidian-wiki` rewrites images, wikilinks, callouts, tables — not mermaid source.
4. HTML is written to `_site`.

**Browser, per page**

1. `theme.js` applies stored theme and emits `garden-theme-change`.
2. `mermaid.js` sees zero or more `.garden-mermaid` figures.
3. Resolved theme `light` → stop (baked SVG).
4. Resolved theme `dark` → import Mermaid.js → render `theme: "dark"` into each `.garden-mermaid-svg`.
5. Later theme changes repeat step 4 with `"dark"` or `"default"`. CDN load happens at most once.

## Error handling

| Case | Behavior |
| --- | --- |
| Invalid / unsupported diagram at build | Keep `<pre><code class="language-mermaid">`. Build succeeds. |
| `jsdom` / mermaid throws for one block | Same as invalid: leave that block as source; continue other blocks. |
| Mermaid.js CDN fails | Keep whatever SVG is on the page (baked light). `console.error`. |
| Client `mermaid.render` throws | Keep the last SVG in that figure. `console.error`. |
| Empty fence | Leave as a code block; do not wrap. |
| `</script>` in source | Escaped when written into the source tag so the HTML parser does not close early. |

## Testing

No test runner is in the repo today. Use Node’s built-in test runner (`node --test`) on publisher fixtures only.

- `scripts/lib/render-mermaid.test.js` — a tiny `flowchart TD` / `A-->B` source returns an `<svg` string; obviously invalid source rejects or throws in a way the transform can catch.
- Transform coverage can be a small helper exported for tests, or exercised through `renderMermaidSvg` plus a fixture HTML string in the same test file. Do not add Eleventy as a test harness.
- Browser check (implementation time): a local unpublished fixture or a one-off `content/` note is enough; do not commit vault notes. Confirm:
  - Light / default Auto: diagrams visible, no Mermaid.js network request.
  - Dark (saved or Auto at night): diagrams re-render after Mermaid.js loads.
  - Theme toggle light ↔ dark updates diagrams without a full reload.
  - A page with no mermaid fences does not request Mermaid.js.
  - A bad fence still shows the source listing.

## Out of scope

- mermaid-cli, Puppeteer, Playwright, or any headless browser.
- Dual light/dark SVGs in the HTML.
- Pan / zoom / click-to-source.
- Syntax highlighting for mermaid source listings (invalid diagrams stay as `pre`).
- Dataview or other Obsidian runtime plugins.
- Changing MathJax’s “load on every page” behavior.
