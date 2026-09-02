import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression test for a bug where the homepage got permanently stuck on
 * skeleton loaders in the browser (but not in isolated calls to the
 * service functions, and not in tests that mock the fetcher).
 *
 * Root cause: cache.js's in-flight de-duplication shares one network
 * request's promise across every caller asking for the same URL at the
 * same time. React StrictMode's dev-mode double-invoke (mount -> cleanup
 * -> mount) triggers exactly that: the first effect run starts the
 * request and is then immediately cleaned up (aborting its own
 * AbortController), while the second, persisting effect run receives the
 * *same* de-duplicated promise via `dedupe()`. If that shared fetch was
 * tied to the first caller's signal, its abort rejected the promise for
 * both subscribers, and useMovieList's `if (err.isAborted) return;`
 * swallowed that rejection without ever updating `status` away from
 * 'loading' - so the UI never left the skeleton state.
 *
 * The fix: a de-duplicated (cache: true) request's underlying fetch must
 * not be tied to any single caller's AbortSignal, since it may be shared.
 * This test simulates the exact race and asserts every concurrent caller
 * still resolves with real data even after one of them aborts.
 */

describe('tmdbClient de-duplication is not poisoned by one caller aborting', () => {
  let tmdbFetch;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_TMDB_API_KEY', 'test-key');
    ({ tmdbFetch } = await import('./tmdbClient'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('resolves every subscriber of a shared in-flight request even if one aborts (StrictMode double-invoke)', async () => {
    // A faithful fetch mock: it stays pending until resolved, but rejects
    // early (like the real Fetch API) if the AbortSignal it was given
    // fires. Only the *first* caller's `run()` closure ever actually
    // invokes fetch (dedupe.js skips calling it again for later
    // subscribers of the same in-flight URL), so whichever signal that
    // first caller closed over is the one this mock will see.
    let resolveFetch;
    globalThis.fetch = vi.fn(
      (_url, init) =>
        new Promise((resolve, reject) => {
          resolveFetch = () =>
            resolve({ ok: true, json: async () => ({ page: 1, results: [{ id: 1, title: 'Real Movie' }] }) });

          const rejectAsAborted = () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          };

          if (init?.signal) {
            if (init.signal.aborted) rejectAsAborted();
            else init.signal.addEventListener('abort', rejectAsAborted);
          }
        })
    );

    const controllerA = new AbortController(); // simulates the first, discarded StrictMode invocation
    const controllerB = new AbortController(); // simulates the second, persisting invocation

    const callA = tmdbFetch('/movie/popular', { params: { page: 1 }, signal: controllerA.signal });
    const callB = tmdbFetch('/movie/popular', { params: { page: 1 }, signal: controllerB.signal });

    // The first effect's cleanup fires before the second effect's request
    // would ever be distinguishable from it - both share one URL/promise.
    controllerA.abort();
    // No-op if the mock already rejected from the abort above; this is
    // what lets the *fixed* code path resolve both callers successfully.
    resolveFetch();

    const [resultA, resultB] = await Promise.allSettled([callA, callB]);

    expect(resultA.status).toBe('fulfilled');
    expect(resultB.status).toBe('fulfilled');
    expect(resultB.value.results[0].title).toBe('Real Movie');
    // The shared network request itself must only fire once (dedupe intact).
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('still allows a non-deduplicated (cache: false) request to be aborted by its own caller', async () => {
    globalThis.fetch = vi.fn(() => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    const controller = new AbortController();
    controller.abort();

    await expect(
      tmdbFetch('/search/movie', { params: { query: 'test' }, signal: controller.signal, cache: false })
    ).rejects.toMatchObject({ isAborted: true });
  });
});
