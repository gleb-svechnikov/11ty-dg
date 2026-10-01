import Prism from "prismjs";
import loadLanguages from "prismjs/components/index.js";

loadLanguages.silent = true;

// Fences Prism should leave alone (Mermaid is rendered by mermaid-html.js).
const PLAIN = new Set(["", "text", "txt", "plain", "plaintext", "mermaid"]);

/**
 * markdown-it `highlight` hook. Returns highlighted inner HTML so markdown-it
 * still wraps it in <pre><code class="language-x">, or "" to let markdown-it
 * escape the block itself (unknown languages, plain text, Mermaid).
 */
export function highlightCode(code, info) {
  const lang = (info ?? "").trim().split(/\s+/)[0].toLowerCase();
  if (PLAIN.has(lang)) return "";
  if (!Prism.languages[lang]) loadLanguages([lang]);
  const grammar = Prism.languages[lang];
  if (!grammar) return "";
  return Prism.highlight(code, grammar, lang);
}
