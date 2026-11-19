#!/bin/sh
# Build a two-column paper PDF from the workflow note.
# Needs: pandoc, a TeX distribution with xelatex (BasicTeX is enough).
set -eu
cd "$(dirname "$0")"
eval "$(/usr/libexec/path_helper)"

SRC="../Teacher's Knowledge Management Workflow.md"
OUT="teachers-knowledge-workflow.pdf"
mkdir -p build

pandoc "$SRC" \
  --from commonmark_x+autolink_bare_uris+yaml_metadata_block \
  --lua-filter paper.lua \
  --include-in-header header.tex \
  --pdf-engine xelatex \
  --resource-path .:.. \
  -V documentclass=article \
  -V classoption=twocolumn \
  -V fontsize=10pt \
  -V papersize=a4 \
  -V geometry:margin=1.8cm \
  -V geometry:top=2cm \
  -V geometry:bottom=2.2cm \
  -V indent=true \
  -V mainfont=STIXGeneral \
  -V mathfont="STIX Two Math" \
  -V monofont=Menlo \
  -V monofontoptions=Scale=0.82 \
  -V colorlinks=true \
  -V linkcolor=black -V urlcolor=webstroke \
  -o build/paper.tex

# TEXINPUTS lets \input{workflow-diagram.tex} find the file from build/.
cd build
# Two passes so float numbers and references settle.
for pass in 1 2; do
  TEXINPUTS=..: xelatex -interaction=nonstopmode -halt-on-error paper.tex >/dev/null \
    || { grep -A3 '^!' paper.log; exit 1; }
done
cp paper.pdf "../$OUT"
echo "Wrote paper/$OUT"
