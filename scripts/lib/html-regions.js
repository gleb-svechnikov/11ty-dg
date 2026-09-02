const IGNORED =
  /<pre\b[\s\S]*?<\/pre>|<code\b[\s\S]*?<\/code>|<script\b[^>]*class="[^"]*\bgarden-mermaid-source\b[^"]*"[^>]*>[\s\S]*?<\/script>/gi;

export function mapOutsideIgnored(html, fn) {
  const parts = [];
  let last = 0;
  for (const match of html.matchAll(IGNORED)) {
    parts.push(fn(html.slice(last, match.index)));
    parts.push(match[0]);
    last = match.index + match[0].length;
  }
  parts.push(fn(html.slice(last)));
  return parts.join("");
}
