import * as THREE from 'three';

/**
 * Builds a 256x1 canvas texture that maps a 0-1 value to a color,
 * blue -> green -> yellow -> red (turbo-ish, calm/hot readable ramp).
 * The fragment shader samples this once per pixel instead of doing
 * the gradient math on the GPU per-fragment, keeping the shader tiny.
 */
export function createColorRampTexture() {
  const width = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = 1;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0.0, '#1e3a5f'); // cool / low
  gradient.addColorStop(0.35, '#2ecc71'); // moderate
  gradient.addColorStop(0.65, '#f4c542'); // elevated
  gradient.addColorStop(1.0, '#e5484d'); // hot / high

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
