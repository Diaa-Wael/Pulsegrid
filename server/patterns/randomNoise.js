/**
 * Small, cheap per-tick jitter so values never look perfectly static
 * even far away from any hotspot.
 * @param {number} amplitude - max +/- change applied
 * @returns {number}
 */
export function randomNoise(amplitude = 2) {
  return (Math.random() * 2 - 1) * amplitude;
}
