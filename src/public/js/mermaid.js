const STORAGE_KEY = "garden-theme";
const OPTIONS = ["auto", "light", "dark"];
const MERMAID_ESM =
  "https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs";

let mermaidMod;
let renderPass = 0;

function storedTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return OPTIONS.includes(stored) ? stored : "auto";
}

function resolvedTheme(stored) {
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function decodeMermaidSource(source) {
  return source.replace(/<\\\/script/gi, "</script");
}

async function loadMermaid() {
  if (!mermaidMod) {
    mermaidMod = import(MERMAID_ESM);
  }
  const mod = await mermaidMod;
  return mod.default ?? mod;
}

async function restyle() {
  const figures = document.querySelectorAll(".garden-mermaid");
  if (!figures.length) return;

  const stored = storedTheme();
  const resolved = resolvedTheme(stored);
  const mermaidTheme = resolved === "dark" ? "dark" : "default";

  if (resolved === "light" && !mermaidMod) return;

  try {
    const mermaid = await loadMermaid();
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      htmlLabels: false,
      theme: mermaidTheme,
      flowchart: { htmlLabels: false },
    });
    renderPass += 1;
    let index = 0;
    for (const figure of figures) {
      const sourceEl = figure.querySelector(".garden-mermaid-source");
      const target = figure.querySelector(".garden-mermaid-svg");
      if (!sourceEl || !target) continue;
      const source = decodeMermaidSource(sourceEl.textContent || "");
      try {
        const { svg } = await mermaid.render(
          `garden-mermaid-live-${renderPass}-${index}`,
          source,
        );
        target.innerHTML = svg;
        figure.dataset.mermaidTheme = mermaidTheme;
      } catch (error) {
        console.error(error);
      }
      index += 1;
    }
  } catch (error) {
    console.error(error);
  }
}

if (document.querySelector(".garden-mermaid")) {
  restyle();
  document.documentElement.addEventListener("garden-theme-change", restyle);
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (storedTheme() === "auto") restyle();
    });
}
