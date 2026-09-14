export const CONFIG = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 8080,

  // Buildings are laid out on a GRID_SIZE x GRID_SIZE grid.
  GRID_SIZE: process.env.GRID_SIZE ? Number(process.env.GRID_SIZE) : 32,

  // How often (ms) a broadcast tick fires. Lower = more updates/sec,
  // good for stress-testing the client's buffer/worker pipeline.
  TICK_MS: process.env.TICK_MS ? Number(process.env.TICK_MS) : 150,

  // Fraction of buildings updated per tick (0-1). 1 = broadcast every
  // building every tick; lower values simulate sparser real IoT traffic.
  UPDATE_FRACTION: 0.35,

  // Each channel is simulated independently (own drifting hotspots,
  // own baseline) and reported in its own real-world unit range. The
  // client normalizes using these same ranges so switching the HUD
  // toggle actually changes what's being visualized, not just the label.
  SENSOR_RANGES: {
    temp: { min: 10, max: 38, unit: '°C' },
    aqi: { min: 0, max: 150, unit: 'AQI' },
    traffic: { min: 0, max: 100, unit: 'veh/min' },
  },

  // Number of simultaneous drifting "hotspots" per channel (e.g. heat
  // clusters, pollution plumes, traffic jams).
  HOTSPOT_COUNT: 3,
};
