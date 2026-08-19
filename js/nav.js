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