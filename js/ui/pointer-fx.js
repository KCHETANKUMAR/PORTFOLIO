import { $, $$ } from "../utils/dom.js";
import { hasFinePointer, prefersReducedMotion, clamp, damp } from "../utils/env.js";

/** Desktop-only pointer effects. Every effect is skipped on touch and when reduced motion is on. */
export function initPointerFx() {
  const fine = hasFinePointer();
  if (!fine) return;
  const reduce = prefersReducedMotion();

  initLit();
  if (reduce) return;
  initCursor();
  initMagnetic();
  initTilt();
  initParallax();
}

/* Pointer-lit borders / glows: sets --mx / --my on the hovered surface. */
function initLit() {
  const lit = $$(".glass--lit");
  lit.forEach((n) => {
    n.addEventListener("pointermove", (e) => {
      const r = n.getBoundingClientRect();
      n.style.setProperty("--mx", `${e.clientX - r.left}px`);
      n.style.setProperty("--my", `${e.clientY - r.top}px`);
      n.querySelector(".case__glow")?.style.setProperty("--mx", `${e.clientX - r.left}px`);
      n.querySelector(".case__glow")?.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });
  });
}

/* Small dot → glass ring on interactives → "DRAG" over the 3D model. */
function initCursor() {
  const root = document.documentElement;
  const c = document.createElement("div");
  c.className = "cursor is-hidden";
  c.setAttribute("aria-hidden", "true");
  c.innerHTML = '<span class="cursor__dot"></span><span class="cursor__ring"><span class="cursor__label">Drag</span></span>';
  document.body.append(c);
  root.classList.add("has-cursor");
  const dot = c.querySelector(".cursor__dot"), ring = c.querySelector(".cursor__ring");

  // Position uses the `translate` property; scale/state animations use `transform`.
  let x = -100, y = -100, rx = x, ry = y, raf = 0, last = 0;
  const tick = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    const k = damp(16, dt);
    rx += (x - rx) * k; ry += (y - ry) * k;
    ring.style.translate = `${rx.toFixed(1)}px ${ry.toFixed(1)}px`;
    raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.15 ? requestAnimationFrame(tick) : 0;
  };
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX; y = e.clientY;
    c.classList.remove("is-hidden");
    dot.style.translate = `${x}px ${y}px`;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => c.classList.add("is-hidden"));
  document.addEventListener("pointerdown", () => c.classList.add("is-down"));
  document.addEventListener("pointerup", () => c.classList.remove("is-down"));
  document.addEventListener("pointerover", (e) => {
    const t = e.target;
    const drag = t.closest?.('[data-cursor="drag"]');
    const hover = !drag && t.closest?.("a, button, summary, [role='button'], .glass--lit");
    c.classList.toggle("is-drag", !!drag);
    c.classList.toggle("is-hover", !!hover);
  });
}

/* Magnetic buttons: ≤5px, eased. Uses the `translate` property so it never fights hover/active transforms. */
function initMagnetic() {
  const MAX = 5, RANGE = 36;
  $$(".magnetic").forEach((n) => {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, last = 0, inside = false;
    const step = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      const k = damp(14, dt);
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      n.style.translate = `${cx.toFixed(2)}px ${cy.toFixed(2)}px`;
      if (inside || Math.abs(cx) + Math.abs(cy) > 0.05) raf = requestAnimationFrame(step);
      else { n.style.translate = ""; raf = 0; }
    };
    const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } };
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = n.getBoundingClientRect();
      const mx = r.left + r.width / 2, my = r.top + r.height / 2;
      const dx = e.clientX - mx, dy = e.clientY - my;
      const near = Math.abs(dx) < r.width / 2 + RANGE && Math.abs(dy) < r.height / 2 + RANGE;
      if (near) {
        inside = true;
        tx = clamp(dx / (r.width / 2), -1, 1) * MAX;
        ty = clamp(dy / (r.height / 2), -1, 1) * MAX;
        kick();
      } else if (inside) { inside = false; tx = ty = 0; kick(); }
    }, { passive: true });
  });
}

/* Feature cards: ≤3° tilt, eased by CSS transition. */
function initTilt() {
  $$(".tilt").forEach((n) => {
    n.addEventListener("pointermove", (e) => {
      const r = n.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      n.style.setProperty("--ry", `${(px * 5).toFixed(2)}deg`);
      n.style.setProperty("--rx", `${(-py * 5).toFixed(2)}deg`);
    }, { passive: true });
    n.addEventListener("pointerleave", () => { n.style.setProperty("--rx", "0deg"); n.style.setProperty("--ry", "0deg"); });
  });
}

/* Hero depth: background slowest, panels faster, model minimal, text still. */
function initParallax() {
  const hero = $("#home");
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, last = 0, visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);
  const step = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    const k = damp(5, dt);
    cx += (tx - cx) * k; cy += (ty - cy) * k;
    hero.style.setProperty("--px", cx.toFixed(3));
    hero.style.setProperty("--py", cy.toFixed(3));
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(step) : 0;
  };
  addEventListener("pointermove", (e) => {
    if (!visible || e.pointerType !== "mouse") return;
    tx = (e.clientX / innerWidth - 0.5) * 2;
    ty = (e.clientY / innerHeight - 0.5) * 2;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
  }, { passive: true });
}
