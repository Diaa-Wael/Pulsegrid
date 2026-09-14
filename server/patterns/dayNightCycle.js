/**
 * Slow global sine wave (a full cycle every ~2 minutes by default)
 * layered under everything else, so the whole grid gently breathes
 * warmer/cooler even without any hotspot nearby. Meant to mimic a
 * compressed day/night temperature cycle.
 * @param {number} t - elapsed seconds
 * @param {number} periodSeconds - length of one full cycle
 * @param {number} amplitude - +/- swing applied to the baseline
 */
export function dayNightBaseline(t, periodSeconds = 120, amplitude = 10) {
  return Math.sin((t / periodSeconds) * Math.PI * 2) * amplitude;
}
