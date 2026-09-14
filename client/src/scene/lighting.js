import * as THREE from 'three';

/** Adds minimal ambient + directional lighting to the scene. */
export function addLighting(scene) {
  const ambient = new THREE.AmbientLight('#ffffff', 0.5);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight('#ffffff', 0.8);
  dir.position.set(20, 30, 10);
  scene.add(dir);
}
