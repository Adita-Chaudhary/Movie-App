import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGenres } from '../hooks/useGenres';
import { pickDoubleFeature } from '../utils/recommendations';
import { tmdbImage } from '../services/tmdbClient';
import { formatYear } from '../utils/format';

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
    <section className="fade-in-up mb-10 rounded-xl bg-panel p-6">
      <h2 className="mb-5 text-xl font-bold">🎬 Movie Night Pick</h2>
      <div className="stagger mb-4 flex flex-wrap items-center justify-center gap-6">
        <MovieNightCard movie={movieA} />
        <span className="text-2xl font-bold text-ink-muted">+</span>
        <MovieNightCard movie={movieB} />
      </div>
      <p className="mx-auto max-w-[600px] text-center text-sm text-ink-muted">{reason}</p>
    </section>
  );
}

function MovieNightCard({ movie }) {
  const posterUrl = tmdbImage(movie.poster_path, 'w342');
  return (
    <div className="scale-in w-40 text-center">
      <Link to={`/movie/${movie.id}`} className="group block overflow-hidden rounded-lg">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            loading="lazy"
            className="block aspect-[2/3] w-full rounded-lg object-cover shadow-panel transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] group-focus-visible:scale-[1.06]"
          />
        ) : (
          <div
            className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-panel-raised text-3xl"
            aria-hidden="true"
          >
            🎬
          </div>
        )}
      </Link>
      <p className="mt-2 text-sm font-semibold">
        {movie.title} <span className="font-normal text-ink-muted">({formatYear(movie.release_date)})</span>
      </p>
    </div>
  );
}

export default MovieNight;
