/**
 * Browse/search page logic. All filtering happens client-side against the
 * mock provider list — this is the seam where a real build swaps in
 * GET /api/providers?category=&q=&maxPrice=&available= (SRS FR-03).
 */
(async function initBrowse() {
  const allProviders = await MockAPI.getProviders();

  const state = {
    query: "",
    category: new URLSearchParams(window.location.search).get("category") || "all",
    maxPrice: 15000,
    availableOnly: false,
    sort: "rating"
  };

  const els = {
    search: document.getElementById("search-input"),
    sort: document.getElementById("sort-select"),
    chips: document.getElementById("category-chips"),
    price: document.getElementById("price-range"),
    priceValue: document.getElementById("price-range-value"),
    availableOnly: document.getElementById("available-only"),
    grid: document.getElementById("results-grid"),
    count: document.getElementById("results-count"),
    empty: document.getElementById("empty-state")
  };

  renderChips();
  bindEvents();
  render();

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
    els.search.addEventListener("input", (e) => {
      state.query = e.target.value.trim().toLowerCase();
      render();
    });

    els.sort.addEventListener("change", (e) => {
      state.sort = e.target.value;
      render();
    });

    els.chips.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-category]");
      if (!btn) return;
      state.category = btn.dataset.category;
      [...els.chips.children].forEach((c) =>
        c.setAttribute("aria-pressed", c === btn ? "true" : "false")
      );
      render();
    });

    els.price.addEventListener("input", (e) => {
      state.maxPrice = Number(e.target.value);
      els.priceValue.textContent =
        state.maxPrice >= 15000 ? "Any" : `PKR ${state.maxPrice.toLocaleString()}`;
      render();
    });

    els.availableOnly.addEventListener("change", (e) => {
      state.availableOnly = e.target.checked;
      render();
    });
  }

  function getFiltered() {
    let list = allProviders.filter((p) => {
      const matchesQuery =
        !state.query ||
        p.business_name.toLowerCase().includes(state.query) ||
        p.category.toLowerCase().includes(state.query);

      const matchesCategory = state.category === "all" || p.category === state.category;

      const cheapestPrice = Math.min(...p.services.map((s) => s.price));
      const matchesPrice = cheapestPrice <= state.maxPrice;

      const matchesAvailability = !state.availableOnly || !p.fully_booked;

      return matchesQuery && matchesCategory && matchesPrice && matchesAvailability;
    });

    if (state.sort === "rating") {
      list.sort((a, b) => b.average_rating - a.average_rating);
    } else if (state.sort === "price-low") {
      list.sort((a, b) => minPrice(a) - minPrice(b));
    } else if (state.sort === "price-high") {
      list.sort((a, b) => minPrice(b) - minPrice(a));
    }

    return list;
  }

  function render() {
    const results = getFiltered();
    els.count.textContent = `${results.length} provider${results.length === 1 ? "" : "s"} found`;
    els.grid.innerHTML = results.map(renderCard).join("");
    els.empty.classList.toggle("hidden", results.length > 0);
  }

  function renderCard(p) {
    const statusLabel = p.fully_booked
      ? `<span class="glam-status-full text-xs font-semibold">Fully booked</span>`
      : `<span class="glam-status-available text-xs font-semibold">Available</span>`;

    return `
      <a href="provider.html?id=${p.id}" class="glam-card p-6 block">
        <p class="glam-eyebrow">${capitalize(p.category)}</p>
        <p class="font-display text-xl mt-2">${p.business_name}</p>
        <p class="text-sm text-glam-ink/60 mt-1">${p.location}</p>
        <p class="text-sm text-glam-ink/70 mt-3 line-clamp-2">${p.bio}</p>
        <div class="flex items-center justify-between mt-4">
          <span class="text-sm font-semibold">★ ${p.average_rating.toFixed(1)} <span class="text-glam-ink/50 font-normal">(${p.review_count})</span></span>
          ${statusLabel}
        </div>
        <p class="text-xs text-glam-ink/50 mt-2">From PKR ${minPrice(p).toLocaleString()}</p>
      </a>
    `;
  }

  function minPrice(p) {
    return Math.min(...p.services.map((s) => s.price));
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
})();