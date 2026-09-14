# Architecture

## Data flow

```
Node.js mock server (server/index.js)
  │  every TICK_MS, broadcasts a JSON batch:
  │  { type: "update", updates: [{ index, value }, ...] }
  ▼
Browser WebSocket (client/src/net/socketClient.js)
  │  forwards the raw string, untouched, to a Web Worker
  ▼
Web Worker (client/src/workers/dataParser.worker.js)
  │  JSON.parse() happens HERE, off the main thread
  │  flattens updates into a single Float32Array [i0,v0,i1,v1,...]
  │  posts it back via a transferable (zero-copy)
  ▼
Main thread (client/src/App.js)
  │  receives the Float32Array, hands it to CityMesh.applyUpdates()
  ▼
CityMesh (client/src/scene/CityMesh.js)
  │  writes values directly into a pre-allocated
  │  InstancedBufferAttribute, sets needsUpdate = true once per batch
  ▼
GPU (client/src/shaders/heatmap.*.glsl)
     vertex shader passes the value through
     fragment shader samples a 256x1 LUT texture -> final color
```

## Why each piece exists

- **Batched WS messages, not one-per-sensor**: fewer message parses
  and fewer worker round-trips at the same total update volume.
- **Web Worker for JSON.parse**: `JSON.parse` on a large batch is
  synchronous and can spike the main thread for a few ms — enough to
  drop frames at 60 FPS budgets (16.6 ms/frame). Moving it off-thread
  means the render loop never waits on it.
- **Transferable `Float32Array` instead of a plain object array**:
  posting a JS array of `{index, value}` objects back from the worker
  means structured-clone has to walk and copy every object. A
  transferable typed array moves ownership of the underlying memory
  with (effectively) zero copy cost.
- **InstancedMesh + InstancedBufferAttribute, not per-building meshes
  or geometry rebuilds**: one draw call for the whole grid, and
  updating a value is a single float write into an existing buffer —
  no new geometry, no material swap, no scene graph changes.
- **Shader-side LUT sampling, not per-fragment gradient math**: the
  color ramp is precomputed once into a 256x1 texture; the fragment
  shader does one `texture2D` lookup instead of branching/lerping
  between color stops on every pixel, every frame.

## Where this would go next for "real" IoT

Swap `server/index.js`'s raw `ws` server for a small bridge that
subscribes to a real MQTT broker topic (Mosquitto/EMQX, open-source)
and republishes over the same WebSocket JSON contract — the client
code doesn't need to change at all, since it only knows about the
`{type, updates}` shape in `shared/types.js`.
