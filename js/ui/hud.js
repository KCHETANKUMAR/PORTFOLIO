import { svgEl, $ } from "../utils/dom.js";
import { mod360 } from "../utils/env.js";

const CX = 180, CY = 42, RX = 166, RY = 28, N = 72;

/**
 * 360° indicator. Everything shown is derived from the REAL model angle:
 * readout number, travelling dot, glowing arc segment and tick brightness.
 */
export function createHUD({ viewer, canvas, stage }) {
  const ticks = $("#hud-ticks");
  const dot = $("#hud-dot");
  const active = $("#hud-active");
  const num = $("#hud-angle");
  const btnL = $("#hud-left"), btnR = $("#hud-right"), play = $("#hud-play");

  // True arc-length table so the glowing segment stays centred on the dot
  // (ellipse parameter angle ≠ arc length).
  const SAMPLES = 360;
  const cum = [0];
  let px = 0, py = RY;
  for (let i = 1; i <= SAMPLES; i++) {
    const t = (i / SAMPLES) * Math.PI * 2;
    const x = RX * Math.sin(t), y = RY * Math.cos(t);
    cum.push(cum[i - 1] + Math.hypot(x - px, y - py));
    px = x; py = y;
  }
  const total = cum[SAMPLES];
  const frac = (deg) => {
    const f = (mod360(deg) / 360) * SAMPLES, i = Math.floor(f);
    return (cum[i] + (cum[Math.min(i + 1, SAMPLES)] - cum[i]) * (f - i)) / total;
  };

  const tickEls = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const major = i % 6 === 0;
    const s2 = major ? 0.8 : 0.9;
    const l = svgEl("line", {
      x1: CX + RX * Math.sin(a), y1: CY + RY * Math.cos(a),
      x2: CX + RX * s2 * Math.sin(a), y2: CY + RY * s2 * Math.cos(a),
      class: major ? "major" : "",
    });
    ticks.append(l);
    tickEls.push({ l, v: -1 });
  }

  const SEG = 52; // glowing segment length in path units (of 360)
  let lastInt = -1;

  function update(deg) {
    const a = (mod360(deg) * Math.PI) / 180;
    const sinA = Math.sin(a), cosA = Math.cos(a);
    // dot rides the ellipse; slightly smaller/dimmer when "behind" the subject
    dot.setAttribute("cx", (CX + RX * sinA).toFixed(2));
    dot.setAttribute("cy", (CY + RY * cosA).toFixed(2));
    dot.setAttribute("r", (cosA >= 0 ? 4.6 : 3.4).toFixed(1));
    dot.style.opacity = cosA >= 0 ? "1" : "0.6";

    let start = frac(deg) * 360 - SEG / 2;
    if (start < 0) start += 360;
    active.setAttribute("stroke-dasharray", `${SEG} ${360 - SEG}`);
    active.setAttribute("stroke-dashoffset", (-start).toFixed(2));

    for (let i = 0; i < N; i++) {
      let d = Math.abs(i * (360 / N) - mod360(deg));
      if (d > 180) d = 360 - d;
      const o = 0.2 + 0.8 * Math.exp(-((d / 16) ** 2));
      const t = tickEls[i];
      if (Math.abs(o - t.v) > 0.03) {
        t.v = o;
        t.l.style.strokeOpacity = o.toFixed(2);
        t.l.style.stroke = o > 0.6 ? "rgba(60,200,255,.95)" : "";
      }
    }

    const n = Math.round(mod360(deg)) % 360;
    if (n !== lastInt) {
      lastInt = n;
      num.textContent = n;
      canvas.setAttribute("aria-valuenow", n);
      canvas.setAttribute("aria-valuetext", `${n} degrees`);
    }
  }

  // Arrow buttons: tap = 30° glide, press-and-hold = continuous rotation.
  function bindArrow(btn, dir) {
    let timer = 0, holding = false, pid = null;
    btn.addEventListener("pointerdown", (e) => {
      pid = e.pointerId;
      btn.setPointerCapture?.(pid);
      holding = false;
      timer = setTimeout(() => { holding = true; viewer.hold(dir); }, 240);
    });
    const up = () => {
      if (pid === null) return;
      pid = null;
      clearTimeout(timer);
      if (holding) viewer.hold(0); else viewer.nudge(dir * 30);
      holding = false;
    };
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", () => { clearTimeout(timer); if (holding) viewer.hold(0); holding = false; pid = null; });
    btn.addEventListener("click", (e) => { if (e.detail === 0) viewer.nudge(dir * 30); }); // keyboard activation
  }
  bindArrow(btnL, -1);
  bindArrow(btnR, 1);

  const setPlayUI = (on) => {
    play.setAttribute("aria-pressed", String(on));
    const t = on ? "Pause auto rotation" : "Play auto rotation";
    play.setAttribute("aria-label", t);
    play.setAttribute("data-tooltip", t);
  };
  setPlayUI(viewer.autoRotate);
  play.addEventListener("click", () => { viewer.setAutoRotate(!viewer.autoRotate); setPlayUI(viewer.autoRotate); });

  viewer.onDraggingChange = (d) => stage.classList.toggle("is-interacting", d);
  update(0);
  return { update };
}
