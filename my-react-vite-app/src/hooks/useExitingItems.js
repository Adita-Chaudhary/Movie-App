import { useEffect, useRef, useState } from 'react';

/**
 * Keeps a removed item visible for `duration` ms longer than `items`
 * itself would, tagged with `isExiting: true`, so a grid can play a
 * fade-out/shrink animation (see the `.exiting` class in Motion.css)
 * instead of the item just vanishing and leaving an abrupt gap. The
 * underlying context/state (e.g. WatchlistContext) is untouched - this
 * only affects how long the item's *presentational* row keeps rendering
 * it after it's gone from `items`.
 */
export function useExitingItems(items, getId, duration = 220) {
  const [exitingItems, setExitingItems] = useState([]);
  const prevItemsRef = useRef(items);
  const timeoutsRef = useRef(new Map());

  useEffect(() => {
    const prevItems = prevItemsRef.current;
    const currentIds = new Set(items.map(getId));
    const removed = prevItems.filter((item) => !currentIds.has(getId(item)));

    if (removed.length > 0) {
      setExitingItems((current) => [...current, ...removed]);
      removed.forEach((item) => {
        const id = getId(item);
        const timeoutId = setTimeout(() => {
          setExitingItems((current) => current.filter((exiting) => getId(exiting) !== id));
          timeoutsRef.current.delete(id);
        }, duration);
        timeoutsRef.current.set(id, timeoutId);
      });
    }

    prevItemsRef.current = items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  }, []);

  const currentIds = new Set(items.map(getId));
  return [
    ...items.map((item) => ({ item, isExiting: false })),
    ...exitingItems.filter((item) => !currentIds.has(getId(item))).map((item) => ({ item, isExiting: true })),
  ];
}
