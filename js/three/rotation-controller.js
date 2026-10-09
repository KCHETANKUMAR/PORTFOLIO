import { clamp, damp } from "../utils/env.js";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

/**
 * RotationController — continuous (non-snapping) yaw with inertia.
 *
 * Model of motion:
 *   target   : where the user/auto-rotation wants the model to be (unbounded radians)
 *   angle    : what is rendered; critically-damped follow of `target`
 *   inertia  : angular velocity (rad/s) that keeps pushing `target` after release
 *
 * Everything is integrated with dt, so behaviour is identical at 30/60/120 Hz.
 */
export class RotationController {
  constructor({
    sensitivity = 0.0078, // rad per pixel of horizontal drag
    followRateDrag = 26, // how tightly angle tracks target while dragging
    followRateFree = 11, // ...and after release (softer, more cinematic)
    friction = 4.2, // inertia decay per second
    maxVelocity = 7, // rad/s clamp so a flick never goes wild
    autoSpeedDeg = 28, // 360° in ~12.8s
    autoDelayMs = 4000,
    reducedMotion = false,
  } = {}) {
    this.sensitivity = sensitivity;
    this.followRateDrag = followRateDrag;
    this.followRateFree = followRateFree;
    this.friction = friction;
    this.maxVelocity = maxVelocity;
    this.autoSpeed = autoSpeedDeg * DEG * (reducedMotion ? 0.35 : 1);
    this.autoDelayMs = autoDelayMs;

    this.angle = 0;
    this.target = 0;
    this.inertia = 0;
    this.dragging = false;
    this.holdDir = 0; // -1 / 0 / +1 for button hold
    this.autoEnabled = !reducedMotion; // user-facing play/pause state
    this._autoGain = 0; // 0..1 ramp so auto-rotation eases in and out
    this._lastInteraction = -Infinity;
    this._lastX = 0;
    this._lastT = 0;
    this._vel = 0;
    this._lastMoveT = 0;
    this._now = performance.now();
  }

  /* ---------- pointer input ---------- */
  begin(x, t = performance.now()) {
    this.dragging = true;
    this.inertia = 0;
    this._vel = 0;
    this._lastX = x;
    this._lastT = t;
    this._lastMoveT = t;
    this.touch(t);
  }

  move(x, t = performance.now()) {
    if (!this.dragging) return;
    const dx = x - this._lastX;
    const dt = Math.max(0.004, (t - this._lastT) / 1000);
    this.target += dx * this.sensitivity;
    // Exponentially smoothed velocity => robust against uneven event timing.
    const inst = (dx * this.sensitivity) / dt;
    this._vel += (inst - this._vel) * 0.35;
    this._lastX = x;
    this._lastT = t;
    this._lastMoveT = t;
    this.touch(t);
  }

  end(t = performance.now()) {
    if (!this.dragging) return;
    this.dragging = false;
    // A pause before release means "stop here" — no fling.
    const fresh = t - this._lastMoveT < 90;
    this.inertia = fresh ? clamp(this._vel, -this.maxVelocity, this.maxVelocity) : 0;
    this._vel = 0;
    this.touch(t);
  }

  /** Pointer was taken over by the browser (e.g. vertical page scroll): no fling. */
  cancel() {
    this.dragging = false;
    this.inertia = 0;
    this._vel = 0;
  }

  /** Programmatic step (buttons / keyboard). */
  nudge(deg) {
    this.inertia = 0;
    this.target += deg * DEG;
    this.touch();
  }

  /** Smoothly return to the nearest front-facing (0°) view. */
  faceFront() {
    this.inertia = 0;
    this.target = Math.round(this.target / TAU) * TAU;
    this.touch();
  }

  hold(dir) {
    this.holdDir = dir;
    if (dir) this.inertia = 0;
    this.touch();
  }

  touch(t = performance.now()) {
    this._lastInteraction = t;
  }

  setAuto(enabled) {
    this.autoEnabled = enabled;
    this.touch();
  }

  /* ---------- simulation ---------- */
  /**
   * @param {number} dt seconds
   * @returns {boolean} true while anything is still moving (keep the loop alive)
   */
  update(dt, now = performance.now()) {
    this._now = now;

    // Held arrow buttons: smooth constant-speed rotation.
    if (this.holdDir) {
      this.target += this.holdDir * 130 * DEG * dt;
      this._lastInteraction = now;
    }

    // Inertia after release.
    if (!this.dragging && Math.abs(this.inertia) > 0.002) {
      this.target += this.inertia * dt;
      this.inertia *= Math.exp(-this.friction * dt);
    } else if (!this.dragging) {
      this.inertia = 0;
    }

    // Auto rotation — eases in/out, only after the idle delay.
    const idle = now - this._lastInteraction > this.autoDelayMs;
    const wantAuto = this.autoEnabled && idle && !this.dragging && !this.holdDir;
    this._autoGain += ((wantAuto ? 1 : 0) - this._autoGain) * damp(wantAuto ? 0.9 : 9, dt);
    if (this._autoGain < 0.002) this._autoGain = 0;
    if (this._autoGain > 0) this.target += this.autoSpeed * this._autoGain * dt;

    // Damped follow.
    const rate = this.dragging ? this.followRateDrag : this.followRateFree;
    const diff = this.target - this.angle;
    if (Math.abs(diff) < 1e-5) {
      this.angle = this.target;
    } else {
      this.angle += diff * damp(rate, dt);
    }

    return (
      this.dragging ||
      this.holdDir !== 0 ||
      Math.abs(this.target - this.angle) > 2e-4 ||
      Math.abs(this.inertia) > 0.002 ||
      this._autoGain > 0 ||
      (this.autoEnabled && !this.dragging) // waiting to start auto-rotation
    );
  }

  /** Whether the loop must stay alive just to count down to auto-rotation. */
  get isAutoPending() {
    return this.autoEnabled && !this.dragging;
  }

  /** Current angle in degrees, normalised to [0, 360). Continuous. */
  get degrees() {
    const d = (this.angle / DEG) % 360;
    return d < 0 ? d + 360 : d;
  }
}
