import MovieCard from './MovieCard';
import { SkeletonRow } from './SkeletonCard';
import ErrorState from './ErrorState';
import '../css/MovieRow.css';

/** A titled, horizontally-scrolling section of movies, used on the homepage. */
function MovieRow({ title, subtitle, movies, isLoading, isError, errorMessage, emptyMessage }) {
  if (isLoading) {
    return (
      <section className="movie-row">
        <h2 className="movie-row-title">{title}</h2>
        <SkeletonRow count={6} />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="movie-row">
        <h2 className="movie-row-title">{title}</h2>
        <ErrorState message={errorMessage} />
      </section>
    );
  }

  if (movies.length === 0) {
    if (!emptyMessage) return null;
    return (
      <section className="movie-row">
        <h2 className="movie-row-title">{title}</h2>
        <p className="movie-row-empty">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="movie-row">
      <div className="movie-row-header">
        <h2 className="movie-row-title">{title}</h2>
        {subtitle && <p className="movie-row-subtitle">{subtitle}</p>}
      </div>
      <div className="movie-row-scroller">
        {movies.map((movie) => (
          <div className="movie-row-item" key={movie.id}>
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default MovieRow;
