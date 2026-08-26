const STORAGE_KEY = "vault-view";

function setView(view) {
  const panels = document.querySelectorAll("[data-vault-panel]");
  if (!panels.length) return;
  const next =
    view === "graph" && document.querySelector("[data-vault-panel='graph']")
      ? "graph"
      : "list";
  sessionStorage.setItem(STORAGE_KEY, next);
  document.body.classList.toggle("graph-explorer", next === "graph");
  for (const panel of panels) {
    panel.hidden = panel.dataset.vaultPanel !== next;
  }
  for (const button of document.querySelectorAll("[data-vault-view]")) {
    button.setAttribute("aria-checked", String(button.dataset.vaultView === next));
  }
  syncHeaderHeight();
  if (next === "graph") {
    window.dispatchEvent(new Event("vault-graph-show"));
  }
}

function syncHeaderHeight() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  document.documentElement.style.setProperty(
    "--header-height",
    `${Math.ceil(header.getBoundingClientRect().height)}px`,
  );
}

for (const button of document.querySelectorAll("[data-vault-view]")) {
  button.addEventListener("click", () => {
    if (!button.disabled) setView(button.dataset.vaultView);
  });
}

setView(sessionStorage.getItem(STORAGE_KEY) || "list");
window.addEventListener("resize", syncHeaderHeight);
