/**
 * Rolling FPS + frame-time tracker. Call tick() once per animation
 * frame; sample() returns the latest smoothed reading roughly once a
 * second (cheap enough to update HUD text without janking the loop).
 */
export class PerfMonitor {
  constructor() {
    this.lastTime = performance.now();
    this.frames = 0;
    this.fps = 0;
    this.frameTimeMs = 0;
    this._accum = 0;
  }

  tick() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;
    this.frameTimeMs = delta;
    this.frames++;
    this._accum += delta;

    if (this._accum >= 1000) {
      this.fps = Math.round((this.frames * 1000) / this._accum);
      this.frames = 0;
      this._accum = 0;
      return true; // signal: a fresh 1-second sample is ready
    }
    return false;
  }
}
