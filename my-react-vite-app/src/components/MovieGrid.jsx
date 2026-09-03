import { useEffect } from 'react';
import MovieCard from './MovieCard';
import { SkeletonRow } from './SkeletonCard';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

/**
 * auto-fill (not auto-fit) is deliberate: auto-fit collapses empty
 * tracks and stretches the remaining ones to fill the row, so a grid
 * with a single card would blow that card up to the full container
 * width (a real bug we hit in Watchlist). auto-fill keeps as many
 * tracks reserved as fit the container regardless of item count, so
 * cards stay a consistent, compact size whether there are 0, 1, 2, or
 * many. The minimum card width is smaller on narrow phones (130px, still
 * comfortably readable) so small screens get 2 columns instead of being
 * forced into one oversized column - it widens back to the desktop
 * 160px minimum from `sm` up.
 */
// "movies-grid" itself carries no CSS (all styling is the Tailwind
// utilities alongside it) - it's kept as a stable, unstyled hook that
// tests query by, so implementation details can keep changing without
// rewriting every test's selector.
export const MOVIE_GRID_CLASS =
  'movies-grid stagger grid w-full grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-4 p-1 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:gap-6';

/**
 * Responsive movie grid with built-in loading/error/empty states and
 * optional infinite scroll (pass `hasMore` + `onLoadMore`).
 */
function MovieGrid({
  movies,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  emptyState,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}) {
  const [sentinelRef, isSentinelVisible] = useIntersectionObserver({
    enabled: hasMore && !isLoading && !isError,
  });

  useEffect(() => {
    if (isSentinelVisible && hasMore && !isLoadingMore) {
      onLoadMore?.();
    }
  }, [isSentinelVisible, hasMore, isLoadingMore, onLoadMore]);

  if (isError) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  if (isLoading && movies.length === 0) {
    return <SkeletonRow count={12} />;
  }

  if (!isLoading && movies.length === 0) {
    return emptyState ?? <EmptyState title="No movies found" message="Try a different search or filter." />;
  }

  return (
    <>
      <div className={MOVIE_GRID_CLASS}>
        {movies.map((movie) => (
          <MovieCard movie={movie} key={movie.id} />
        ))}
      </div>
      {hasMore && (
        <div
          ref={sentinelRef}
          className="h-px w-full"
          onClick={!('IntersectionObserver' in window) ? onLoadMore : undefined}
        >
          {isLoadingMore && <SkeletonRow count={6} />}
        </div>
      )}
    </>
  );
}

export default MovieGrid;
