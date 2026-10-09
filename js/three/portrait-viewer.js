import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RotationController } from "./rotation-controller.js";
import { buildStudio } from "./studio.js";
import { normalizeModel } from "./model-normalizer.js";
import { clamp } from "../utils/env.js";

const DEG = Math.PI / 180;
const FOV = 20; // ≈ 85–100 mm portrait lens on a full-frame sensor: no wide-angle distortion

/**
 * PortraitViewer — owns the WebGL scene, the render loop and all 3D input.
 *
 * Loop policy: requestAnimationFrame runs ONLY while something is moving,
 * the stage is on screen and the tab is visible. A still model costs nothing.
 */
export class PortraitViewer {
  /**
   * @param {object} o
   * @param {HTMLCanvasElement} o.canvas
   * @param {HTMLElement} o.surface   element that receives pointer input
   * @param {{maxPixelRatio:number, antialias:boolean}} o.tier
   * @param {boolean} o.reducedMotion
   * @param {number} [o.yawOffsetDeg]
   */
  constructor({ canvas, surface, tier, reducedMotion = false, yawOffsetDeg = 0 }) {
    this.canvas = canvas;
    this.surface = surface;
    this.tier = tier;
    this.yawOffset = yawOffsetDeg * DEG;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, tier.maxPixelRatio);

    this.controller = new RotationController({ reducedMotion });
    this.onAngle = null; // (deg:number) => void
    this.onDraggingChange = null; // (bool) => void
    this.onContextLost = null;
    this.report = null;

    this._raf = 0;
    this._running = false;
    this._last = 0;
    this._dirty = true;
    this._onScreen = true;
    this._pageVisible = !document.hidden;
    this._enabled = false; // becomes true after start()
    this._frameAcc = 0;
    this._frameN = 0;
    this._disposed = false;
    this._pointerId = null;
    this._lastDeg = -1;

