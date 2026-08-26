window.addEventListener("DOMContentLoaded", () => {
  if (typeof PagefindUI === "undefined") return;
  const root = document.querySelector("#search");
  if (!root) return;

  new PagefindUI({
    element: "#search",
    showImages: false,
    showSubResults: true,
    resetStyles: false,
    translations: {
      placeholder: "Search notes…",
    },
  });
});
