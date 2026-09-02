import { JSDOM } from "jsdom";

let mermaidPromise;

function setGlobal(name, value) {
  try {
    globalThis[name] = value;
  } catch {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value,
    });
  }
}

function ensureDom() {
  if (globalThis.document?.createElementNS) return;

  const { window } = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    pretendToBeVisual: true,
    url: "https://garden.local/",
  });

  setGlobal("window", window);
  setGlobal("document", window.document);
  setGlobal("DOMParser", window.DOMParser);
  setGlobal("XMLSerializer", window.XMLSerializer);
  setGlobal("navigator", window.navigator);
  setGlobal("CSSStyleSheet", window.CSSStyleSheet);
  setGlobal("CSS", window.CSS);
  setGlobal("HTMLElement", window.HTMLElement);
  setGlobal("SVGElement", window.SVGElement);
  setGlobal("Element", window.Element);
  setGlobal("Node", window.Node);
  setGlobal("DocumentFragment", window.DocumentFragment);
  setGlobal("getComputedStyle", window.getComputedStyle.bind(window));
  setGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 0));
  setGlobal("cancelAnimationFrame", (id) => clearTimeout(id));

  const proto = window.SVGElement.prototype;
  proto.getBBox = function getBBox() {
    return svgBBox(this);
  };
  proto.getComputedTextLength = function getComputedTextLength() {
    return (this.textContent || "").length * 8;
  };
}

function parseTranslate(el) {
  const transform = el.getAttribute?.("transform") || "";
  const match = transform.match(/translate\(\s*([-\d.]+)(?:[,\s]+([-\d.]+))?/);
  if (!match) return { x: 0, y: 0 };
  return { x: Number(match[1]), y: Number(match[2] || 0) };
}

function svgBBox(el) {
  const tag = (el.tagName || "").toLowerCase();
  const tr = parseTranslate(el);

  if (tag === "text" || tag === "tspan") {
    const width = Math.max(20, (el.textContent || "").length * 8);
    return { x: tr.x, y: tr.y - 14, width, height: 18 };
  }

  if (tag === "rect") {
    const width = parseFloat(el.getAttribute("width")) || 0;
    const height = parseFloat(el.getAttribute("height")) || 0;
    return {
      x: (parseFloat(el.getAttribute("x")) || 0) + tr.x,
      y: (parseFloat(el.getAttribute("y")) || 0) + tr.y,
      width: width || 10,
      height: height || 10,
    };
  }

  if (tag === "circle") {
    const r = parseFloat(el.getAttribute("r")) || 0;
    const cx = (parseFloat(el.getAttribute("cx")) || 0) + tr.x;
    const cy = (parseFloat(el.getAttribute("cy")) || 0) + tr.y;
    return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
  }

  if (tag === "ellipse") {
    const rx = parseFloat(el.getAttribute("rx")) || 0;
    const ry = parseFloat(el.getAttribute("ry")) || 0;
    const cx = (parseFloat(el.getAttribute("cx")) || 0) + tr.x;
    const cy = (parseFloat(el.getAttribute("cy")) || 0) + tr.y;
    return { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 };
  }

  if (tag === "line") {
    const x1 = (parseFloat(el.getAttribute("x1")) || 0) + tr.x;
    const y1 = (parseFloat(el.getAttribute("y1")) || 0) + tr.y;
    const x2 = (parseFloat(el.getAttribute("x2")) || 0) + tr.x;
    const y2 = (parseFloat(el.getAttribute("y2")) || 0) + tr.y;
    return {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1) || 1,
      height: Math.abs(y2 - y1) || 1,
    };
  }

  const kids = el.children ? [...el.children] : [];
  if (!kids.length) {
    return { x: tr.x, y: tr.y, width: 10, height: 10 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const kid of kids) {
    const box = svgBBox(kid);
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }
  return {
    x: minX + tr.x,
    y: minY + tr.y,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

async function initMermaid() {
  ensureDom();
  const { default: mermaid } = await import("mermaid");
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    htmlLabels: false,
    theme: "default",
    flowchart: { htmlLabels: false },
  });
  return mermaid;
}

async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = initMermaid().catch((error) => {
      mermaidPromise = undefined;
      throw error;
    });
  }
  return mermaidPromise;
}

export async function renderMermaidSvg(source, id) {
  const mermaid = await getMermaid();
  const { svg } = await mermaid.render(id, source);
  return svg;
}
