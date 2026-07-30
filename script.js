/* =========================================================================
   Arthropod Catalog — script.js
   -------------------------------------------------------------------------
   This file loads species.json and builds the whole page from the data.
   You should almost never need to edit this file to add content — just edit
   species.json. See README.md for step-by-step instructions.
   ========================================================================= */

"use strict";

/* ------------------------------------------------------------------ *
 * 1. GLOBAL STATE
 * ------------------------------------------------------------------ */
let allSpecies = [];        // every species loaded from species.json
let categories = [];        // list of category names
let globalManuals = [];     // top-level manuals not tied to a specific species
let globalYoutube = [];     // top-level videos not tied to a specific species
let activeCategory = "All"; // currently selected category tab
let searchTerm = "";        // current search text (lowercased)
let availabilityFilter = "All";

/* Special tabs that show aggregated content instead of a category.
   Their keys are used as `activeCategory` values. */
const SPECIAL_TABS = [
  { key: "__manuals__", label: "📄 Manuals" },
  { key: "__videos__", label: "🎬 Videos" },
];

/* Element references (grabbed once on load) */
const el = {
  grid: document.getElementById("speciesGrid"),
  tabs: document.getElementById("categoryTabs"),
  search: document.getElementById("searchInput"),
  resultCount: document.getElementById("resultCount"),
  emptyState: document.getElementById("emptyState"),
  themeToggle: document.getElementById("themeToggle"),
  modal: document.getElementById("speciesModal"),
  modalContent: document.getElementById("modalContent"),
};

/* ------------------------------------------------------------------ *
 * 2. HELPERS
 * ------------------------------------------------------------------ */

/** Escape text so user data can never inject HTML. */
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Encode a file path so spaces / special chars work in src/href. */
function encodePath(path) {
  // Encode each path segment but keep the "/" separators intact.
  return String(path).split("/").map(encodeURIComponent).join("/");
}

/** Map an availability value to its badge CSS class. */
function availabilityClass(value) {
  switch (value) {
    case "Available": return "badge-available";
    case "Breeding Project": return "badge-breeding";
    case "Coming Soon": return "badge-coming";
    default: return "badge-unavailable"; // "Not Available" and anything else
  }
}

/** Extract a YouTube video ID from many common URL formats. */
function youTubeId(url) {
  const match = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return match ? match[1] : null;
}

/** A neutral inline SVG used when an image is missing.
 *  NOTE: internal quotes are encoded as %27 so the string is safe to drop into
 *  an inline onerror="…this.src='…'" handler (no raw single quotes). */
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27300%27%3E%3Crect width=%27100%25%27 height=%27100%25%27 fill=%27%23dfe3ea%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 font-family=%27sans-serif%27 font-size=%2720%27 fill=%27%238a94a3%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3ENo photo%3C/text%3E%3C/svg%3E";

