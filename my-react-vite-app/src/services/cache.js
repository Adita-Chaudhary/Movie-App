/**
 * Minimal TTL cache + in-flight request de-duplication for GET requests.
 *
 * Two distinct performance problems are solved here:
 * 1. Repeated identical requests within `ttlMs` (e.g. re-visiting Home,
 *    or two components both requesting the genre list) are served from
 *    memory instead of hitting the network again.
 * 2. Two callers requesting the *same* URL at the *same* time (e.g.
 *    StrictMode double-invoking an effect, or two rows both needing the
 *    genre map) share a single in-flight fetch instead of firing two.
 */

const store = new Map(); // key -> { value, expiresAt }
const inFlight = new Map(); // key -> Promise

export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function setCached(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export async function dedupe(key, fetcher) {
  if (inFlight.has(key)) return inFlight.get(key);

  const promise = fetcher().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

export function clearCache() {
  store.clear();
  inFlight.clear();
}
