/**
 * Mirrors server/config.js's SENSOR_RANGES. Kept as a separate
 * hand-synced constant (no shared build step between client/server)
 * so the client can normalize each channel's real-unit values back
 * to 0-1 for the shader, and label the legend/tooltip correctly.
 */
export const SENSOR_RANGES = {
  temp: { min: 10, max: 38, unit: '°C', label: 'Temperature' },
  aqi: { min: 0, max: 150, unit: 'AQI', label: 'Air quality' },
  traffic: { min: 0, max: 100, unit: 'veh/min', label: 'Traffic' },
};

export const SENSOR_ORDER = ['temp', 'aqi', 'traffic'];
