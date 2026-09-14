# Performance notes

## What to measure

The HUD (bottom-left panel) shows FPS, frame time, and updates/sec
live. To stress-test:

1. Lower `TICK_MS` in `server/config.js` (e.g. `50`) and/or raise
   `UPDATE_FRACTION` toward `1` to broadcast more updates per second.
2. Raise `GRID_SIZE` (e.g. `64` = 4,096 buildings) to grow the mesh.
3. Watch `frametime` in the HUD — it should stay close to 16.6 ms
   (60 FPS) even as updates/sec climbs into the thousands, because the
   cost of an update is "write N floats into an existing buffer,"
   independent of how the value got there.

## The naive alternative (for comparison / a demo GIF)

A common naive implementation:
- One `THREE.Mesh` per building, each with its own `MeshStandardMaterial`
  whose `.color` is set directly on every update.
- `JSON.parse` on the main thread inside the WebSocket `onmessage`
  handler.

That approach costs a material property write *and* a shader
recompile/uniform upload per building per update, plus main-thread
JSON parsing competing with the render loop — it visibly stutters well
before reaching a few hundred updates/sec on typical hardware. Pulsegrid
avoids all three costs (see `docs/architecture.md`), which is the
actual point being demonstrated by this project.

## Easy follow-up experiments

- Add a "naive mode" toggle that swaps `CityMesh` for a version using
  individual meshes, to make the contrast visible in a recorded demo.
- Log `performance.now()` deltas around the worker round-trip to show
  parse time staying flat regardless of main-thread render load.
