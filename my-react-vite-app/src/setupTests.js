import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement IntersectionObserver. Components that use it
// (infinite-scroll sentinels, the Reveal scroll-in-view animation) only
// need the constructor to exist and not throw in tests - none of them
// assert on an actual intersection firing, so a no-op mock is enough.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class IntersectionObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.IntersectionObserver = IntersectionObserverMock;
}
