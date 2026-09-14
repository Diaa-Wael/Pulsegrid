import * as THREE from 'three';
import { createColorRampTexture } from './colorRamp.js';

import vertexShader from '../shaders/heatmap.vert.glsl?raw';
import fragmentShader from '../shaders/heatmap.frag.glsl?raw';

const MIN_VALUE = 0;
const MAX_VALUE = 100;
const CELL_SPACING = 1.2;

/**
 * Builds and owns a single THREE.InstancedMesh for the entire building
 * grid. Values are written directly into a pre-allocated
 * InstancedBufferAttribute — no geometry rebuilds, no per-instance
 * Object3D, no material swaps. This is the piece that makes 60 FPS at
 * high update rates realistic.
 */
export class CityMesh {
  /**
   * @param {THREE.Scene} scene
   * @param {number} gridSize
   * @param {Array<{index:number,x:number,y:number,height:number}>} buildings
   */
  constructor(scene, gridSize, buildings) {
    this.gridSize = gridSize;
    this.count = gridSize * gridSize;

    const geometry = new THREE.BoxGeometry(0.8, 1, 0.8);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        colorRamp: { value: createColorRampTexture() },
      },
    });

    this.mesh = new THREE.InstancedMesh(geometry, this.material, this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Per-instance "value" attribute (0-1, normalized), read by the
    // vertex shader and interpolated to the fragment shader.
    this.valueAttribute = new THREE.InstancedBufferAttribute(new Float32Array(this.count), 1);
    this.valueAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('value', this.valueAttribute);

    this._placeBuildings(buildings);

    scene.add(this.mesh);

    // index -> {x, y} lookup used by the tooltip / raycast path.
    this.indexToBuilding = new Map(buildings.map((b) => [b.index, b]));
  }

  _placeBuildings(buildings) {
    const dummy = new THREE.Object3D();
    const offset = (this.gridSize * CELL_SPACING) / 2;

    for (const b of buildings) {
      const worldX = b.x * CELL_SPACING - offset;
      const worldZ = b.y * CELL_SPACING - offset;

      dummy.position.set(worldX, b.height / 2, worldZ);
      dummy.scale.set(1, b.height, 1);
      dummy.updateMatrix();

      this.mesh.setMatrixAt(b.index, dummy.matrix);
      this.valueAttribute.array[b.index] = 0.2; // neutral starting value
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    this.valueAttribute.needsUpdate = true;
  }

  /**
   * Applies a flat Float32Array of [index0, value0, index1, value1, ...]
   * pairs (as produced by dataParser.worker.js) directly into the
   * attribute buffer, then flags a single needsUpdate for the whole
   * batch rather than one GPU upload per value.
   */
  applyUpdates(flatPairs) {
    const arr = this.valueAttribute.array;
    for (let i = 0; i < flatPairs.length; i += 2) {
      const index = flatPairs[i];
      const rawValue = flatPairs[i + 1];
      const normalized = (rawValue - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
      arr[index] = Math.min(1, Math.max(0, normalized));
    }
    this.valueAttribute.needsUpdate = true;
  }

  /** Returns the building + current value at a given instance index, for the tooltip. */
  getBuildingInfo(index) {
    const building = this.indexToBuilding.get(index);
    if (!building) return null;
    const normalized = this.valueAttribute.array[index];
    return { ...building, value: normalized * (MAX_VALUE - MIN_VALUE) + MIN_VALUE };
  }
}
