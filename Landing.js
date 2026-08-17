/** Renders the "Top rated this week" grid on index.html from mock data. */
(async function initFeatured() {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;

  const providers = await MockAPI.getProviders();
  const featured = [...providers]
    .sort((a, b) => b.average_rating - a.average_rating)
    .slice(0, 3);

  grid.innerHTML = featured.map(renderCard).join("");
})();

function renderCard(p) {
  const statusLabel = p.fully_booked
    ? `<span class="glam-status-full text-xs font-semibold">Fully booked</span>`
    : `<span class="glam-status-available text-xs font-semibold">Available</span>`;

  return `
    <a href="provider.html?id=${p.id}" class="glam-card p-6 block">
      <p class="glam-eyebrow">${capitalize(p.category)}</p>
      <p class="font-display text-xl mt-2">${p.business_name}</p>
      <p class="text-sm text-glam-ink/60 mt-1">${p.location}</p>
      <div class="flex items-center justify-between mt-4">
        <span class="text-sm font-semibold">★ ${p.average_rating.toFixed(1)} <span class="text-glam-ink/50 font-normal">(${p.review_count})</span></span>
        ${statusLabel}
      </div>
    </a>
  `;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}