import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMovieDetails } from '../hooks/useMovieDetails';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useHistory } from '../contexts/HistoryContext';
import { useRatings } from '../contexts/RatingsContext';
import MovieRow from '../components/MovieRow';
import StarRating from '../components/StarRating';
import RatingReviewForm from '../components/RatingReviewForm';
import WhereToWatch from '../components/WhereToWatch';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import Reveal from '../components/Reveal';
import { tmdbImage } from '../services/tmdbClient';
import { toMovieSummary } from '../utils/movieSummary';
import { rankSimilarMovies } from '../utils/recommendations';
import { formatDate, formatRuntime, formatRating } from '../utils/format';

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { movie, isLoading, isError, error } = useMovieDetails(id);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { addToHistory } = useHistory();
  const { getRating, rateMovie, deleteRating } = useRatings();

  useEffect(() => {
    if (movie) addToHistory(toMovieSummary(movie));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie?.id]);

  // Combine + re-rank TMDB's `similar` and `recommendations` lists using
  // MovieNest's own content-similarity scoring, instead of showing
  // either raw list (see utils/recommendations/similarMovies.js).
  const similarMovies = useMemo(() => {
    if (!movie) return [];
    return rankSimilarMovies(movie, movie.similar?.results, movie.recommendations?.results, { limit: 12 }).map(
      (result) => result.movie
    );
  }, [movie]);

  if (isLoading) return <Spinner label="Loading movie details" />;
  if (isError) return <ErrorState message={error} onRetry={() => navigate(0)} />;
  if (!movie) return null;

  const director = movie.credits?.crew?.find((person) => person.job === 'Director');
  const cast = movie.credits?.cast?.slice(0, 8) ?? [];
  const keywords = movie.keywords?.keywords?.slice(0, 8) ?? [];
  const inWatchlist = isInWatchlist(movie.id);
  const existingRating = getRating(movie.id);
  const backdropUrl = tmdbImage(movie.backdrop_path, 'w1280');
  const posterUrl = tmdbImage(movie.poster_path, 'w500');

  return (
    <div className="relative pb-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-[260px] overflow-hidden [animation:fadeIn_0.6s_ease_both] sm:h-[420px]">
        {backdropUrl && (
          <div
            className="backdrop-ken-burns h-full w-full bg-cover bg-top"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-canvas" />
      </div>

      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 pb-4 pt-8 sm:gap-8 md:flex-row md:px-8 md:pt-12">
        <div className="flex-none [animation:scaleIn_0.5s_cubic-bezier(0.22,1,0.36,1)_both] md:w-[260px]">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={movie.title}
              className="block w-40 rounded-[10px] shadow-panel transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] sm:w-56 md:w-full"
            />
          ) : (
            <div
              className="flex aspect-[2/3] w-40 items-center justify-center rounded-[10px] bg-panel-raised text-5xl sm:w-56 md:w-full"
              aria-hidden="true"
            >
              🎬
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 [animation:fadeInUp_0.5s_cubic-bezier(0.22,1,0.36,1)_0.1s_both]">
          <h1 className="mb-2 text-[clamp(1.6rem,4vw,2.4rem)] font-bold">{movie.title}</h1>
          {movie.tagline && <p className="mb-3 italic text-ink-muted">&ldquo;{movie.tagline}&rdquo;</p>}

          <div className="mb-4 flex flex-wrap gap-2 text-ink-muted">
            <span>{formatDate(movie.release_date)}</span>
            <span>·</span>
            <span>{formatRuntime(movie.runtime)}</span>
            <span>·</span>
            <span className="font-semibold text-gold">★ {formatRating(movie.vote_average)}</span>
          </div>

          {movie.genres?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full bg-panel-raised px-3 py-1 text-sm transition-transform duration-150 hover:-translate-y-px"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => toggleWatchlist(toMovieSummary(movie))}
            className={`mb-5 font-semibold transition-[background-color,border-color] duration-200 ${
              inWatchlist
                ? 'animate-[pop_0.35s_cubic-bezier(0.34,1.56,0.64,1)] border-good bg-good text-white'
                : 'border-brand bg-brand text-white hover:bg-brand-hover'
            }`}
          >
            {inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
          </button>

          <p className="mb-4 leading-relaxed">{movie.overview || 'No overview available.'}</p>

          {director && (
            <p className="mb-4">
              <strong>Director:</strong>{' '}
              <Link
                to={`/person/${director.id}`}
                className="font-semibold text-brand transition-colors duration-150 hover:text-brand-hover"
              >
                {director.name}
              </Link>
            </p>
          )}

          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((keyword) => (
                <span key={keyword.id} className="rounded-full bg-panel px-2.5 py-1 text-xs text-ink-muted">
                  {keyword.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <WhereToWatch movieId={movie.id} />

      {cast.length > 0 && (
        <Reveal as="section" className="mx-auto mb-8 max-w-[1200px] px-5 md:px-8">
          <h2 className="mb-4 text-xl font-bold">Cast</h2>
          <div className="stagger flex gap-4 overflow-x-auto pb-2 [scroll-behavior:smooth]">
            {cast.map((person) => (
              <Link
                key={person.cast_id ?? person.id}
                to={`/person/${person.id}`}
                className="fade-in group block w-[110px] flex-none overflow-hidden rounded-lg text-center text-inherit transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 focus-visible:-translate-y-1"
              >
                {tmdbImage(person.profile_path, 'w185') ? (
                  <img
                    src={tmdbImage(person.profile_path, 'w185')}
                    alt={person.name}
                    loading="lazy"
                    className="mb-1.5 aspect-[2/3] w-full rounded-lg object-cover transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] group-focus-visible:scale-[1.06]"
                  />
                ) : (
                  <div
                    className="mb-1.5 flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-panel-raised text-2xl"
                    aria-hidden="true"
                  >
                    👤
                  </div>
                )}
                <p className="text-sm font-semibold">{person.name}</p>
                <p className="text-xs text-ink-muted">{person.character}</p>
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      <Reveal as="section" className="mx-auto mb-8 max-w-[1200px] px-5 md:px-8">
        <h2 className="mb-4 text-xl font-bold">Your Rating</h2>
        {existingRating && (
          <div className="mb-3 flex items-center gap-3 text-sm text-ink-muted">
            <StarRating value={existingRating.rating} readOnly size="sm" />
            <span>Last updated {formatDate(existingRating.updatedAt)}</span>
          </div>
        )}
        <RatingReviewForm
          existing={existingRating}
          onSave={(payload) => rateMovie(toMovieSummary(movie), payload)}
          onDelete={() => deleteRating(movie.id)}
        />
      </Reveal>

      {similarMovies.length > 0 && (
        <Reveal className="mx-auto max-w-[1200px] px-5 md:px-8">
          <MovieRow
            title="Similar Movies"
            subtitle="Based on this movie's genres, themes and TMDB's own similarity data"
            movies={similarMovies}
            isLoading={false}
            isError={false}
          />
        </Reveal>
      )}
    </div>
  );
}

export default MovieDetails;
