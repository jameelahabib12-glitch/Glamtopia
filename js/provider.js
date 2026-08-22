/**
 * Renders a single provider profile from REAL backend data.
 *
 * Previously this page ran entirely on MockAPI, and "Book" always redirected
 * to login.html even for an already-logged-in customer — the login page had
 * no idea a session already existed, so it just showed the login form again.
 * Now: the id in the URL is a real provider_profiles._id, and "Book" links
 * straight to booking-flow.html?providerId=...&serviceId=..., which already
 * does its own auth check (GET /api/auth/me) and only sends GUESTS to
 * login — an already-logged-in customer goes straight to picking a slot.
 */

const API_BASE = "http://localhost:5000/api";

(async function initProvider() {
  const root = document.getElementById("profile-root");
  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    root.innerHTML = notFoundBlock();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/providers/${id}`);
    if (!res.ok) {
      root.innerHTML = notFoundBlock();
      return;
    }
    const provider = await res.json();

    document.title = `${provider.business_name} — Glamtopia`;
    root.innerHTML = renderProfileShell(provider);

    // Services and availability load independently so one failing doesn't
    // block the other — and the page shows real content as soon as each
    // piece arrives instead of waiting on everything at once.
    loadAndRenderServices(provider);
    loadAndRenderAvailability(id);
    loadAndRenderReviews(id);
  } catch (err) {
    console.error("Failed to load provider", err);
    root.innerHTML = `
      <div class="glam-card p-10 text-center">
        <p class="font-display text-2xl mb-2">Couldn't load this page</p>
        <p class="text-glam-ink/60">Is the backend running on ${API_BASE}?</p>
      </div>`;
  }
})();

function notFoundBlock() {
  return `
    <div class="glam-card p-10 text-center">
      <p class="font-display text-2xl mb-2">Provider not found</p>
      <p class="text-glam-ink/60 mb-6">This profile may have been removed or the link is incorrect.</p>
      <a href="browse.html" class="glam-btn-primary inline-block font-semibold px-6 py-3 rounded-full">Browse providers</a>
    </div>
  `;
}

function renderProfileShell(p) {
  return `
    <section class="glam-card p-8 mb-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p class="glam-eyebrow mb-2">${capitalize(p.category)} · ${p.location}</p>
          <h1 class="font-display text-3xl md:text-4xl text-glam-ink">${p.business_name}</h1>
          <p class="text-sm font-semibold mt-2">
            <span class="glam-accent">★</span> ${(p.average_rating || 0).toFixed(1)}
            <span class="text-glam-ink/50 font-normal">(${p.review_count || 0} reviews)</span>
          </p>
        </div>
        <div id="availability-badge"></div>
      </div>
      <p class="text-glam-ink/70 mt-6 max-w-2xl">${p.bio || ""}</p>
      <p class="text-sm text-glam-ink/60 mt-3">Contact: ${p.contact_info}</p>
    </section>

    <section class="mb-8">
      <h2 class="font-display text-2xl text-glam-ink mb-4">Services</h2>
      <div id="services-grid" class="grid sm:grid-cols-2 gap-4">
        <p class="text-sm text-glam-ink/60 italic">Loading services…</p>
      </div>
    </section>

    <section class="mb-8">
      <h2 class="font-display text-2xl text-glam-ink mb-4">Availability</h2>
      <div id="availability-summary" class="glam-card p-6 text-glam-ink/70 text-sm">Loading availability…</div>
    </section>
  `;
}

async function loadAndRenderServices(provider) {
  const grid = document.getElementById("services-grid");
  try {
    const res = await fetch(`${API_BASE}/services/provider/${provider._id}`);
    if (!res.ok) throw new Error("Request failed");
    const services = await res.json();

    if (!services.length) {
      grid.innerHTML = `<p class="text-sm text-glam-ink/60 italic">No services listed yet.</p>`;
      return;
    }

    grid.innerHTML = services.map((s) => renderService(s, provider)).join("");
  } catch (err) {
    console.error("Failed to load services", err);
    grid.innerHTML = `<p class="text-sm text-red-600">Couldn't load services.</p>`;
  }
}

