// Some websocket/crypto packages expect Node's `global`.
// Provide it in the browser before those packages execute.
globalThis.global = globalThis

