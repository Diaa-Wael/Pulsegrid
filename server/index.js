import { WebSocketServer } from 'ws';
import { CONFIG } from './config.js';
import { MockFeed } from './mockFeed.js';

const feed = new MockFeed(CONFIG.GRID_SIZE);
const wss = new WebSocketServer({ port: CONFIG.PORT });

console.log(`Pulsegrid mock server listening on ws://localhost:${CONFIG.PORT}`);
console.log(`Grid: ${CONFIG.GRID_SIZE}x${CONFIG.GRID_SIZE}, tick: ${CONFIG.TICK_MS}ms`);

wss.on('connection', (socket) => {
  console.log('client connected');

  // 1. Send the static building list once, so the client can build its
  //    InstancedMesh geometry before any value updates arrive.
  socket.send(
    JSON.stringify({
      type: 'init',
      gridSize: CONFIG.GRID_SIZE,
      buildings: feed.buildingList(),
    })
  );

  socket.on('close', () => console.log('client disconnected'));
  socket.on('error', (err) => console.error('socket error:', err.message));
});

// 2. Broadcast a batch of value updates to every connected client on
//    each tick. Batching (rather than one message per sensor) keeps
//    message overhead low at high update rates.
setInterval(() => {
  const updates = feed.tick();
  if (updates.length === 0) return;

  const payload = JSON.stringify({ type: 'update', t: Date.now(), updates });

  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
}, CONFIG.TICK_MS);
