# Pulsegrid

A real-time 3D IoT heatmap. A mock WebSocket server streams fake sensor
readings (temperature / AQI / traffic) for a grid of "buildings"; the
browser client renders them as an instanced 3D cityscape and recolors
every building live at 60 FPS using a custom GLSL shader, with JSON
parsing offloaded to a Web Worker so the main thread never stalls.

```
┌──────────────┐   JSON over WS    ┌──────────────────┐   Float32Array    ┌──────────────────┐
│ mock server  │ ───────────────▶ │ Web Worker        │ ─ transferable ─▶ │ Three.js scene    │
│ (Node + ws)  │                   │ (parses payload)  │                  │ (InstancedMesh +  │
└──────────────┘                   └──────────────────┘                  │  custom shader)   │
                                                                          └──────────────────┘
```

## Stack

- **Client**: Vite, Three.js, vanilla JS, custom GLSL vertex/fragment shaders
- **Server**: Node.js, `ws`
- **Transport**: WebSocket (JSON messages), Web Worker for off-thread parsing
- **License**: MIT

## Quick start

### 1. Run the mock server
```bash
cd server
npm install
npm start
# listening on ws://localhost:8080
```

### 2. Run the client
```bash
cd client
npm install
npm run dev
# open the printed http://localhost:5173 URL
```

That's it — the client auto-connects to `ws://localhost:8080` and the
grid starts pulsing. Edit `client/.env` (copy from `.env.example`) if
your server runs elsewhere.

## What to look at first

- `server/mockFeed.js` — generates a grid of building IDs and drives
  their values each tick using drifting "hotspot" + noise patterns.
- `client/src/workers/dataParser.worker.js` — parses incoming JSON off
  the main thread and returns a plain `Float32Array` via a transferable
  `postMessage`.
- `client/src/scene/CityMesh.js` — builds one `THREE.InstancedMesh` for
  the whole grid and writes new values directly into a per-instance
  attribute buffer (`needsUpdate = true`) instead of touching geometry.
- `client/src/shaders/heatmap.frag.glsl` — samples a 1D LUT texture to
  turn a 0–1 value into a color (turbo-style ramp), fully on the GPU.

See `docs/architecture.md` for the full data-flow writeup and
`docs/perf-notes.md` for why the buffer/worker approach is fast.

## Deploying for free

- **Client** → GitHub Pages / Netlify / Vercel (static build from `client/dist`)
- **Server** → Render.com or Railway free tier (small always-on Node service)

## License

MIT — see `LICENSE`.
