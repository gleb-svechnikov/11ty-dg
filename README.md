# 11ty-dg

Eleventy publisher for an Obsidian second brain: one or more vaults, one static digital garden.

Write and link notes in Obsidian. This repo turns opted-in notes into a fast static site. It is a **view** of the vaults, not the place the notes live.

## Why Eleventy

Markdown to HTML is a build step, not a runtime. That keeps publishing simple and the output a plain website.

## How it works

1. Each vault is its own git repo, nested here as a submodule (`vaults/<id>/`).
2. A sync script copies only notes with `garden: true` (and the attachments they reference) into `content/<id>/`.
3. Eleventy builds `src/` (site chrome) plus `content/` (notes) into `_site/`.
4. Unpublished files stay in the submodule and are never templates, collection items, or graph nodes.

Wikilinks resolve inside the current vault first. Two notes with the same title in different vaults get different URLs (`/life/foo/`, `/work/foo/`).

## Layout

| Path | Role |
| --- | --- |
| `vaults/` | Git submodules — Obsidian source of truth |
| `content/` | Generated publish subset (gitignored) |
| `src/` | Layouts and garden pages committed in this repo |
| `eleventy.config.js` | Eleventy input/ignores; does not read `vaults/` |
| `_site/` | Build output |

## Commands

```sh
bun install
bun run sync   # copy garden: true notes from vaults/ into content/
bun start      # sync, build, index with Pagefind, then local server
bun run build  # sync, write _site/, then index with Pagefind
```

Search is powered by [Pagefind](https://pagefind.app/). It indexes published notes after each Eleventy build. Set `SKIP_PAGEFIND=1` to skip indexing during fast local rebuilds.
`garden: true` stays in the vault note. Sync copies that file (flag included) into `content/<vault-id>/`. Eleventy never reads `vaults/` directly.

## Updating vaults

Vaults are git submodules. A clone of this repo does not contain notes until the submodules are initialized. Each submodule tracks a branch in `.gitmodules` (`ict` → `main`, `ict-in-faces` → `gitbook`).

```sh
# first clone, or a clone that skipped submodules
git submodule update --init --recursive

# fetch the tracked branch of every vault and check it out
git submodule update --remote
```

To refresh one vault:

```sh
git submodule update --remote vaults/ict
```

`git submodule update --remote` moves the recorded commit in this repo. Commit that pointer so others (and CI) get the same notes, then rebuild:

```sh
git add vaults/ict vaults/ict-in-faces
git commit -m "Update vault submodules"
bun run sync
```

Do not edit notes in `vaults/` from this repo. Publish flags and content belong in the vault repos; this repo only pins which commit of each vault to publish.

## Out of scope

This is not an Obsidian clone in the browser. No Dataview. The garden should stay a readable, linked reflection of published notes.
