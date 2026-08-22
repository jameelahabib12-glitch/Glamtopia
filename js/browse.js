/**
 * Browse/search page logic. Fetches real providers from
 * GET /api/providers?category=&search=&sort= — filtering happens server-side
 * (see server/controllers/providerProfileController.js), so this file just
 * builds the query string and re-fetches whenever a control changes.
 *
 * Price and "available now" filters were dropped from the previous
 * mock-data version: GET /api/providers returns provider profiles, not
 * their services, so per-provider pricing/availability isn't available at
 * this list level without an extra round trip per card. If that's wanted
 * later, the clean way is a dedicated aggregation endpoint rather than
 * N+1 fetching services for every card in a results grid.
 */
const CATEGORIES = ["hair", "makeup", "nails", "skincare"];
const API_BASE = "http://localhost:5000/api";

(function initBrowse() {
  const state = {
    query: "",
    category: new URLSearchParams(window.location.search).get("category") || "all",
    sort: "rating",
  };

  const els = {
    search: document.getElementById("search-input"),
    sort: document.getElementById("sort-select"),
    chips: document.getElementById("category-chips"),
    grid: document.getElementById("results-grid"),
    count: document.getElementById("results-count"),
    empty: document.getElementById("empty-state"),
  };

  renderChips();
  bindEvents();
  fetchAndRender();

  function renderChips() {
    const cats = ["all", ...CATEGORIES];
    els.chips.innerHTML = cats
      .map(
        (c) => `
        <button
          type="button"
          class="glam-chip px-4 py-1.5 rounded-full text-sm font-medium"
          data-category="${c}"
          aria-pressed="${c === state.category}"
        >${c === "all" ? "All categories" : capitalize(c)}</button>`
      )
      .join("");
  }

  function bindEvents() {
    let debounceTimer;
    els.search.addEventListener("input", (e) => {
      state.query = e.target.value.trim();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchAndRender, 300); // avoid a request per keystroke
    });

    els.sort.addEventListener("change", (e) => {
      state.sort = e.target.value;
      fetchAndRender();
    });

    els.chips.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-category]");
      if (!btn) return;
      state.category = btn.dataset.category;
      [...els.chips.children].forEach((c) =>
        c.setAttribute("aria-pressed", c === btn ? "true" : "false")
      );
      fetchAndRender();
    });
  }

  async function fetchAndRender() {
    els.count.textContent = "Loading…";
    try {
      const url = new URL(`${API_BASE}/providers`);
      if (state.category !== "all") url.searchParams.set("category", state.category);
      if (state.query) url.searchParams.set("search", state.query);
      if (state.sort === "rating" || state.sort === "newest" || state.sort === "reviews") {
        url.searchParams.set("sort", state.sort);
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Request failed");
      const results = await res.json();

      els.count.textContent = `${results.length} provider${results.length === 1 ? "" : "s"} found`;
      els.grid.innerHTML = results.map(renderCard).join("");
      els.empty.classList.toggle("hidden", results.length > 0);
    } catch (err) {
      console.error("Failed to load providers", err);
      els.count.textContent = "";
      els.grid.innerHTML = "";
      els.empty.classList.remove("hidden");
      els.empty.textContent = `Couldn't load providers. Is the backend running on ${API_BASE}?`;
    }
  }

  function renderCard(p) {
    return `
      <a href="provider.html?id=${p._id}" class="glam-card p-6 block">
        <p class="glam-eyebrow">${capitalize(p.category)}</p>
        <p class="font-display text-xl mt-2">${p.business_name}</p>
        <p class="text-sm text-glam-ink/60 mt-1">${p.location}</p>
        <p class="text-sm text-glam-ink/70 mt-3 line-clamp-2">${p.bio || ""}</p>
        <p class="text-sm font-semibold mt-4">
          <span class="glam-accent">★</span> ${(p.average_rating || 0).toFixed(1)}
          <span class="text-glam-ink/50 font-normal">(${p.review_count || 0})</span>
        </p>
      </a>
    `;
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
})();