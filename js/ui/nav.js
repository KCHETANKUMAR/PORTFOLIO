import { $, $$ } from "../utils/dom.js";

export function initNav() {
  const root = document.documentElement;
  const links = $$("#nav-links a");
  const pill = $("#nav-pill");
  const list = $("#nav-links");
  const toggle = $("#nav-toggle");
  const menu = $("#menu");
  const menuLinks = $$(".menu__list a");
  let current = "home";

  /* ---- scrolled state (stronger glass) ---- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      root.classList.toggle("is-scrolled", window.scrollY > 24);
      const max = document.documentElement.scrollHeight - innerHeight;
      $(".ambient")?.style.setProperty("--sp", max > 0 ? (scrollY / max).toFixed(4) : "0");
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- active pill ---- */
  function movePill() {
    const a = links.find((l) => l.dataset.section === current);
    if (!a || !pill) return;
    pill.style.setProperty("--x", `${a.offsetLeft}px`);
    pill.style.setProperty("--w", `${a.offsetWidth}px`);
    pill.style.setProperty("--o", "1");
  }
  function setActive(id) {
    current = id;
    links.forEach((l) => l.setAttribute("aria-current", l.dataset.section === id ? "true" : "false"));
    menuLinks.forEach((l) => l.setAttribute("aria-current", l.getAttribute("href") === `#${id}` ? "true" : "false"));
    movePill();
  }
  new ResizeObserver(movePill).observe(list);
  document.fonts?.ready.then(movePill);

  /* ---- scroll-spy ---- */
  const ids = links.map((l) => l.dataset.section);
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
    { rootMargin: "-42% 0px -52% 0px", threshold: 0 },
  );
  ids.forEach((id) => { const s = document.getElementById(id); s && io.observe(s); });
  setActive("home");

  /* ---- mobile menu ---- */
  menuLinks.forEach((a, i) => a.parentElement.style.setProperty("--k", i));
  let open = false;
  function setMenu(v) {
    open = v;
    menu.classList.toggle("is-open", v);
    toggle.setAttribute("aria-expanded", String(v));
    toggle.setAttribute("aria-label", v ? "Close menu" : "Open menu");
    menu.toggleAttribute("inert", !v);
    menu.setAttribute("aria-hidden", String(!v));
    root.style.overflow = v ? "hidden" : "";
    if (v) setTimeout(() => menuLinks[0]?.focus({ preventScroll: true }), 80);
    else toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener("click", () => setMenu(!open));
  menu.addEventListener("click", (e) => { if (e.target.closest("[data-close-menu]")) { const href = e.target.closest("a")?.getAttribute("href"); setMenu(false); if (href) { e.preventDefault(); setTimeout(() => document.querySelector(href)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }), 60); } } });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && open) setMenu(false); });
  matchMedia("(min-width: 1120px)").addEventListener("change", (e) => e.matches && open && setMenu(false));
}
