import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGenres } from '../hooks/useGenres';
import { pickDoubleFeature } from '../utils/recommendations';
import { tmdbImage } from '../services/tmdbClient';
import { formatYear } from '../utils/format';
import '../css/MovieNight.css';

/**
 * A small "Movie Night" double-feature pick, derived entirely from the
 * already-ranked personalized recommendations (see
 * utils/recommendations/movieNight.js) - no extra scoring pass or API
 * calls, so it can't slow down or complicate the core recommender.
 * Renders nothing when there's no personalized signal yet, or too few
 * recommendations to pair.
 */
function MovieNight({ recommendations, isPersonalized }) {
  const { genreMap } = useGenres();
  const getGenreName = (id) => genreMap.get(id);

  const pair = useMemo(
    () => (isPersonalized ? pickDoubleFeature(recommendations, { getGenreName }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recommendations, isPersonalized, genreMap]
  );

  if (!pair) return null;

  const { movieA, movieB, reason } = pair;

  return (
    <section className="movie-night fade-in-up">
      <h2 className="movie-night-title">🎬 Movie Night Pick</h2>
      <div className="movie-night-pair stagger">
        <MovieNightCard movie={movieA} />
        <span className="movie-night-connector">+</span>
        <MovieNightCard movie={movieB} />
      </div>
      <p className="movie-night-reason">{reason}</p>
    </section>
  );
}

function MovieNightCard({ movie }) {
  const posterUrl = tmdbImage(movie.poster_path, 'w342');
  return (
    <div className="movie-night-item scale-in">
      <Link to={`/movie/${movie.id}`} className="movie-night-poster">
        {posterUrl ? (
          <img src={posterUrl} alt={movie.title} loading="lazy" />
        ) : (
          <div className="movie-night-poster-placeholder" aria-hidden="true">
            🎬
          </div>
        )}
      </Link>
      <p className="movie-night-movie-title">
        {movie.title} <span>({formatYear(movie.release_date)})</span>
      </p>
    </div>
  );
}

export default MovieNight;
