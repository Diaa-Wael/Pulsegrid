import * as THREE from 'three';
import { createColorRampTexture } from './colorRamp.js';
import { SENSOR_RANGES, SENSOR_ORDER } from '../config/sensors.js';

import vertexShader from '../shaders/heatmap.vert.glsl?raw';
import fragmentShader from '../shaders/heatmap.frag.glsl?raw';

const CELL_SPACING = 1.2;

/**
 * Builds and owns a single THREE.InstancedMesh for the entire building
 * grid. Values are written directly into a pre-allocated
 * InstancedBufferAttribute — no geometry rebuilds, no per-instance
 * Object3D, no material swaps. This is the piece that makes 60 FPS at
 * high update rates realistic.
 *
 * The server streams all three sensor channels (temp/aqi/traffic) for
 * every updated building every tick. This class keeps a raw real-unit
 * Float32Array per channel and only ever pushes the *currently active*
 * channel into the GPU-facing `value` attribute — so switching the HUD
 * toggle recolors the whole grid using data that was already there,
 * with no network round-trip.
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
    this.activeSensor = 'temp';

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

    // Per-instance "value" attribute (0-1, normalized for whichever
    // sensor is active), read by the vertex shader.
    this.valueAttribute = new THREE.InstancedBufferAttribute(new Float32Array(this.count), 1);
    this.valueAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('value', this.valueAttribute);

    // Raw, real-unit values per channel — the actual source of truth.
    this.raw = {};
    for (const sensor of SENSOR_ORDER) {
      const midpoint = (SENSOR_RANGES[sensor].min + SENSOR_RANGES[sensor].max) / 2;
      this.raw[sensor] = new Float32Array(this.count).fill(midpoint);
    }

    this._placeBuildings(buildings);
    this._recomputeActiveAttribute();

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
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  _normalize(sensor, rawValue) {
    const { min, max } = SENSOR_RANGES[sensor];
    return Math.min(1, Math.max(0, (rawValue - min) / (max - min)));
  }

  /** Rewrites the whole GPU-facing attribute from `raw[activeSensor]`. Used on sensor switch. */
  _recomputeActiveAttribute() {
    const arr = this.valueAttribute.array;
    const rawChannel = this.raw[this.activeSensor];
    for (let i = 0; i < this.count; i++) {
      arr[i] = this._normalize(this.activeSensor, rawChannel[i]);
    }
    this.valueAttribute.needsUpdate = true;
  }

  /** Switches which channel drives the shader and immediately recolors the whole grid. */
  setActiveSensor(sensor) {
    if (!SENSOR_RANGES[sensor] || sensor === this.activeSensor) return;
    this.activeSensor = sensor;
    this._recomputeActiveAttribute();
  }

  /**
   * Applies a flat Float32Array of [index, temp, aqi, traffic, ...]
   * quads (as produced by dataParser.worker.js). Updates all three raw
   * channels every time (so switching sensors later has fresh data
   * immediately), but only touches the GPU attribute for whichever
   * channel is currently active, and does one needsUpdate per batch.
   */
  applyUpdates(flatQuads) {
    const STRIDE = 4;
    const activeArr = this.valueAttribute.array;

    for (let i = 0; i < flatQuads.length; i += STRIDE) {
      const index = flatQuads[i];
      const temp = flatQuads[i + 1];
      const aqi = flatQuads[i + 2];
      const traffic = flatQuads[i + 3];

      this.raw.temp[index] = temp;
      this.raw.aqi[index] = aqi;
      this.raw.traffic[index] = traffic;

      activeArr[index] = this._normalize(
        this.activeSensor,
        this.activeSensor === 'temp' ? temp : this.activeSensor === 'aqi' ? aqi : traffic
      );
    }

    this.valueAttribute.needsUpdate = true;
  }

  /** Returns the building + current active-sensor reading at a given instance index, for the tooltip. */
  getBuildingInfo(index) {
    const building = this.indexToBuilding.get(index);
    if (!building) return null;
    return {
      ...building,
      sensor: this.activeSensor,
      unit: SENSOR_RANGES[this.activeSensor].unit,
      value: this.raw[this.activeSensor][index],
    };
  }
}