    this._tick = this._tick.bind(this);
    this._init();
  }

  /* =================================================================== */
  _init() {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.tier.antialias,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(this.pixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = false; // contact depth is drawn in CSS; no shadow-map cost
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
    this.studio = buildStudio(this.scene, renderer);

    // Listeners (all removed in dispose()).
    this._ac = new AbortController();
    const sig = { signal: this._ac.signal };
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this._stopLoop();
      this.onContextLost?.();
    }, sig);
    this.canvas.addEventListener("webglcontextrestored", () => {
      this._dirty = true;
      this.wake();
    }, sig);

    this._bindInput(sig);

    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(this.surface);

    this._io = new IntersectionObserver(
      ([e]) => {
        this._onScreen = e.isIntersecting;
        this._onScreen ? this.wake() : this._stopLoop();
      },
      { threshold: 0.02 },
    );
    this._io.observe(this.surface);

    document.addEventListener("visibilitychange", () => {
      this._pageVisible = !document.hidden;
      this._pageVisible ? this.wake() : this._stopLoop();
    }, sig);

    this.resize();
  }

  /* =================================================================== */
  /** Load the GLB with real byte progress. */
  load(url, { onProgress, approxBytes = 0 } = {}) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          if (this._disposed) return this._disposeObject(gltf.scene);
          try {
            this._mount(gltf);
            resolve(this.report);
          } catch (err) {
            reject(err);
          }
        },
        (xhr) => {
          const total = xhr.lengthComputable && xhr.total ? xhr.total : approxBytes;
          if (total) onProgress?.(clamp(xhr.loaded / total, 0, 1));
        },
        (err) => reject(err instanceof Error ? err : new Error("GLB failed to load")),
      );
    });
  }

  _mount(gltf) {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      o.frustumCulled = false; // single mesh, always in view; avoids bbox edge cases while rotating
      const m = o.material;
      m.side = THREE.FrontSide; // closed scan: back faces are never seen, halves fill cost
      if ("specularIntensity" in m) {
        m.specularIntensity = 0.55; // glTF file ships with specular ×2 (plastic look) — temper it
        m.specularColor?.setScalar(1);
      }
      for (const k of ["map", "normalMap", "roughnessMap", "metalnessMap"]) {
        if (m[k]) m[k].anisotropy = Math.min(8, maxAniso);
      }
      m.needsUpdate = true;
    });

    const { pivot, height, radius, report } = normalizeModel(gltf.scene, { height: 1 });
    this.pivot = pivot;
    this.modelHeight = height;
    this.modelRadius = radius;
    this.report = { ...report, animations: gltf.animations?.length || 0 };
    this.scene.add(pivot);
    this._frame();
    this._dirty = true;
    this._render(); // first frame (also uploads textures to the GPU)
  }

  /* =================================================================== */
  /** Stable portrait framing: camera never moves while the subject rotates. */
  _frame() {
    if (!this.modelHeight) return;
    const aspect = this.camera.aspect;
    const t = Math.tan((FOV * DEG) / 2);
    const margin = 1.04;
    const dV = (this.modelHeight * 0.5 * margin) / t;
    const dH = (this.modelRadius * margin * 1.1) / (t * aspect);
    const dist = Math.max(dV, dH);
    const lookY = this.modelHeight * 0.5;
    this.camera.position.set(0, lookY + 0.02, dist);
    this.camera.lookAt(0, lookY, 0);
    this.camera.updateProjectionMatrix();
  }

  resize() {
    if (this._disposed) return;
    const w = Math.max(1, this.surface.clientWidth);
    const h = Math.max(1, this.surface.clientHeight);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this._frame();
    this._dirty = true;
    this.wake();
  }

  /* =================================================================== */
  _bindInput(sig) {
    const el = this.surface;
    const c = this.controller;

    el.addEventListener("pointerdown", (e) => {
      if (!this._enabled) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      this._pointerId = e.pointerId;
      try { el.setPointerCapture(e.pointerId); } catch {}
      c.begin(e.clientX, e.timeStamp);
      el.classList.add("is-dragging");
      this.onDraggingChange?.(true);
      this.wake();
    }, sig);

    el.addEventListener("pointermove", (e) => {
      if (e.pointerId !== this._pointerId || !c.dragging) return;
      // Coalesced events give 120–240 Hz pointer detail on supported devices.
      const list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
      if (list && list.length) for (const ev of list) c.move(ev.clientX, ev.timeStamp);
      else c.move(e.clientX, e.timeStamp);
      this.wake();
    }, sig);

    const release = (cancel) => (e) => {
      if (e.pointerId !== this._pointerId) return;
      this._pointerId = null;
      cancel ? c.cancel() : c.end(e.timeStamp);
      el.classList.remove("is-dragging");
      this.onDraggingChange?.(false);
      this.wake();
    };
    el.addEventListener("pointerup", release(false), sig);
    el.addEventListener("pointercancel", release(true), sig);
    el.addEventListener("lostpointercapture", release(false), sig);

    // Horizontal trackpad scroll / Shift+wheel rotates. Plain wheel always scrolls the page.
    el.addEventListener("wheel", (e) => {
      if (!this._enabled) return;
      const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!horiz && !e.shiftKey) return;
      e.preventDefault();
      c.nudge((horiz ? e.deltaX : e.deltaY) * 0.22);
      this.wake();
    }, { passive: false, signal: sig.signal });

    // Keyboard: the canvas is a slider.
    this.canvas.addEventListener("keydown", (e) => {
      if (!this._enabled) return;
      const step = e.shiftKey ? 20 : 6;
      let handled = true;
      if (e.key === "ArrowLeft") c.nudge(-step);
      else if (e.key === "ArrowRight") c.nudge(step);
      else if (e.key === "Home") c.faceFront();
      else handled = false;
      if (handled) { e.preventDefault(); this.wake(); }
    }, sig);

    // Any other click/tap on the surface also counts as interaction.
    el.addEventListener("click", () => c.touch(), sig);
  }

  /* =================================================================== */
  /** Public: enable interaction + animation (called when the intro finishes). */
  start() {
    this._enabled = true;
    this.controller.touch();
    this.wake();
  }

  wake() {
    if (this._running || this._disposed || !this._enabled && !this._dirty) return;
    if (!this._onScreen || !this._pageVisible || !this.pivot) return;
    this._running = true;
    this._last = performance.now();
    this._raf = requestAnimationFrame(this._tick);
  }

  _stopLoop() {
    this._running = false;
    cancelAnimationFrame(this._raf);
  }

  _tick(now) {
    if (!this._running) return;
    const dt = clamp((now - this._last) / 1000, 0.001, 0.05);
    this._last = now;

    const c = this.controller;
    const before = c.angle;
    const active = this._enabled ? c.update(dt, now) : false;
    const changed = c.angle !== before;

    if (changed || this._dirty) {
      this._render();
      this._adaptQuality(dt, changed);
    }

    // Keep the loop alive only while the controller has work (drag, inertia,
    // easing, auto-rotation or the idle countdown). Otherwise it goes to sleep.
    this._dirty = false;
    if (active) {
      this._raf = requestAnimationFrame(this._tick);
    } else {
      this._running = false;
    }
  }

  _render() {
    const c = this.controller;
    this.pivot.rotation.y = c.angle + this.yawOffset;
    this.renderer.render(this.scene, this.camera);

    const deg = c.degrees;
    if (Math.abs(deg - this._lastDeg) > 0.01) {
      this._lastDeg = deg;
      this.onAngle?.(deg, c.angle);
    }
  }

  /** Drops resolution if the device can't hold ~40fps while moving. Never raises it (no flapping). */
  _adaptQuality(dt, moving) {
    if (!moving || this.pixelRatio <= 1) return;
    this._frameAcc += dt;
    if (++this._frameN < 75) return;
    const avg = this._frameAcc / this._frameN;
    this._frameAcc = 0;
    this._frameN = 0;
    if (avg > 1 / 40) {
      this.pixelRatio = Math.max(1, this.pixelRatio - 0.25);
      this.renderer.setPixelRatio(this.pixelRatio);
      this.renderer.setSize(this.surface.clientWidth, this.surface.clientHeight, false);
      this._dirty = true;
    }
  }

  /* =================================================================== */
  setAutoRotate(on) {
    this.controller.setAuto(on);
    this.wake();
  }
  get autoRotate() {
    return this.controller.autoEnabled;
  }
  nudge(deg) { this.controller.nudge(deg); this.wake(); }
  hold(dir) { this.controller.hold(dir); this.wake(); }
  get degrees() { return this.controller.degrees; }

  /* =================================================================== */
  _disposeObject(obj) {
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) {
        for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose();
        m.dispose();
      }
    });
  }

  dispose() {
    this._disposed = true;
    this._stopLoop();
    this._ac?.abort();
    this._ro?.disconnect();
    this._io?.disconnect();
    if (this.pivot) { this._disposeObject(this.pivot); this.scene.remove(this.pivot); }
    this.studio?.dispose();
    this.renderer?.dispose();
    this.renderer?.forceContextLoss?.();
  }
}
