import { dedupe, getCached, setCached } from './cache';

const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes - movie lists don't change second to second

export class ApiError extends Error {
  constructor(message, { status, isAborted = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isAborted = isAborted;
  }
}

function buildUrl(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', API_KEY ?? '');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

/**
 * Fetch a TMDB endpoint with caching, in-flight de-duplication, and
 * consistent error handling. `cache: false` skips both the read and the
 * write (used for requests whose result must always be fresh).
 */
export async function tmdbFetch(path, { params = {}, signal, ttlMs = DEFAULT_TTL_MS, cache = true } = {}) {
  if (!API_KEY) {
    throw new ApiError(
      'Missing TMDB API key. Copy .env.example to .env and set VITE_TMDB_API_KEY.'
    );
  }

  const url = buildUrl(path, params);

  if (cache) {
    const cached = getCached(url);
    if (cached !== undefined) return cached;
  }

  const run = async () => {
    let response;
    try {
      // A de-duplicated (cache: true) request's underlying fetch is
      // potentially shared by multiple independent callers - e.g. React
      // StrictMode's dev-mode double-invoke (mount -> cleanup -> mount),
      // where the first invocation's cleanup aborts its own controller
      // while the second, persisting invocation is still awaiting the
      // very same in-flight promise (see cache.js's `dedupe`). Passing
      // that first caller's AbortSignal into the shared fetch would let
      // its abort reject the response for every subscriber, even ones
      // that never asked to cancel anything - so only a non-deduped
      // request may be tied to its caller's own signal.
      response = await fetch(url, cache ? {} : { signal });
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new ApiError('Request aborted', { isAborted: true });
      }
      throw new ApiError('Network error - check your connection and try again.');
    }

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        const body = await response.json();
        if (body?.status_message) message = body.status_message;
      } catch {
        // response wasn't JSON, keep the generic message
      }
      throw new ApiError(message, { status: response.status });
    }

    const data = await response.json();
    if (cache) setCached(url, data, ttlMs);
    return data;
  };

  return cache ? dedupe(url, run) : run();
}

export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/** Builds a responsive TMDB image URL, or null when the movie has no image. */
export function tmdbImage(path, size = 'w500') {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
}
