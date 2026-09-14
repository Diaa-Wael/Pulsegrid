import { SENSOR_RANGES } from '../config/sensors.js';

export function updateLegendForSensor(sensor) {
  const range = SENSOR_RANGES[sensor] || SENSOR_RANGES.temp;
  const labels = document.querySelector('.legend-labels');
  if (!labels) return;
  labels.innerHTML = `<span>${range.min} ${range.unit}</span><span>${range.max} ${range.unit}</span>`;
}
