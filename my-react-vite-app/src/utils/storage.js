/**
 * Thin wrapper around localStorage that never throws (private browsing,
 * disabled storage, or a corrupted value should degrade to "no data"
 * instead of crashing the app) and centralizes JSON encode/decode.
 */

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Quota exceeded or storage disabled - fail silently, the in-memory
    // state still works for the rest of the session.
    return false;
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