/** Return a category-specific SVG placeholder. Falls back to PLACEHOLDER_IMG. */
function getCategoryPlaceholder(category) {
  const bg = "#dfe3ea";
  const lc = "#8a94a3";
  let inner;
  switch (category) {
    case "Cockroaches":
      inner = `
        <ellipse cx="200" cy="162" rx="30" ry="52" fill="#5a4030"/>
        <ellipse cx="200" cy="104" rx="18" ry="15" fill="#5a4030"/>
        <line x1="193" y1="91" x2="155" y2="58" stroke="#3a2010" stroke-width="2.5"/>
        <line x1="207" y1="91" x2="245" y2="58" stroke="#3a2010" stroke-width="2.5"/>
        <line x1="172" y1="140" x2="135" y2="122" stroke="#3a2010" stroke-width="2"/>
        <line x1="170" y1="160" x2="128" y2="157" stroke="#3a2010" stroke-width="2"/>
        <line x1="172" y1="180" x2="138" y2="198" stroke="#3a2010" stroke-width="2"/>
        <line x1="228" y1="140" x2="265" y2="122" stroke="#3a2010" stroke-width="2"/>
        <line x1="230" y1="160" x2="272" y2="157" stroke="#3a2010" stroke-width="2"/>
        <line x1="228" y1="180" x2="262" y2="198" stroke="#3a2010" stroke-width="2"/>
        <text x="50%" y="92%" font-family="sans-serif" font-size="17" fill="${lc}" text-anchor="middle">Cockroach</text>`;
      break;
    case "Tarantulas":
      inner = `
        <ellipse cx="200" cy="178" rx="48" ry="58" fill="#7a5c3a"/>
        <ellipse cx="200" cy="108" rx="36" ry="36" fill="#6b4f32"/>
        <line x1="167" y1="93" x2="108" y2="62" stroke="#4a3020" stroke-width="5" stroke-linecap="round"/>
        <line x1="167" y1="110" x2="102" y2="108" stroke="#4a3020" stroke-width="5" stroke-linecap="round"/>
        <line x1="168" y1="126" x2="108" y2="148" stroke="#4a3020" stroke-width="5" stroke-linecap="round"/>
        <line x1="170" y1="140" x2="115" y2="168" stroke="#4a3020" stroke-width="5" stroke-linecap="round"/>
        <line x1="233" y1="93" x2="292" y2="62" stroke="#4a3020" stroke-width="5" stroke-linecap="round"/>
        <line x1="233" y1="110" x2="298" y2="108" stroke="#4a3020" stroke-width="5" stroke-linecap="round"/>
        <line x1="232" y1="126" x2="292" y2="148" stroke="#4a3020" stroke-width="5" stroke-linecap="round"/>
        <line x1="230" y1="140" x2="285" y2="168" stroke="#4a3020" stroke-width="5" stroke-linecap="round"/>
        <text x="50%" y="94%" font-family="sans-serif" font-size="17" fill="${lc}" text-anchor="middle">Tarantula</text>`;
      break;
    case "Substrate":
      inner = `
        <rect x="60" y="80" width="280" height="38" rx="5" fill="#c8a87a"/>
        <rect x="60" y="122" width="280" height="48" rx="5" fill="#8b5e3c"/>
        <rect x="60" y="174" width="280" height="38" rx="5" fill="#5c3d22"/>
        <circle cx="110" cy="99" r="5" fill="#a07050" opacity="0.7"/>
        <circle cx="165" cy="96" r="4" fill="#a07050" opacity="0.7"/>
        <circle cx="220" cy="100" r="5" fill="#a07050" opacity="0.7"/>
        <circle cx="275" cy="97" r="4" fill="#a07050" opacity="0.7"/>
        <circle cx="320" cy="99" r="5" fill="#a07050" opacity="0.7"/>
        <text x="50%" y="94%" font-family="sans-serif" font-size="17" fill="${lc}" text-anchor="middle">Substrate</text>`;
      break;
    case "Beetles":
      inner = `
        <ellipse cx="190" cy="158" rx="27" ry="50" fill="#3a7a3a"/>
        <ellipse cx="210" cy="158" rx="27" ry="50" fill="#2d6a2d"/>
        <line x1="200" y1="108" x2="200" y2="208" stroke="#1a4a1a" stroke-width="1.5"/>
        <ellipse cx="200" cy="100" rx="20" ry="18" fill="#2d5a2d"/>
        <line x1="192" y1="85" x2="168" y2="58" stroke="#1a3a1a" stroke-width="2"/>
        <line x1="208" y1="85" x2="232" y2="58" stroke="#1a3a1a" stroke-width="2"/>
        <line x1="165" y1="133" x2="132" y2="118" stroke="#1a3a1a" stroke-width="2"/>
        <line x1="163" y1="156" x2="126" y2="153" stroke="#1a3a1a" stroke-width="2"/>
        <line x1="165" y1="178" x2="132" y2="195" stroke="#1a3a1a" stroke-width="2"/>
        <line x1="235" y1="133" x2="268" y2="118" stroke="#1a3a1a" stroke-width="2"/>
        <line x1="237" y1="156" x2="274" y2="153" stroke="#1a3a1a" stroke-width="2"/>
        <line x1="235" y1="178" x2="268" y2="195" stroke="#1a3a1a" stroke-width="2"/>
        <text x="50%" y="94%" font-family="sans-serif" font-size="17" fill="${lc}" text-anchor="middle">Beetle</text>`;
      break;
    default:
      return PLACEHOLDER_IMG;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="${bg}"/>${inner}</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

/* ------------------------------------------------------------------ *
 * 3. DATA LOADING
 * ------------------------------------------------------------------ */
async function loadData() {
  try {
    const res = await fetch("species.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    allSpecies = Array.isArray(data.species) ? data.species : [];
    globalManuals = Array.isArray(data.globalManuals) ? data.globalManuals : [];
    globalYoutube = Array.isArray(data.globalYoutube) ? data.globalYoutube : [];

    // Build the category list. Prefer the explicit list in the JSON,
    // otherwise derive it from the species themselves.
    categories = Array.isArray(data.categories) && data.categories.length
      ? data.categories
      : [...new Set(allSpecies.map((s) => s.category))].sort();

    renderTabs();
    render();
  } catch (err) {
    console.error("Failed to load species.json:", err);
    el.grid.innerHTML = "";
    el.emptyState.hidden = false;
    el.emptyState.textContent =
      "Could not load species.json. If you opened index.html directly, run a local server instead (see README).";
  }
}

/* ------------------------------------------------------------------ *
 * 4. RENDERING
 * ------------------------------------------------------------------ */

/** Build the category tab buttons (including an "All" tab). */
function renderTabs() {
  const tabs = ["All", ...categories];

  const categoryButtons = tabs
    .map(
      (cat) =>
        `<button type="button" data-category="${escapeHtml(cat)}"${
          cat === activeCategory ? ' class="active"' : ""
        }>${escapeHtml(cat)}</button>`
    )
    .join("");

  const specialButtons = SPECIAL_TABS.map(
    (t) =>
      `<button type="button" class="tab-special${
        t.key === activeCategory ? " active" : ""
      }" data-category="${t.key}">${escapeHtml(t.label)}</button>`
  ).join("");

  el.tabs.innerHTML = categoryButtons + specialButtons;
}

/** Return the species that match the current category, search, and filter. */
function getFilteredSpecies() {
  return allSpecies.filter((s) => {
    const matchCategory =
      activeCategory === "All" || s.category === activeCategory;

    const matchAvailability =
      availabilityFilter === "All" || s.availability === availabilityFilter;

    const haystack = [s.name, s.description, s.care, s.notes, s.category]
      .join(" ")
      .toLowerCase();
    const matchSearch = !searchTerm || haystack.includes(searchTerm);

    return matchCategory && matchAvailability && matchSearch;
  });
}

/** Draw the card grid based on current filters. */
function render() {
  // Special aggregated views take over the grid.
  if (activeCategory === "__manuals__") return renderManuals();
  if (activeCategory === "__videos__") return renderVideos();

  el.grid.className = "species-grid";
  const list = getFilteredSpecies();

  el.resultCount.textContent = `${list.length} species${
    activeCategory === "All" ? "" : ` in ${activeCategory}`
  }`;

  el.emptyState.hidden = list.length !== 0;
  el.emptyState.textContent =
    "No species match your search. Try a different keyword or category.";

  el.grid.innerHTML = list
    .map((s, index) => {
      // We store the index into allSpecies so the modal can look it up.
      const realIndex = allSpecies.indexOf(s);
      const cover = s.images && s.images.length ? encodePath(s.images[0]) : getCategoryPlaceholder(s.category);

      return `
        <article class="card" data-index="${realIndex}" tabindex="0" role="button"
                 aria-label="View details for ${escapeHtml(s.name)}">
          <div class="card-image">
            <img src="${cover}" alt="${escapeHtml(s.name)}" loading="lazy"
                 onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'" />
            ${s.availability === "Coming Soon" ? '<span class="coming-soon-dot" title="\u05d1\u05e7\u05e8\u05d5\u05d1"></span>' : ""}
          </div>
          <div class="card-body">
            <h2 class="card-name">${escapeHtml(s.name)}</h2>
            <p class="card-desc" dir="auto">${escapeHtml(s.description || "")}</p>
            <div class="card-meta">
              ${
                s.difficulty
                  ? `<span class="badge badge-difficulty">${escapeHtml(s.difficulty)}</span>`
                  : ""
              }
              ${s.featured ? `<span class="badge badge-top">⭐ Top Choice</span>` : ""}
              ${s.cleaningCrew ? `<span class="badge badge-cleaning">🧹 Cleaning Crew</span>` : ""}
            </div>
          </div>
        </article>`;
    })
    .join("");
}

/** Aggregated "Manuals" view: every PDF across all species. */
function renderManuals() {
  el.grid.className = "species-grid";

  const globalItems = globalManuals.map((m) => ({
    label: m.label || m.path.split("/").pop(),
    species: "כללי",
    path: m.path,
  }));

  // Deduplicate species manuals by path — keep first occurrence
  const seenPaths = new Set(globalItems.map((m) => m.path));
  const speciesItems = allSpecies
    .filter((s) => !searchTerm || s.name.toLowerCase().includes(searchTerm))
    .flatMap((s) => (s.manuals || []).map((path) => ({
      label: path.split("/").pop(),
      species: s.name,
      path,
    })))
    .filter((it) => {
      if (seenPaths.has(it.path)) return false;
      seenPaths.add(it.path);
      return true;
    });

  const items = [...globalItems, ...speciesItems];

  el.resultCount.textContent = `${items.length} manual${items.length === 1 ? "" : "s"}`;
  el.emptyState.hidden = items.length !== 0;
  el.emptyState.textContent = "No manuals available yet.";

  el.grid.innerHTML = items
    .map((it) => `
        <a class="card doc-card" href="${encodePath(it.path)}" target="_blank" rel="noopener"
           aria-label="Open ${escapeHtml(it.label)}">
          <div class="doc-icon">📄</div>
          <div class="card-body">
            <h2 class="card-name">${escapeHtml(it.label)}</h2>
            <p class="card-desc">${escapeHtml(it.species)}</p>
          </div>
        </a>`)
    .join("");
}

/** Aggregated "Videos" view: every YouTube video across all species. */
function renderVideos() {
  el.grid.className = "species-grid";

  // Global videos (with custom labels) come first
  const seen = new Set();
  const globalItems = globalYoutube
    .map((v) => ({ label: v.label, species: "", id: youTubeId(v.url) }))
    .filter((v) => v.id && !seen.has(v.id) && seen.add(v.id));

  // Deduplicate by video ID — keep first occurrence (first species that listed it)
  const speciesItems = allSpecies
    .filter((s) => !searchTerm || s.name.toLowerCase().includes(searchTerm))
    .flatMap((s) =>
      (s.youtube || [])
        .map((url) => ({ label: s.name, species: s.name, id: youTubeId(url) }))
        .filter((v) => v.id)
    )
    .filter((v) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });

  const items = [...globalItems, ...speciesItems];

  el.resultCount.textContent = `${items.length} video${items.length === 1 ? "" : "s"}`;
  el.emptyState.hidden = items.length !== 0;
  el.emptyState.textContent = "No videos available yet.";

  el.grid.innerHTML = items
    .map(
      (it) => `
        <article class="card media-card">
          <div class="video-embed">
            <iframe src="https://www.youtube-nocookie.com/embed/${it.id}"
                    title="${escapeHtml(it.label)}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen loading="lazy"></iframe>
          </div>
          <div class="card-body">
            <h2 class="card-name">${escapeHtml(it.label)}</h2>
          </div>
        </article>`
    )
    .join("");
}

/* ------------------------------------------------------------------ *
 * 5. MODAL (species detail view)
 * ------------------------------------------------------------------ */
let carouselState = { images: [], current: 0 };

function openModal(index) {
  const s = allSpecies[index];
  if (!s) return;

  const images = Array.isArray(s.images) && s.images.length ? s.images : [];
  carouselState = { images, current: 0 };

  const carousel = images.length
    ? `
      <div class="carousel" data-carousel>
        <div class="carousel-track">
          <img id="carouselImg" src="${encodePath(images[0])}" alt="${escapeHtml(s.name)}"
               onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'" />
        </div>
        ${
          images.length > 1
            ? `
          <button class="carousel-btn prev" type="button" data-carousel-prev aria-label="Previous image">&#8249;</button>
          <button class="carousel-btn next" type="button" data-carousel-next aria-label="Next image">&#8250;</button>
          <div class="carousel-dots">
            ${images
              .map(
                (_, i) =>
                  `<button type="button" data-carousel-dot="${i}"${
                    i === 0 ? ' class="active"' : ""
                  } aria-label="Go to image ${i + 1}"></button>`
              )
              .join("")}
          </div>`
            : ""
        }
      </div>`
    : `<div class="card-image"><img src="${getCategoryPlaceholder(s.category)}" alt="No photo available" /></div>`;

  // YouTube videos → responsive embeds
  const videos = (s.youtube || [])
    .map((url) => {
      const id = youTubeId(url);
      if (!id) return "";
      return `
        <div class="video-embed">
          <iframe src="https://www.youtube-nocookie.com/embed/${id}"
                  title="Video for ${escapeHtml(s.name)}"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen loading="lazy"></iframe>
        </div>`;
    })
    .join("");

  // PDF manuals → link list
  const manuals = (s.manuals || [])
    .map((path) => {
      const fileName = path.split("/").pop();
      return `<li><a href="${encodePath(path)}" target="_blank" rel="noopener">📄 ${escapeHtml(
        fileName
      )}</a></li>`;
    })
    .join("");

  el.modalContent.innerHTML = `
    ${carousel}
    <div class="modal-body">
      <h2 id="modalTitle" class="modal-title">${escapeHtml(s.name)}</h2>
      <div class="modal-meta">
        ${s.category ? `<span class="badge badge-difficulty">${escapeHtml(s.category)}</span>` : ""}
        ${s.difficulty ? `<span class="badge badge-difficulty">Difficulty: ${escapeHtml(s.difficulty)}</span>` : ""}
        ${s.featured ? `<span class="badge badge-top">⭐ Top Choice</span>` : ""}
        ${s.cleaningCrew ? `<span class="badge badge-cleaning">🧹 Cleaning Crew</span>` : ""}
      </div>

      ${
        s.description
          ? `<div class="modal-section"><h3>Description</h3><p dir="auto">${escapeHtml(s.description)}</p></div>`
          : ""
      }
      ${
        s.care
          ? `<div class="modal-section"><h3>Care Information</h3><p dir="auto">${escapeHtml(s.care)}</p></div>`
          : ""
      }
      ${
        s.notes
          ? `<div class="modal-section"><h3>Notes</h3><p dir="auto">${escapeHtml(s.notes)}</p></div>`
          : ""
      }
      ${videos ? `<div class="modal-section"><h3>Videos</h3>${videos}</div>` : ""}
      ${
        manuals
          ? `<div class="modal-section"><h3>Care Guides / Manuals</h3><ul class="link-list">${manuals}</ul></div>`
          : ""
      }
    </div>`;

  el.modal.hidden = false;
  document.body.style.overflow = "hidden"; // stop background scroll
}

function closeModal() {
  el.modal.hidden = true;
  document.body.style.overflow = "";
  el.modalContent.innerHTML = "";
}

/** Move the carousel to a specific image index. */
function showCarouselImage(i) {
  const { images } = carouselState;
  if (!images.length) return;
  carouselState.current = (i + images.length) % images.length;

  const img = document.getElementById("carouselImg");
  if (img) img.src = encodePath(images[carouselState.current]);

  document
    .querySelectorAll("[data-carousel-dot]")
    .forEach((dot, idx) =>
      dot.classList.toggle("active", idx === carouselState.current)
    );
}

/* ------------------------------------------------------------------ *
 * 6. THEME (dark mode) with localStorage persistence
 * ------------------------------------------------------------------ */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  el.themeToggle.querySelector(".theme-icon").textContent =
    theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem("theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
}

/* ------------------------------------------------------------------ *
 * 7. EVENT WIRING (event delegation keeps it simple)
 * ------------------------------------------------------------------ */
function bindEvents() {
  // Category tabs
  el.tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-category]");
    if (!btn) return;
    activeCategory = btn.dataset.category;
    renderTabs();
    render();
  });

  // Search
  el.search.addEventListener("input", (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    render();
  });

  // Open modal from a card (click or keyboard Enter/Space)
  el.grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (card) openModal(Number(card.dataset.index));
  });
  el.grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".card");
    if (card) {
      e.preventDefault();
      openModal(Number(card.dataset.index));
    }
  });

  // Modal interactions (close buttons, carousel controls)
  el.modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) return closeModal();
    if (e.target.closest("[data-carousel-prev]"))
      return showCarouselImage(carouselState.current - 1);
    if (e.target.closest("[data-carousel-next]"))
      return showCarouselImage(carouselState.current + 1);
    const dot = e.target.closest("[data-carousel-dot]");
    if (dot) showCarouselImage(Number(dot.dataset.carouselDot));
  });

  // Keyboard: Esc closes modal, arrows move carousel
  document.addEventListener("keydown", (e) => {
    if (el.modal.hidden) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") showCarouselImage(carouselState.current - 1);
    if (e.key === "ArrowRight") showCarouselImage(carouselState.current + 1);
  });

  // Touch swipe on carousel (mobile)
  let touchStartX = 0;
  el.modal.addEventListener("touchstart", (e) => {
    if (!e.target.closest("[data-carousel]")) return;
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  el.modal.addEventListener("touchend", (e) => {
    if (!e.target.closest("[data-carousel]")) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 40) return;
    showCarouselImage(carouselState.current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // Theme toggle
  el.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

/* ------------------------------------------------------------------ *
 * 8. START
 * ------------------------------------------------------------------ */
initTheme();
bindEvents();
loadData();
