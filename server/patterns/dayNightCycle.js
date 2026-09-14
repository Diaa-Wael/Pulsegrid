/**
 * Slow global sine wave layered under everything else, so the whole
 * grid gently drifts warmer/cooler (or busier/quieter, for traffic)
 * even without any hotspot nearby. Output is normalized: returns a
 * value in roughly [-amplitude, +amplitude] around 0, meant to be
 * added to a 0-1 normalized channel value before clamping.
 * @param {number} t - elapsed seconds
 * @param {number} periodSeconds - length of one full cycle
 * @param {number} amplitude - +/- swing applied to the baseline (0-1 scale)
 */
export function dayNightBaseline(t, periodSeconds = 120, amplitude = 0.1) {
  return Math.sin((t / periodSeconds) * Math.PI * 2) * amplitude;
}
