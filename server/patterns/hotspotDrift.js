/**
 * Creates N "hotspots" that drift smoothly around the grid using
 * independent sine/cosine paths. Each building's value is boosted
 * based on its distance to the nearest hotspot, producing organic,
 * moving "heat blobs" instead of pure random noise.
 *
 * Output is channel-agnostic: contributions are normalized to 0-1 so
 * the same drift logic can drive temperature, AQI, or traffic — each
 * channel just gets its own independent set of hotspots (different
 * seeds/speeds), which is what makes the three sensors visibly
 * different from each other instead of reskins of the same data.
 */
export function createHotspots(count, gridSize) {
  const hotspots = [];
  for (let i = 0; i < count; i++) {
    hotspots.push({
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.25,
      radius: gridSize * (0.15 + Math.random() * 0.15),
      intensity: 0.6 + Math.random() * 0.4, // normalized 0-1 peak strength
    });
  }
  return hotspots;
}

/** Advances hotspot positions and returns their current (x, y) centers. */
export function stepHotspots(hotspots, t, gridSize) {
  const center = gridSize / 2;
  const orbit = gridSize * 0.35;
  return hotspots.map((h) => ({
    ...h,
    x: center + Math.cos(t * h.speed + h.phaseX) * orbit,
    y: center + Math.sin(t * h.speed + h.phaseY) * orbit,
  }));
}

/**
 * Given a building's grid coords, returns the extra normalized (0-1)
 * value contributed by nearby hotspots (falls off with distance).
 */
export function hotspotContribution(bx, by, positionedHotspots) {
  let contribution = 0;
  for (const h of positionedHotspots) {
    const dx = bx - h.x;
    const dy = by - h.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const falloff = Math.max(0, 1 - dist / h.radius);
    contribution += falloff * h.intensity;
  }
  return contribution;
}
