import { CONFIG } from './config.js';
import { randomNoise } from './patterns/randomNoise.js';
import { createHotspots, stepHotspots, hotspotContribution } from './patterns/hotspotDrift.js';
import { dayNightBaseline } from './patterns/dayNightCycle.js';

/**
 * Owns the full grid state and knows how to advance it one tick.
 * Building ids are simple "x_y" strings so the client can map them
 * straight to an InstancedMesh index without a lookup table round-trip
 * on first load (see buildingList()).
 */
export class MockFeed {
  constructor(gridSize = CONFIG.GRID_SIZE) {
    this.gridSize = gridSize;
    this.startedAt = Date.now();
    this.hotspots = createHotspots(CONFIG.HOTSPOT_COUNT, gridSize);

    // Flat array, index = y * gridSize + x, matches InstancedMesh index order.
    this.values = new Float32Array(gridSize * gridSize).fill(20);
  }

  /** Full static list the client needs once on connect to build geometry. */
  buildingList() {
    const buildings = [];
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        buildings.push({
          id: `${x}_${y}`,
          index: y * this.gridSize + x,
          x,
          y,
          height: 1 + Math.random() * 4, // varied skyline, purely cosmetic
        });
      }
    }
    return buildings;
  }

  /** Advances the simulation and returns a sparse array of {index, value} updates. */
  tick() {
    const t = (Date.now() - this.startedAt) / 1000;
    const positionedHotspots = stepHotspots(this.hotspots, t, this.gridSize);
    const baseline = dayNightBaseline(t);
    const updates = [];

    const totalBuildings = this.gridSize * this.gridSize;
    const updateCount = Math.floor(totalBuildings * CONFIG.UPDATE_FRACTION);

    for (let i = 0; i < updateCount; i++) {
      const index = Math.floor(Math.random() * totalBuildings);
      const x = index % this.gridSize;
      const y = Math.floor(index / this.gridSize);

      const target =
        20 + baseline + hotspotContribution(x, y, positionedHotspots) + randomNoise(3);

      const clamped = Math.max(CONFIG.MIN_VALUE, Math.min(CONFIG.MAX_VALUE, target));

      // Ease toward the target instead of snapping, so buildings visibly
      // ramp rather than flicker.
      this.values[index] += (clamped - this.values[index]) * 0.3;

      updates.push({ index, value: Number(this.values[index].toFixed(2)) });
    }

    return updates;
  }
}
