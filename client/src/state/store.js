/**
 * Minimal pub-sub store (no Zustand/Redux needed for a project this
 * small). Anything the HUD needs to display lives here.
 */
function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    get: () => state,
    set: (patch) => {
      state = { ...state, ...patch };
      listeners.forEach((fn) => fn(state));
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export const store = createStore({
  connected: false,
  fps: 0,
  frameTimeMs: 0,
  updatesPerSecond: 0,
  buildingCount: 0,
  activeSensor: 'temp',
});
