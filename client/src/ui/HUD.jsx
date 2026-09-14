// Despite the .jsx extension (kept for parity with the original file
// structure sketch), this is plain DOM binding — no React/JSX syntax
// is actually used, so no extra build tooling is required. Rename to
// .js freely; Vite treats them the same for plain JS content.
import { store } from '../state/store.js';

export function initHUD({ onSensorChange } = {}) {
  const connDot = document.getElementById('conn-dot');
  const connLabel = document.getElementById('conn-label');
  const fpsEl = document.getElementById('fps');
  const frametimeEl = document.getElementById('frametime');
  const upsEl = document.getElementById('ups');
  const bcountEl = document.getElementById('bcount');
  const toggle = document.getElementById('sensor-toggle');

  store.subscribe((state) => {
    connDot.classList.toggle('live', state.connected);
    connLabel.textContent = state.connected ? 'live' : 'reconnecting…';
    fpsEl.textContent = state.fps;
    frametimeEl.textContent = `${state.frameTimeMs.toFixed(1)} ms`;
    upsEl.textContent = state.updatesPerSecond;
    bcountEl.textContent = state.buildingCount;
  });

  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-sensor]');
    if (!btn) return;
    [...toggle.children].forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    onSensorChange?.(btn.dataset.sensor);
  });
}
