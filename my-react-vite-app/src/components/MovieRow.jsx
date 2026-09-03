import MovieCard from './MovieCard';
import { SkeletonRow } from './SkeletonCard';
import ErrorState from './ErrorState';

// Shared by RecommendationRow too, so both horizontally-scrolling row
// styles (personalized or not) stay in lockstep instead of drifting.
export const ROW_SCROLLER_CLASS =
  'stagger flex gap-3 overflow-x-auto pb-3 [scroll-snap-type:x_proximity] scroll-smooth [scrollbar-width:thin] sm:gap-4';
export const ROW_ITEM_CLASS = 'w-[130px] flex-none [scroll-snap-align:start] sm:w-[170px]';

/** A titled, horizontally-scrolling section of movies, used on the homepage. */
function MovieRow({ title, subtitle, movies, isLoading, isError, errorMessage, emptyMessage }) {
  if (isLoading) {
    return (
      <section className="mb-10">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        <SkeletonRow count={6} />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mb-10">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        <ErrorState message={errorMessage} />
      </section>
    );
  }

  if (movies.length === 0) {
    if (!emptyMessage) return null;
    return (
      <section className="mb-10">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        <p className="text-ink-muted">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
      </div>
      <div className={ROW_SCROLLER_CLASS}>
        {movies.map((movie) => (
          <div className={ROW_ITEM_CLASS} key={movie.id}>
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default MovieRow;
