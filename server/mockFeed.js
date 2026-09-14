import { CONFIG } from './config.js';
import { randomNoise } from './patterns/randomNoise.js';
import { createHotspots, stepHotspots, hotspotContribution } from './patterns/hotspotDrift.js';
import { dayNightBaseline } from './patterns/dayNightCycle.js';

const CHANNEL_NAMES = ['temp', 'aqi', 'traffic'];

/**
 * Owns the full grid state for all three sensor channels and knows
 * how to advance each one tick. Every channel keeps its own set of
 * drifting hotspots, so temp/AQI/traffic genuinely diverge from each
 * other instead of being the same number relabeled three ways — this
 * is what makes the client's sensor toggle actually change what's on
 * screen.
 *
 * Internally each channel is tracked as a normalized 0-1 value per
 * building; it's converted to its real-world unit range (see
 * CONFIG.SENSOR_RANGES) only when writing outgoing updates.
 */
export class MockFeed {
  constructor(gridSize = CONFIG.GRID_SIZE) {
    this.gridSize = gridSize;
    this.startedAt = Date.now();
    const totalBuildings = gridSize * gridSize;

    this.channels = {};
    for (const name of CHANNEL_NAMES) {
      this.channels[name] = {
        hotspots: createHotspots(CONFIG.HOTSPOT_COUNT, gridSize),
        // normalized 0-1 current value per building
        values: new Float32Array(totalBuildings).fill(0.2 + Math.random() * 0.1),
      };
    }
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

  _toRealUnit(channelName, normalized) {
    const range = CONFIG.SENSOR_RANGES[channelName];
    return range.min + normalized * (range.max - range.min);
  }

  /** Advances the simulation and returns a sparse array of per-building updates. */
  tick() {
    const t = (Date.now() - this.startedAt) / 1000;
    const totalBuildings = this.gridSize * this.gridSize;
    const updateCount = Math.floor(totalBuildings * CONFIG.UPDATE_FRACTION);

    // Same set of building indices gets an update for all three
    // channels this tick, so each update message carries a complete
    // {temp, aqi, traffic} reading per building.
    const indices = new Array(updateCount);
    for (let i = 0; i < updateCount; i++) {
      indices[i] = Math.floor(Math.random() * totalBuildings);
    }

    // Advance hotspots once per channel per tick (not per building).
    const positionedByChannel = {};
    const baselineByChannel = {};
    for (const name of CHANNEL_NAMES) {
      const channel = this.channels[name];
      positionedByChannel[name] = stepHotspots(channel.hotspots, t, this.gridSize);
      baselineByChannel[name] = dayNightBaseline(t);
    }

    const updates = [];
    for (const index of indices) {
      const x = index % this.gridSize;
      const y = Math.floor(index / this.gridSize);
      const entry = { index };

      for (const name of CHANNEL_NAMES) {
        const channel = this.channels[name];
        const target =
          0.25 +
          baselineByChannel[name] +
          hotspotContribution(x, y, positionedByChannel[name]) +
          randomNoise();

        const clamped = Math.max(0, Math.min(1, target));

        // Ease toward the target instead of snapping, so buildings
        // visibly ramp rather than flicker.
        channel.values[index] += (clamped - channel.values[index]) * 0.3;

        entry[name] = Number(this._toRealUnit(name, channel.values[index]).toFixed(2));
      }

      updates.push(entry);
    }

    return updates;
  }
}
