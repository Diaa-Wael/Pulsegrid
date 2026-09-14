// Runs entirely off the main thread. Receives raw JSON strings from
// socketClient.js, parses them, and posts back a flat Float32Array of
// [index0, temp0, aqi0, traffic0, index1, temp1, aqi1, traffic1, ...]
// quads using a transferable buffer (zero-copy) so the main thread
// never blocks on JSON.parse or object allocation for large batches.

self.onmessage = (event) => {
  const raw = event.data;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    self.postMessage({ type: 'error', message: 'bad JSON payload' });
    return;
  }

  if (parsed.type === 'init') {
    // Pass the init message straight through — it's small and only
    // happens once, so there's no need to flatten it.
    self.postMessage({ type: 'init', gridSize: parsed.gridSize, buildings: parsed.buildings });
    return;
  }

  if (parsed.type === 'update') {
    const updates = parsed.updates || [];
    const STRIDE = 4; // index, temp, aqi, traffic
    const flat = new Float32Array(updates.length * STRIDE);

    for (let i = 0; i < updates.length; i++) {
      const u = updates[i];
      flat[i * STRIDE] = u.index;
      flat[i * STRIDE + 1] = u.temp;
      flat[i * STRIDE + 2] = u.aqi;
      flat[i * STRIDE + 3] = u.traffic;
    }

    // Transfer ownership of the buffer instead of copying it.
    self.postMessage({ type: 'update', count: updates.length, buffer: flat.buffer }, [flat.buffer]);
  }
};
