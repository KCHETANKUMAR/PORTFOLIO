import { clamp, damp } from "../utils/env.js";

/**
 * Loader — shows REAL download progress (smoothed so the number never jumps),
 * then offers "Enter experience". Exposes: progress(0..1), ready(msg), onEnter(cb).
 */
export function createLoader() {
  const root = document.getElementById("loader");
  const ring = document.getElementById("loader-ring");
  const pct = document.getElementById("loader-pct");
  const label = document.getElementById("loader-label");
  const btn = document.getElementById("loader-enter");

  let target = 0, shown = 0, raf = 0, last = 0, finished = false, enterCb = null;

  const paint = () => {
    const v = Math.round(shown * 100);
    pct.textContent = v;
    ring.style.strokeDashoffset = String(100 - shown * 100);
  };

  const loop = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    shown += (target - shown) * damp(5, dt);
    if (target - shown < 0.0015) shown = target;
    paint();
    if (shown >= 1 && finished) { cancelAnimationFrame(raf); showEnter(); return; }
    raf = requestAnimationFrame(loop);
  };

  function showEnter() {
    root.classList.add("is-done");
    btn.hidden = false;
    btn.focus({ preventScroll: true });
  }

  btn.addEventListener("click", () => {
    root.classList.add("is-leaving");
    document.documentElement.classList.remove("is-loading");
    setTimeout(() => root.remove(), 1400);
    enterCb?.();
  });

  raf = requestAnimationFrame(loop);

  return {
    progress(p) { target = clamp(Math.max(target, p * 0.98), 0, 0.98); },
    ready(message) {
      if (message) label.textContent = message;
      else label.textContent = "3D experience ready";
      target = 1;
      finished = true;
    },
    onEnter(cb) { enterCb = cb; },
  };
}
