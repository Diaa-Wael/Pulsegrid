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

  // Value domain sensors report in (already normalized 0-100 so the
  // client can map it straight onto a 0-1 color ramp).
  MIN_VALUE: 0,
  MAX_VALUE: 100,

  // Number of simultaneous drifting "hotspots" (e.g. heat clusters).
  HOTSPOT_COUNT: 3,
};
