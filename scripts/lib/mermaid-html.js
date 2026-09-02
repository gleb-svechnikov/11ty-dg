import { renderMermaidSvg } from "./render-mermaid.js";

const FENCE =
  /<pre><code class="([^"]*\blanguage-mermaid\b[^"]*)">([\s\S]*?)<\/code><\/pre>/g;

export function decodeFenceHtml(html) {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

export function encodeMermaidSource(source) {
  return source.replace(/<\/script/gi, "<\\/script");
}

export function decodeMermaidSource(source) {
  return source.replace(/<\\\/script/gi, "</script");
}

function wrapFigure(svg, source) {
  return `<figure class="garden-mermaid tex2jax_ignore" data-mermaid-theme="default">
  <div class="garden-mermaid-svg">${svg}</div>
  <script type="text/plain" class="garden-mermaid-source" data-pagefind-ignore>${encodeMermaidSource(source)}</script>
</figure>`;
}

export async function transformMermaidHtml(html) {
  const matches = [...html.matchAll(FENCE)];
  if (matches.length === 0) return html;

  let out = "";
  let last = 0;
  let index = 0;
  for (const match of matches) {
    out += html.slice(last, match.index);
    const source = decodeFenceHtml(match[2]).trim();
    if (!source) {
      out += match[0];
    } else {
      try {
        const svg = await renderMermaidSvg(source, `garden-mermaid-${index}`);
        out += wrapFigure(svg, source);
        index += 1;
      } catch {
        out += match[0];
      }
    }
    last = match.index + match[0].length;
  }
  out += html.slice(last);
  return out;
}
