import { useEffect } from 'react';
import MovieCard from './MovieCard';
import { SkeletonRow } from './SkeletonCard';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import '../css/MovieGrid.css';

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
      <div className="movies-grid stagger">
        {movies.map((movie) => (
          <MovieCard movie={movie} key={movie.id} />
        ))}
      </div>
      {hasMore && (
        <div
          ref={sentinelRef}
          className="grid-sentinel"
          onClick={!('IntersectionObserver' in window) ? onLoadMore : undefined}
        >
          {isLoadingMore && <SkeletonRow count={6} />}
        </div>
      )}
    </>
  );
}

export default MovieGrid;
