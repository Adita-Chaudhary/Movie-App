import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether the returned ref's element is visible in the viewport.
 * Used to trigger "load more" for infinite scroll without a scroll-event
 * listener (cheaper, and naturally debounced by the browser).
 */
export function useIntersectionObserver({ rootMargin = '400px', enabled = true } = {}) {
  const targetRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const node = targetRef.current;
    if (!node || !enabled) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, enabled]);

  return [targetRef, isIntersecting];
}
