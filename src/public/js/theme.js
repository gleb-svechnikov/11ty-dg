const STORAGE_KEY = "garden-theme";
const OPTIONS = ["auto", "light", "dark"];

function currentTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return OPTIONS.includes(stored) ? stored : "auto";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  for (const button of document.querySelectorAll("[data-theme-option]")) {
    button.setAttribute(
      "aria-checked",
      String(button.dataset.themeOption === theme),
    );
  }
  document.documentElement.dispatchEvent(
    new CustomEvent("garden-theme-change", { detail: { theme } }),
  );
}

const initial = currentTheme();
document.documentElement.dataset.theme = initial;

for (const button of document.querySelectorAll("[data-theme-option]")) {
  button.addEventListener("click", () => applyTheme(button.dataset.themeOption));
}

applyTheme(initial);
