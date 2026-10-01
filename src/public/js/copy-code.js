// Adds a one-click "Copy" button to every code block in a note.
const RESET_MS = 1600;

function codeText(pre) {
  return (pre.querySelector("code") ?? pre).textContent.replace(/\n$/, "");
}

function flash(button, label) {
  button.textContent = label;
  clearTimeout(button._reset);
  button._reset = setTimeout(() => {
    button.textContent = "Copy";
  }, RESET_MS);
}

for (const pre of document.querySelectorAll("main pre")) {
  if (pre.closest(".garden-mermaid")) continue;

  const wrapper = document.createElement("div");
  wrapper.className = "code-block";
  pre.replaceWith(wrapper);
  wrapper.append(pre);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "code-copy";
  button.textContent = "Copy";
  button.setAttribute("aria-label", "Copy code to clipboard");
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(codeText(pre));
      flash(button, "Copied");
    } catch {
      flash(button, "Failed");
    }
  });
  wrapper.append(button);
}
