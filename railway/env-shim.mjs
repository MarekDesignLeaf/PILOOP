// Node replacement for the cloudflare:workers binding. server.mjs sets globalThis.__piloopEnv.
export const env = new Proxy({}, { get: (_, key) => globalThis.__piloopEnv?.[key] });
