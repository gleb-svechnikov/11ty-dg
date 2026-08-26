const FOLDER_HUES = {
  Concepts: 152,
  Languages: 210,
  Protocols: 32,
  Software: 268,
  Vizualisations: 348,
  Lessons: 188,
  Math: 48,
  Programs: 8,
  Root: 120,
};

function themeColors() {
  const styles = getComputedStyle(document.documentElement);
  const dark =
    document.documentElement.dataset.theme === "dark" ||
    (document.documentElement.dataset.theme === "auto" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  return {
    ink: styles.getPropertyValue("--ink").trim() || "#1c2420",
    muted: styles.getPropertyValue("--muted").trim() || "#5c6b64",
    accent: styles.getPropertyValue("--accent").trim() || "#2f6f4e",
    rule: styles.getPropertyValue("--rule").trim() || "#c5d0c8",
    dark,
    light: dark ? 58 : 38,
  };
}

function folderHue(folder) {
  if (FOLDER_HUES[folder] != null) return FOLDER_HUES[folder];
  let hash = 0;
  for (const char of folder) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return hash % 360;
}

function folderColor(folder, colors) {
  return `hsl(${folderHue(folder)} 38% ${colors.light}%)`;
}

function prepare(graph) {
  const nodes = graph.nodes.map((node, index) => {
    const angle = (index / Math.max(graph.nodes.length, 1)) * Math.PI * 2;
    const radius = 220 + (index % 7) * 18;
    return {
      ...node,
      folder: node.folder || "Root",
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      degree: 0,
      hidden: false,
      hit: true,
    };
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const neighbors = new Map(nodes.map((node) => [node.id, new Set()]));
  const edges = [];
  for (const edge of graph.edges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) continue;
    edges.push({ source, target });
    neighbors.get(source.id).add(target);
    neighbors.get(target.id).add(source);
    source.degree += 1;
    target.degree += 1;
  }
  return { nodes, edges, neighbors };
}

function step(nodes, edges) {
  const cell = 96;
  const buckets = new Map();
  for (const node of nodes) {
    const key = `${Math.floor(node.x / cell)}:${Math.floor(node.y / cell)}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(node);
    else buckets.set(key, [node]);
  }
  for (const node of nodes) {
    const gx = Math.floor(node.x / cell);
    const gy = Math.floor(node.y / cell);
    for (let ox = -1; ox <= 1; ox += 1) {
      for (let oy = -1; oy <= 1; oy += 1) {
        const bucket = buckets.get(`${gx + ox}:${gy + oy}`);
        if (!bucket) continue;
        for (const other of bucket) {
          if (other.id <= node.id) continue;
          let dx = node.x - other.x;
          let dy = node.y - other.y;
          const dist = Math.hypot(dx, dy) || 0.01;
          const force = 720 / (dist * dist);
          dx = (dx / dist) * force;
          dy = (dy / dist) * force;
          node.vx += dx;
          node.vy += dy;
          other.vx -= dx;
          other.vy -= dy;
        }
      }
    }
  }
  for (const edge of edges) {
    const dx = edge.target.x - edge.source.x;
    const dy = edge.target.y - edge.source.y;
    const dist = Math.hypot(dx, dy) || 0.01;
    const delta = (dist - 92) * 0.016;
    const ox = (dx / dist) * delta;
    const oy = (dy / dist) * delta;
    edge.source.vx += ox;
    edge.source.vy += oy;
    edge.target.vx -= ox;
    edge.target.vy -= oy;
  }
  for (const node of nodes) {
    node.vx += -node.x * 0.0035;
    node.vy += -node.y * 0.0035;
    node.vx *= 0.84;
    node.vy *= 0.84;
    node.x += node.vx;
    node.y += node.vy;
  }
}

function nodeRadius(node) {
  return 3.2 + Math.min(11, Math.sqrt(node.degree) * 1.8);
}

function worldFromScreen(camera, sx, sy) {
  return {
    x: (sx - camera.x) / camera.scale,
    y: (sy - camera.y) / camera.scale,
  };
}

function nearest(nodes, x, y, maxDist) {
  let best = null;
  let bestDist = maxDist;
  for (const node of nodes) {
    if (node.hidden) continue;
    const dist = Math.hypot(node.x - x, node.y - y);
    if (dist < bestDist) {
      best = node;
      bestDist = dist;
    }
  }
  return best;
}

function inView(node, camera, width, height, pad) {
  const sx = node.x * camera.scale + camera.x;
  const sy = node.y * camera.scale + camera.y;
  return sx > -pad && sy > -pad && sx < width + pad && sy < height + pad;
}

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(320, rect.width) * dpr;
  canvas.height = Math.max(280, rect.height) * dpr;
  return {
    ctx: canvas.getContext("2d"),
    width: canvas.width / dpr,
    height: canvas.height / dpr,
    dpr,
  };
}

function fitCamera(camera, nodes, width, height) {
  const visible = nodes.filter((node) => !node.hidden);
  if (visible.length === 0) {
    camera.x = width / 2;
    camera.y = height / 2;
    camera.scale = 1;
    return;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of visible) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);
  }
  const pad = 80;
  const spanX = Math.max(maxX - minX, 80);
  const spanY = Math.max(maxY - minY, 80);
  camera.scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY, 2.4);
  camera.x = width / 2 - ((minX + maxX) / 2) * camera.scale;
  camera.y = height / 2 - ((minY + maxY) / 2) * camera.scale;
}

function focusCamera(camera, node, width, height) {
  camera.scale = Math.max(camera.scale, 1.35);
  camera.x = width / 2 - node.x * camera.scale;
  camera.y = height / 2 - node.y * camera.scale;
}

function boot() {
  const canvas = document.getElementById("vault-graph");
  const dataEl = document.getElementById("vault-graph-data");
  const search = document.getElementById("graph-search");
  const filtersEl = document.getElementById("graph-filters");
  const inspector = document.getElementById("graph-inspector");
  const status = document.getElementById("graph-status");
  if (!canvas || !dataEl) return;

  const graph = prepare(JSON.parse(dataEl.textContent));
  if (graph.nodes.length === 0) return;

  const folders = [...new Set(graph.nodes.map((node) => node.folder))].sort((a, b) =>
    a.localeCompare(b),
  );
  const hiddenFolders = new Set();
  let query = "";
  let hover = null;
  let selected = null;
  let laidOut = false;
  let size = { ctx: null, width: 0, height: 0, dpr: 1 };
  const camera = { x: 0, y: 0, scale: 1 };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let pointer = { active: false, panned: false, x: 0, y: 0 };

  function matchesQuery(node) {
    if (!query) return true;
    return (
      node.title.toLowerCase().includes(query) ||
      node.id.toLowerCase().includes(query) ||
      node.folder.toLowerCase().includes(query)
    );
  }

  function applyVisibility() {
    for (const node of graph.nodes) {
      node.hidden = hiddenFolders.has(node.folder);
      node.hit = !node.hidden && matchesQuery(node);
    }
  }

  function relatedIds(node) {
    const ids = new Set([node.id]);
    for (const neighbor of graph.neighbors.get(node.id) || []) ids.add(neighbor.id);
    return ids;
  }

  function updateStatus() {
    if (!status) return;
    const shown = graph.nodes.filter((node) => !node.hidden).length;
    const hits = query ? graph.nodes.filter((node) => node.hit).length : shown;
    status.textContent = query
      ? `${hits} match${hits === 1 ? "" : "es"} · ${graph.edges.length} links`
      : `${shown} notes · ${graph.edges.length} links`;
  }

  function updateInspector() {
    if (!inspector) return;
    if (!selected) {
      inspector.hidden = true;
      return;
    }
    inspector.hidden = false;
    inspector.querySelector(".graph-inspector-folder").textContent = selected.folder;
    inspector.querySelector(".graph-inspector-title").textContent = selected.title;
    const links = graph.neighbors.get(selected.id) || new Set();
    inspector.querySelector(".graph-inspector-meta").textContent =
      `${links.size} connected note${links.size === 1 ? "" : "s"}`;
    const list = inspector.querySelector(".graph-inspector-links");
    list.replaceChildren();
    const related = [...links].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 12);
    for (const neighbor of related) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = neighbor.title;
      button.addEventListener("click", () => {
        selected = neighbor;
        focusCamera(camera, neighbor, size.width, size.height);
        updateInspector();
        paint();
      });
      item.append(button);
      list.append(item);
    }
    inspector.querySelector(".graph-inspector-open").href = selected.url;
  }

  function paint() {
    if (!size.ctx) return;
    const colors = themeColors();
    const ctx = size.ctx;
    const focus = selected || hover;
    const focusIds = focus ? relatedIds(focus) : null;
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.scale, camera.scale);
    ctx.lineCap = "round";

    for (const edge of graph.edges) {
      if (edge.source.hidden || edge.target.hidden) continue;
      const connected =
        focusIds && focusIds.has(edge.source.id) && focusIds.has(edge.target.id);
      ctx.beginPath();
      ctx.moveTo(edge.source.x, edge.source.y);
      ctx.lineTo(edge.target.x, edge.target.y);
      ctx.lineWidth = 1 / camera.scale;
      ctx.strokeStyle = connected ? colors.accent : colors.rule;
      ctx.globalAlpha = focusIds && !connected ? 0.08 : connected ? 0.9 : 0.28;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const labels = [];
    for (const node of graph.nodes) {
      if (node.hidden) continue;
      if (!inView(node, camera, size.width, size.height, 48)) continue;
      const active = focusIds?.has(node.id);
      const dim = Boolean(focusIds) && !active;
      const searched = Boolean(query) && !node.hit;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius(node) / Math.sqrt(camera.scale), 0, Math.PI * 2);
      ctx.fillStyle = folderColor(node.folder, colors);
      ctx.globalAlpha = dim || searched ? 0.16 : 1;
      ctx.fill();
      if (node === selected || node === hover) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = colors.ink;
        ctx.lineWidth = 1.6 / camera.scale;
        ctx.stroke();
      }
      if (
        node === hover ||
        node === selected ||
        (active && selected) ||
        (query && node.hit) ||
        (camera.scale > 1.7 && node.degree > 2)
      ) {
        labels.push(node);
      }
    }
    ctx.globalAlpha = 1;
    ctx.font = `${12 / camera.scale}px system-ui, sans-serif`;
    for (const node of labels) {
      ctx.fillStyle = node === hover || node === selected ? colors.ink : colors.muted;
      ctx.fillText(node.title, node.x + 8 / camera.scale, node.y + 4 / camera.scale);
    }
  }

  function hitAt(sx, sy) {
    const world = worldFromScreen(camera, sx, sy);
    return nearest(graph.nodes, world.x, world.y, 22 / camera.scale);
  }

  function layoutAndDraw() {
    size = fitCanvas(canvas);
    if (!laidOut) {
      const ticks = reduced ? 40 : 220;
      for (let i = 0; i < ticks; i += 1) step(graph.nodes, graph.edges);
      laidOut = true;
      fitCamera(camera, graph.nodes, size.width, size.height);
    }
    paint();
  }

  function renderFilters() {
    if (!filtersEl) return;
    filtersEl.replaceChildren();
    const colors = themeColors();
    for (const folder of folders) {
      const count = graph.nodes.filter((node) => node.folder === folder).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "graph-chip";
      button.setAttribute("aria-pressed", String(!hiddenFolders.has(folder)));
      const swatch = document.createElement("span");
      swatch.className = "graph-chip-swatch";
      swatch.style.background = folderColor(folder, colors);
      const label = document.createTextNode(`${folder} `);
      const em = document.createElement("em");
      em.textContent = String(count);
      button.append(swatch, label, em);
      button.addEventListener("click", () => {
        if (hiddenFolders.has(folder)) hiddenFolders.delete(folder);
        else hiddenFolders.add(folder);
        button.setAttribute("aria-pressed", String(!hiddenFolders.has(folder)));
        applyVisibility();
        updateStatus();
        if (selected?.hidden) selected = null;
        updateInspector();
        paint();
      });
      filtersEl.append(button);
    }
  }

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = event.clientX - rect.left;
      const sy = event.clientY - rect.top;
      const world = worldFromScreen(camera, sx, sy);
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      camera.scale = Math.min(8, Math.max(0.18, camera.scale * factor));
      camera.x = sx - world.x * camera.scale;
      camera.y = sy - world.y * camera.scale;
      hover = hitAt(sx, sy);
      canvas.style.cursor = hover ? "pointer" : "grab";
      paint();
    },
    { passive: false },
  );

  canvas.addEventListener("pointerdown", (event) => {
    pointer = { active: true, panned: false, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    if (pointer.active) {
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      if (Math.hypot(dx, dy) > 3) pointer.panned = true;
      camera.x += dx;
      camera.y += dy;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      canvas.style.cursor = "grabbing";
      paint();
      return;
    }
    hover = hitAt(sx, sy);
    canvas.style.cursor = hover ? "pointer" : "grab";
    paint();
  });

  canvas.addEventListener("pointerup", (event) => {
    if (pointer.active && !pointer.panned) {
      const rect = canvas.getBoundingClientRect();
      selected = hitAt(event.clientX - rect.left, event.clientY - rect.top);
      updateInspector();
      paint();
    }
    pointer.active = false;
    canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = hover ? "pointer" : "grab";
  });

  canvas.addEventListener("pointerleave", () => {
    hover = null;
    paint();
  });

  canvas.addEventListener("dblclick", (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const node = hitAt(event.clientX - rect.left, event.clientY - rect.top);
    if (node?.url) {
      window.location.href = node.url;
      return;
    }
    fitCamera(camera, graph.nodes, size.width, size.height);
    paint();
  });

  search?.addEventListener("input", () => {
    query = search.value.trim().toLowerCase();
    applyVisibility();
    updateStatus();
    if (query) {
      const first = graph.nodes.find((node) => node.hit);
      if (first) focusCamera(camera, first, size.width, size.height);
    }
    paint();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== search) {
      event.preventDefault();
      search?.focus();
    }
    if (event.key === "Escape") {
      if (document.activeElement === search && search.value) {
        search.value = "";
        query = "";
        applyVisibility();
        updateStatus();
        paint();
        return;
      }
      if (selected) {
        selected = null;
        updateInspector();
        paint();
      }
    }
    if (event.key === "Enter" && selected?.url && document.activeElement !== search) {
      window.location.href = selected.url;
    }
  });

  window.addEventListener("vault-graph-show", () => {
    applyVisibility();
    renderFilters();
    updateStatus();
    updateInspector();
    requestAnimationFrame(layoutAndDraw);
  });

  window.addEventListener("resize", () => {
    if (canvas.offsetParent === null) return;
    size = fitCanvas(canvas);
    paint();
  });

  new MutationObserver(() => {
    renderFilters();
    paint();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  applyVisibility();
  updateStatus();
}

boot();
