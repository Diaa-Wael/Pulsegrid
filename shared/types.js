/**
 * Shared JSON payload shapes between server/index.js and
 * client/src/net/socketClient.js. Kept as plain JSDoc typedefs (no
 * build step needed) so both sides can eyeball the same contract.
 */

/**
 * Sent once per connection, right after the socket opens.
 * @typedef {Object} InitMessage
 * @property {'init'} type
 * @property {number} gridSize
 * @property {Building[]} buildings
 */

/**
 * @typedef {Object} Building
 * @property {string} id       - "x_y" grid coordinate string
 * @property {number} index    - flat index = y * gridSize + x, matches InstancedMesh
 * @property {number} x
 * @property {number} y
 * @property {number} height   - cosmetic building height multiplier
 */

/**
 * Sent on every simulation tick (see server/config.js TICK_MS).
 * @typedef {Object} UpdateMessage
 * @property {'update'} type
 * @property {number} t          - server timestamp (ms)
 * @property {ValueUpdate[]} updates
 */

/**
 * @typedef {Object} ValueUpdate
 * @property {number} index  - InstancedMesh instance index
 * @property {number} value  - sensor reading, 0-100
 */

export {};
