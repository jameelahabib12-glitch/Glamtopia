/**
 * Renders a single provider profile from mock data.
 * Booking buttons don't create real bookings yet — this is the guest-facing
 * browse skeleton only. Per SRS FR-13, guests are only pushed to
 * login/register at the point of booking, never before.
 */
(async function initProvider() {
  const root = document.getElementById("profile-root");
  const id = new URLSearchParams(window.location.search).get("id");
  const provider = id ? await MockAPI.getProviderById(id) : null;

  if (!provider) {
    root.innerHTML = `
      <div class="glam-card p-10 text-center">
        <p class="font-display text-2xl mb-2">Provider not found</p>
        <p class="text-glam-ink/60 mb-6">This profile may have been removed or the link is incorrect.</p>
        <a href="browse.html" class="glam-btn-primary inline-block font-semibold px-6 py-3 rounded-full">Browse providers</a>
      </div>
    `;
    return;
  }

  document.title = `${provider.business_name} — Glamtopia`;
  root.innerHTML = renderProfile(provider);
  bindBookingButtons();
})();

function renderProfile(p) {
  return `
    <section class="glam-card p-8 mb-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p class="glam-eyebrow mb-2">${capitalize(p.category)} · ${p.location}</p>
          <h1 class="font-display text-3xl md:text-4xl text-glam-ink">${p.business_name}</h1>
          <p class="text-sm font-semibold mt-2">
            ★ ${p.average_rating.toFixed(1)}
            <span class="text-glam-ink/50 font-normal">(${p.review_count} reviews)</span>
          </p>
        </div>
        ${
          p.fully_booked
            ? `<div class="glam-status-full font-semibold text-sm border border-glam-rose/30 rounded-full px-4 py-2 whitespace-nowrap">Fully booked — check back soon</div>`
            : `<div class="glam-status-available font-semibold text-sm border border-glam-sage/30 rounded-full px-4 py-2 whitespace-nowrap">Open for booking</div>`
        }
      </div>
      <p class="text-glam-ink/70 mt-6 max-w-2xl">${p.bio}</p>
      <p class="text-sm text-glam-ink/60 mt-3">Contact: ${p.contact_info}</p>
    </section>

    <section class="mb-8">
      <h2 class="font-display text-2xl text-glam-ink mb-4">Services</h2>
      <div class="grid sm:grid-cols-2 gap-4">
        ${p.services.map(renderService).join("")}
      </div>
    </section>

    <section class="mb-8">
      <h2 class="font-display text-2xl text-glam-ink mb-4">Availability</h2>
      ${renderAvailability(p)}
    </section>
  `;
}

function renderService(s) {
  return `
    <div class="glam-card p-5 flex items-start justify-between gap-4">
      <div>
        <p class="font-display text-lg">${s.name}</p>
        <p class="text-sm text-glam-ink/60 mt-1">${s.description}</p>
        <p class="text-xs text-glam-ink/50 mt-2">${s.duration_minutes} min</p>
      </div>
      <div class="text-right shrink-0">
        <p class="font-semibold mb-2">PKR ${s.price.toLocaleString()}</p>
        <button
          type="button"
          class="book-btn glam-btn-primary text-xs font-semibold px-4 py-2 rounded-full"
          data-service="${s.name}"
        >Book</button>
      </div>
    </div>
  `;
}

function renderAvailability(p) {
  if (p.fully_booked) {
    return `
      <div class="glam-card p-6 text-glam-ink/70 text-sm">
        No open slots right now. Estimated next availability: <strong>in 3–5 days</strong>.
        Placeholder — real build computes this live against <code>availability_slots</code>.
      </div>
    `;
  }

  const mockSlots = ["Today · 2:00 PM", "Today · 4:00 PM", "Tomorrow · 11:00 AM", "Tomorrow · 1:00 PM"];
  return `
    <div class="flex flex-wrap gap-3">
      ${mockSlots
        .map(
          (slot) => `
        <button type="button" class="book-btn glam-chip px-4 py-2 rounded-full text-sm" data-service="${slot}">
          ${slot}
        </button>`
        )
        .join("")}
    </div>
    <p class="text-xs text-glam-ink/50 mt-3">Placeholder slots — wired to <code>availability_slots</code> in the real build.</p>
  `;
}

function bindBookingButtons() {
  document.querySelectorAll(".book-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // FR-13: guests are only prompted to log in at the point of booking.
      window.location.href = "login.html?next=booking";
    });
  });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}