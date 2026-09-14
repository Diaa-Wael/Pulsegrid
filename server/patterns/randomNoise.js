/**
 * Small, cheap per-tick jitter so values never look perfectly static
 * even far away from any hotspot. Amplitude is on the same normalized
 * 0-1 scale as hotspot contributions and the day/night baseline.
 * @param {number} amplitude - max +/- change applied (0-1 scale)
 * @returns {number}
 */
export function randomNoise(amplitude = 0.03) {
  return (Math.random() * 2 - 1) * amplitude;
}
