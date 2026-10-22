const STORAGE_KEY = "garden-theme";
const OPTIONS = ["auto", "light", "dark"];
const LABELS = { auto: "system", light: "light", dark: "dark" };

function currentTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return OPTIONS.includes(stored) ? stored : "auto";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  const next = LABELS[OPTIONS[(OPTIONS.indexOf(theme) + 1) % OPTIONS.length]];
  for (const button of document.querySelectorAll(".theme-toggle")) {
    button.setAttribute("aria-label", `Color theme: ${LABELS[theme]}. Switch to ${next}`);
    button.title = `Theme: ${LABELS[theme]} (click for ${next})`;
  }
  document.documentElement.dispatchEvent(
    new CustomEvent("garden-theme-change", { detail: { theme } }),
  );
}

const initial = currentTheme();
document.documentElement.dataset.theme = initial;

for (const button of document.querySelectorAll(".theme-toggle")) {
  button.addEventListener("click", () => {
    const theme = document.documentElement.dataset.theme;
    applyTheme(OPTIONS[(OPTIONS.indexOf(theme) + 1) % OPTIONS.length]);
  });
}

applyTheme(initial);
