/**
 * Mobile nav toggle. Safe to include on every page — it no-ops if the
 * page has no #nav-toggle/#nav-menu (most pages only have the simple
 * logo + auth-button header). Also usable later for a dashboard sidebar
 * toggle, since it just flips nav-open/nav-closed on any matching pair.
 */
(function initNavToggle() {
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.contains("nav-open");
    menu.classList.toggle("nav-open", !isOpen);
    menu.classList.toggle("nav-closed", isOpen);
    toggle.setAttribute("aria-expanded", String(!isOpen));
  });

  // Close the menu when a link inside it is clicked (mobile UX nicety)
  menu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      menu.classList.remove("nav-open");
      menu.classList.add("nav-closed");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
})();

/**
 * Auth-aware navbar. Previously the Login/Sign up buttons in the header
 * were static markup on every guest-facing page (Index.html, browse.html,
 * provider.html) — they showed even to someone who was already logged in,
 * with no way back to their own dashboard and no way to log out short of
 * manually clearing cookies. This checks the session once per page load
 * and swaps the buttons for "Dashboard" + "Log out" when one exists.
 *
 * Opt-in: only runs on pages with a #auth-nav-buttons container, so pages
 * that don't have the guest login/signup buttons (login.html, register.html,
 * booking-flow.html, the dashboards) are unaffected.
 */
(function initAuthAwareNav() {
  const container = document.getElementById("auth-nav-buttons");
  if (!container) return;

  const API_BASE = "http://localhost:5000/api";

  fetch(`${API_BASE}/auth/me`, { credentials: "include" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (!data || !data.user) return; // not logged in — leave the default Login/Sign up buttons as-is

      const dashboardUrl =
        data.user.role === "provider"
          ? "client/provider-dashboard.html"
          : "customer-dashboard.html";

      container.innerHTML = `
        <a href="${dashboardUrl}" class="glam-btn-outline text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">Dashboard</a>
        <button id="nav-logout-btn" type="button" class="glam-btn-primary text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">Log out</button>
      `;

      document.getElementById("nav-logout-btn").addEventListener("click", async () => {
        try {
          await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
        } catch (err) {
          console.error("Logout request failed:", err);
        } finally {
          window.location.href = "index.html";
        }
      });
    })
    .catch((err) => {
      // Not logged in, or the server's unreachable — either way, the
      // default Login/Sign up buttons already in the markup are the
      // correct fallback, so there's nothing to do here.
      console.error("Auth check failed:", err);
    });
})();