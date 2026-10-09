import { $$ } from "../utils/dom.js";

/** Scroll-triggered reveals. One observer, each target animates once. */
export function initReveal() {
  const targets = $$("[data-reveal]");
  targets.forEach((t) => { if (t.dataset.reveal === "stagger") [...t.children].forEach((c, i) => c.style.setProperty("--i", i)); });
  if (!("IntersectionObserver" in window)) { targets.forEach((t) => t.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  targets.forEach((t) => io.observe(t));
}
