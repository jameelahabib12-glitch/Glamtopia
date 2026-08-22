/** Renders the "Top rated this week" grid on index.html from real backend data. */
const LANDING_API_BASE = "http://localhost:5000/api";

(async function initFeatured() {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;

  try {
    const res = await fetch(`${LANDING_API_BASE}/providers?sort=rating`);
    if (!res.ok) throw new Error("Request failed");
    const providers = await res.json();
    const featured = providers.slice(0, 3);

    if (!featured.length) {
      grid.innerHTML = `<p class="text-sm text-glam-ink/60 italic col-span-full">No providers listed yet — check back soon.</p>`;
      return;
    }

    grid.innerHTML = featured.map(renderCard).join("");
  } catch (err) {
    console.error("Failed to load featured providers", err);
    grid.innerHTML = `<p class="text-sm text-glam-ink/60 italic col-span-full">Couldn't load featured providers right now.</p>`;
  }
})();

function renderCard(p) {
  return `
    <a href="provider.html?id=${p._id}" class="glam-card p-6 block">
      <p class="glam-eyebrow">${capitalize(p.category)}</p>
      <p class="font-display text-xl mt-2">${p.business_name}</p>
      <p class="text-sm text-glam-ink/60 mt-1">${p.location}</p>
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