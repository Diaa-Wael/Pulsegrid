const el = () => document.getElementById('tooltip');
const idEl = () => document.getElementById('tooltip-id');
const valueEl = () => document.getElementById('tooltip-value');

/**
 * @param {{id: string, value: number} | null} info - null hides the tooltip
 * @param {{x: number, y: number}} screenPos - pixel coords to anchor at
 */
export function showTooltip(info, screenPos) {
  const tooltip = el();
  if (!info) {
    tooltip.style.display = 'none';
    return;
  }
  idEl().textContent = `bldg_${info.id}`;
  valueEl().textContent = `${info.value.toFixed(1)}`;
  tooltip.style.left = `${screenPos.x}px`;
  tooltip.style.top = `${screenPos.y}px`;
  tooltip.style.display = 'block';
}
