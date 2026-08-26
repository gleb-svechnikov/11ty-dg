# Agent notes

This repo is an Eleventy **publisher** for Obsidian vaults. Notes are written in Obsidian, not here.

## Architecture

- Vaults live as git submodules under `vaults/<id>/`.
- Only notes with `garden: true` in frontmatter are published (opt-in).
- A sync step copies those notes (and referenced attachments) into `content/<id>/`. That tree is generated and gitignored.
- Eleventy reads `src/` (site chrome) and `content/` (notes). It must **not** read `vaults/`.
- URLs are namespaced by vault id (`/life/foo/`, `/work/foo/`). `[[Note]]` resolves inside the current vault first.

## Do

- Keep unpublished markdown out of `_site/` and out of git as garden content.
- Put wiki behavior (wikilinks, backlinks) in small helpers, not in vault-folder 11ty inputs.
- Ignore `.obsidian/` and skip Dataview (runtime queries, not static HTML).

## Do not

- Duplicate vaults into `src/` as the source of truth.
- Add a second publish filter inside Eleventy that can disagree with sync.
- Commit `content/` (except `.gitkeep`) or `_site/`.
