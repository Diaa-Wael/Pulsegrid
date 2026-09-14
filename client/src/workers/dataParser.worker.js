// Runs entirely off the main thread. Receives raw JSON strings from
// socketClient.js, parses them, and posts back a flat Float32Array of
// [index0, value0, index1, value1, ...] pairs using a transferable
// buffer (zero-copy) so the main thread never blocks on JSON.parse
// or object allocation for large update batches.

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
    const flat = new Float32Array(updates.length * 2);

    for (let i = 0; i < updates.length; i++) {
      flat[i * 2] = updates[i].index;
      flat[i * 2 + 1] = updates[i].value;
    }

    // Transfer ownership of the buffer instead of copying it.
    self.postMessage({ type: 'update', count: updates.length, buffer: flat.buffer }, [flat.buffer]);
  }
};
