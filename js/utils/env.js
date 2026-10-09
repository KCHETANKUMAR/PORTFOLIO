/** Environment / capability detection. Pure functions, no side effects. */

export const mq = (q) => (typeof matchMedia === "function" ? matchMedia(q) : { matches: false, addEventListener() {} });

export const prefersReducedMotion = () => mq("(prefers-reduced-motion: reduce)").matches;
export const hasFinePointer = () => mq("(hover: hover) and (pointer: fine)").matches;
export const isCoarsePointer = () => mq("(pointer: coarse)").matches;

export function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

/**
 * Pick a rendering tier. "lite" = phones & low-memory devices.
 * Tier decides: which GLB, max pixel ratio, antialiasing.
 */
export function getQualityTier() {
  const small = Math.min(window.innerWidth, window.innerHeight) < 600 || window.innerWidth < 768;
  const veryLowMem = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 2;
  const lowMem = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4;
  const lowCpu = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
  // Phones/tablets with modest hardware, or any very-low-memory device, get the light model.
  const lite = veryLowMem || (isCoarsePointer() && (small || lowMem || lowCpu));
  return lite
    ? { name: "lite", maxPixelRatio: 1.5, antialias: true, lite: true }
    : { name: "high", maxPixelRatio: 2, antialias: true, lite: false };
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
/** Frame-rate independent smoothing factor. */
export const damp = (rate, dt) => 1 - Math.exp(-rate * dt);
export const mod360 = (deg) => ((deg % 360) + 360) % 360;