function renderService(s, provider) {
  const bookUrl = `booking-flow.html?providerId=${provider._id}&serviceId=${s._id}`;
  return `
    <div class="glam-card p-5 flex items-start justify-between gap-4">
      <div>
        <p class="font-display text-lg">${s.name}</p>
        <p class="text-sm text-glam-ink/60 mt-1">${s.description || ""}</p>
        <p class="text-xs text-glam-ink/50 mt-2">${s.duration_minutes} min</p>
      </div>
      <div class="text-right shrink-0">
        <p class="font-semibold mb-2">PKR ${s.price.toLocaleString()}</p>
        <a href="${bookUrl}" class="glam-btn-primary inline-block text-xs font-semibold px-4 py-2 rounded-full">Book</a>
      </div>
    </div>
  `;
}

async function loadAndRenderAvailability(providerId) {
  const badge = document.getElementById("availability-badge");
  const summary = document.getElementById("availability-summary");
  try {
    const res = await fetch(`${API_BASE}/availability/${providerId}`);
    if (!res.ok) throw new Error("Request failed");
    const slots = await res.json();

    if (!slots.length) {
      badge.innerHTML = `<div class="glam-status-full font-semibold text-sm border border-glam-rose/30 rounded-full px-4 py-2 whitespace-nowrap">No open slots right now</div>`;
      summary.textContent = "No open slots right now — check back soon, or contact the provider directly.";
      return;
    }

    badge.innerHTML = `<div class="glam-status-available font-semibold text-sm border border-glam-sage/30 rounded-full px-4 py-2 whitespace-nowrap">Open for booking</div>`;
    summary.innerHTML = `${slots.length} open slot${slots.length === 1 ? "" : "s"} this week. Pick a service above, then choose a time on the next step.`;
  } catch (err) {
    console.error("Failed to load availability", err);
    summary.textContent = "Couldn't load availability right now.";
  }
}

async function loadAndRenderReviews(providerId) {
  const reviewsSection = document.createElement("section");
  reviewsSection.className = "mb-8";
  reviewsSection.id = "reviews-section";
  reviewsSection.innerHTML = `<h2 class="font-display text-2xl text-glam-ink mb-4">Reviews</h2>
    <div class="glam-card p-6 text-glam-ink/60 text-sm">Loading reviews…</div>`;
  document.getElementById("profile-root").appendChild(reviewsSection);

  try {
    const response = await fetch(`${API_BASE}/reviews/provider/${providerId}`);
    const data = await response.json();

    if (!response.ok) {
      reviewsSection.querySelector(".glam-card").textContent = data.message || "Unable to load reviews.";
      return;
    }

    reviewsSection.innerHTML = renderReviewsSection(data);
  } catch (err) {
    console.error(err);
    reviewsSection.querySelector(".glam-card").textContent = "Could not connect to the server to load reviews.";
  }
}

function renderReviewsSection(data) {
  const { totalReviews, averageRating, reviews } = data;

  if (!totalReviews) {
    return `
      <h2 class="font-display text-2xl text-glam-ink mb-4">Reviews</h2>
      <div class="glam-card p-6 text-glam-ink/60 text-sm">No reviews yet.</div>
    `;
  }

  return `
    <h2 class="font-display text-2xl text-glam-ink mb-4">
      Reviews
      <span class="text-base font-normal text-glam-ink/60">
        · <span class="glam-accent">★</span> ${averageRating.toFixed(1)} (${totalReviews} review${totalReviews === 1 ? "" : "s"})
      </span>
    </h2>
    <div class="grid gap-4">
      ${reviews.map(renderReviewCard).join("")}
    </div>
  `;
}

function renderReviewCard(r) {
  const customerName = r.booking_id && r.booking_id.customer_id ? r.booking_id.customer_id.name : "Anonymous";
  const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : "";
  return `
    <div class="glam-card p-5">
      <div class="flex items-center justify-between">
        <p class="font-semibold">${customerName}</p>
        <p class="text-sm text-glam-ink/60"><span class="glam-accent">★</span> ${r.rating}/5 · ${date}</p>
      </div>
      ${r.comment ? `<p class="text-glam-ink/70 mt-2">${r.comment}</p>` : ""}
    </div>
  `;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}