/**
 * The legend's gradient bar is pure CSS in index.html (see
 * `.legend-bar`), kept in sync by eye with colorRamp.js's stops.
 * This module exists so a future "per-sensor legend" (different
 * min/max labels per toggle) has a single place to update text.
 */
const RANGES = {
  temp: { label: '°C', low: '10', high: '38' },
  aqi: { label: 'AQI', low: '0', high: '150' },
  traffic: { label: 'veh/min', low: '0', high: '100' },
};

export function updateLegendForSensor(sensor) {
  const range = RANGES[sensor] || RANGES.temp;
  const labels = document.querySelector('.legend-labels');
  if (!labels) return;
  labels.innerHTML = `<span>${range.low} ${range.label}</span><span>${range.high} ${range.label}</span>`;
}
