import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether the returned ref's element is visible in the viewport.
 * Used to trigger "load more" for infinite scroll without a scroll-event
 * listener (cheaper, and naturally debounced by the browser).
 *
 * `triggerOnce` latches `isIntersecting` at `true` forever after the
 * first time the element becomes visible, then disconnects the observer -
 * used for scroll-reveal animations (see components/Reveal.jsx), which
 * should only ever play once per element, not replay on every scroll
 * in/out of view.
 */
export function useIntersectionObserver({ rootMargin = '400px', threshold = 0, enabled = true, triggerOnce = false } = {}) {
  const targetRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const node = targetRef.current;
    if (!node || !enabled) return undefined;
    if (triggerOnce && isIntersecting) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (triggerOnce) observer.disconnect();
        } else if (!triggerOnce) {
          setIsIntersecting(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold, enabled, triggerOnce, isIntersecting]);

  return [targetRef, isIntersecting];
}
