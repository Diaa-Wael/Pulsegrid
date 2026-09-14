import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager.js';
import { CityMesh } from './scene/CityMesh.js';
import { addLighting } from './scene/lighting.js';
import { SocketClient } from './net/socketClient.js';
import { store } from './state/store.js';
import { PerfMonitor } from './utils/perf.js';
import { UpdateRateCounter } from './utils/bufferPool.js';
import { initHUD } from './ui/HUD.jsx';
import { updateLegendForSensor } from './ui/Legend.js';
import { showTooltip } from './ui/Tooltip.js';

// Import the worker with Vite's built-in `?worker` suffix — no config needed.
import DataParserWorker from './workers/dataParser.worker.js?worker';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

export class App {
  constructor(container) {
    this.container = container;
    this.sceneManager = new SceneManager(container);
    addLighting(this.sceneManager.scene);

    this.cityMesh = null; // built once the 'init' message arrives
    this.perf = new PerfMonitor();
    this.updateRate = new UpdateRateCounter();

    this._setupWorker();
    this._setupSocket();
    this._setupRaycasting();

    initHUD({ onSensorChange: (sensor) => this._onSensorChange(sensor) });
    updateLegendForSensor('temp');

    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _setupWorker() {
    this.worker = new DataParserWorker();

    this.worker.onmessage = (event) => {
      const msg = event.data;

      if (msg.type === 'init') {
        this.cityMesh = new CityMesh(this.sceneManager.scene, msg.gridSize, msg.buildings);
        store.set({ buildingCount: msg.buildings.length });
      }

      if (msg.type === 'update' && this.cityMesh) {
        const flatPairs = new Float32Array(msg.buffer);
        this.cityMesh.applyUpdates(flatPairs);
        this.updateRate.record(msg.count);
      }
    };
  }

  _setupSocket() {
    this.socket = new SocketClient(WS_URL, {
      onRawMessage: (raw) => this.worker.postMessage(raw),
      onStatusChange: (connected) => store.set({ connected }),
    });
  }

  _setupRaycasting() {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.container.addEventListener('click', (event) => {
      if (!this.cityMesh) return;

      this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.sceneManager.camera);
      const hits = this.raycaster.intersectObject(this.cityMesh.mesh);

      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const info = this.cityMesh.getBuildingInfo(hits[0].instanceId);
        if (info) {
          showTooltip(
            { id: info.id, value: info.value, unit: info.unit },
            { x: event.clientX, y: event.clientY }
          );
          return;
        }
      }
      showTooltip(null);
    });
  }

  _onSensorChange(sensor) {
    this.cityMesh?.setActiveSensor(sensor);
    store.set({ activeSensor: sensor });
    updateLegendForSensor(sensor);
  }

  _loop() {
    requestAnimationFrame(this._loop);

    const freshSample = this.perf.tick();
    if (freshSample) {
      store.set({
        fps: this.perf.fps,
        frameTimeMs: this.perf.frameTimeMs,
        updatesPerSecond: this.updateRate.rate,
      });
    }

    this.sceneManager.render();
  }
}
