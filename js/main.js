/**
 * Entry point. Order matters:
 *   1. render data-driven DOM           (works with or without WebGL)
 *   2. start loader + load GLB          (real progress)
 *   3. on "Enter": play the entrance sequence, then enable interaction
 */
import { SITE_CONFIG as C } from "./config/site-config.js";
import { $ } from "./utils/dom.js";
import { prefersReducedMotion, supportsWebGL, getQualityTier } from "./utils/env.js";
import { renderSite } from "./ui/render-sections.js";
import { initCaseModal } from "./ui/modal.js";
import { initNav } from "./ui/nav.js";
import { initReveal } from "./ui/reveal.js";
import { createLoader } from "./ui/loader.js";
import { createHUD } from "./ui/hud.js";
import { initPointerFx } from "./ui/pointer-fx.js";

const root = document.documentElement;
const reduced = prefersReducedMotion();
if (reduced) root.classList.add("reduced-motion");

const stage = $("#stage");
const surface = $("#stage-surface");
const canvas = $("#portrait-canvas");
const fallback = $("#stage-fallback");

function showFallback(reason) {
  root.classList.add("gl-failed");
  $("#stage-fallback-reason").textContent = reason;
  fallback.hidden = false;
  surface.hidden = true;
}

/* ---------- 1. content ---------- */
const openCase = initCaseModal();
renderSite(C, { openCase });
initNav();
initReveal();

/* ---------- 2. loader + 3D ---------- */
const loader = createLoader();
let viewer = null;
let hud = null;

async function boot() {
  if (!supportsWebGL()) {
    root.classList.add("no-webgl");
    showFallback("Your browser or device could not start WebGL.");
    return loader.ready("3D unavailable — continuing without it");
  }
  const tier = getQualityTier();
  const url = tier.lite ? C.model.liteUrl : C.model.url;
  const approxBytes = tier.lite ? C.model.approxBytesLite : C.model.approxBytes;

  try {
    // three.js is imported lazily so a failure here degrades gracefully instead of breaking the page.
    const { PortraitViewer } = await import("./three/portrait-viewer.js");
    viewer = new PortraitViewer({ canvas, surface, tier, reducedMotion: reduced, yawOffsetDeg: C.model.yawOffsetDeg });
    viewer.onContextLost = () => showFallback("The graphics context was lost. Reload the page to restore the 3D portrait.");
    hud = createHUD({ viewer, canvas, stage });

    const aboutRing = $("#about-ring");
    viewer.onAngle = (deg) => {
      hud.update(deg);
      aboutRing.style.transform = `rotate(${deg.toFixed(2)}deg)`; // About ring mirrors the real model angle
    };

    const report = await viewer.load(url, { onProgress: (p) => loader.progress(p), approxBytes });
    console.info("[portrait] model ready", { tier: tier.name, ...report });
    loader.ready();
  } catch (err) {
    console.error("[portrait] 3D failed:", err);
    viewer?.dispose();
    viewer = null;
    showFallback("The 3D model could not be loaded. The rest of the portfolio works normally.");
    loader.ready("3D unavailable — continuing without it");
  }
}

/* ---------- 3. entrance ---------- */
loader.onEnter(() => {
  root.classList.add("is-ready"); // CSS drives the staged entrance (0 → ~1s)
  initPointerFx();
  // hero becomes interactive at ~1.4s, per the entrance timeline
  setTimeout(() => viewer?.start(), 1400);
});

boot();

// Release GPU memory if the page is torn down (bfcache-safe).
addEventListener("pagehide", (e) => { if (!e.persisted) viewer?.dispose(); });
