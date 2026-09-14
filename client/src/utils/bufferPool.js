/**
 * Tracks how many individual sensor updates have arrived in the last
 * second — useful both for the HUD readout and for eyeballing how
 * hard you're stress-testing the buffer/worker pipeline.
 */
export class UpdateRateCounter {
  constructor() {
    this.windowStart = performance.now();
    this.countInWindow = 0;
    this.lastRate = 0;
  }

  record(n) {
    this.countInWindow += n;
    const now = performance.now();
    if (now - this.windowStart >= 1000) {
      this.lastRate = this.countInWindow;
      this.countInWindow = 0;
      this.windowStart = now;
    }
  }

  get rate() {
    return this.lastRate;
  }
}
