import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMovieDetails } from '../hooks/useMovieDetails';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useHistory } from '../contexts/HistoryContext';
import { useRatings } from '../contexts/RatingsContext';
import MovieRow from '../components/MovieRow';
import StarRating from '../components/StarRating';
import RatingReviewForm from '../components/RatingReviewForm';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import { tmdbImage } from '../services/tmdbClient';
import { formatDate, formatRuntime, formatRating } from '../utils/format';
import '../css/MovieDetails.css';

/** Reduces a full TMDB detail object to the light shape used by watchlist/history/ratings snapshots. */
function toMovieSummary(details) {
  return {
    id: details.id,
    title: details.title,
    poster_path: details.poster_path,
    backdrop_path: details.backdrop_path,
    release_date: details.release_date,
    overview: details.overview,
    vote_average: details.vote_average,
    popularity: details.popularity,
    genre_ids: details.genres?.map((g) => g.id) ?? [],
  };
}

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

  if (isLoading) return <Spinner label="Loading movie details" />;
  if (isError) return <ErrorState message={error} onRetry={() => navigate(0)} />;
  if (!movie) return null;

  const director = movie.credits?.crew?.find((person) => person.job === 'Director');
  const cast = movie.credits?.cast?.slice(0, 8) ?? [];
  const similarMovies = movie.similar?.results?.slice(0, 12) ?? [];
  const keywords = movie.keywords?.keywords?.slice(0, 8) ?? [];
  const inWatchlist = isInWatchlist(movie.id);
  const existingRating = getRating(movie.id);
  const backdropUrl = tmdbImage(movie.backdrop_path, 'w1280');
  const posterUrl = tmdbImage(movie.poster_path, 'w500');

  return (
    <div className="movie-details">
      <div
        className="movie-details-backdrop"
        style={backdropUrl ? { backgroundImage: `url(${backdropUrl})` } : undefined}
      >
        <div className="movie-details-backdrop-scrim" />
      </div>

      <div className="movie-details-content">
        <div className="movie-details-poster">
          {posterUrl ? (
            <img src={posterUrl} alt={movie.title} />
          ) : (
            <div className="movie-details-poster-placeholder" aria-hidden="true">
              🎬
            </div>
          )}
        </div>

        <div className="movie-details-info">
          <h1>{movie.title}</h1>
          {movie.tagline && <p className="movie-details-tagline">&ldquo;{movie.tagline}&rdquo;</p>}

          <div className="movie-details-meta">
            <span>{formatDate(movie.release_date)}</span>
            <span>·</span>
            <span>{formatRuntime(movie.runtime)}</span>
            <span>·</span>
            <span className="movie-details-rating">★ {formatRating(movie.vote_average)}</span>
          </div>

          {movie.genres?.length > 0 && (
            <div className="movie-details-genres">
              {movie.genres.map((genre) => (
                <span key={genre.id} className="genre-chip">
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            className={`watchlist-toggle ${inWatchlist ? 'active' : ''}`}
            onClick={() => toggleWatchlist(toMovieSummary(movie))}
          >
            {inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
          </button>

          <p className="movie-details-overview">{movie.overview || 'No overview available.'}</p>

          {director && (
            <p className="movie-details-director">
              <strong>Director:</strong> {director.name}
            </p>
          )}

          {keywords.length > 0 && (
            <div className="movie-details-keywords">
              {keywords.map((keyword) => (
                <span key={keyword.id} className="keyword-chip">
                  {keyword.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {cast.length > 0 && (
        <section className="cast-section">
          <h2>Cast</h2>
          <div className="cast-scroller">
            {cast.map((person) => (
              <div key={person.cast_id ?? person.id} className="cast-card">
                {tmdbImage(person.profile_path, 'w185') ? (
                  <img src={tmdbImage(person.profile_path, 'w185')} alt={person.name} loading="lazy" />
                ) : (
                  <div className="cast-card-placeholder" aria-hidden="true">
                    👤
                  </div>
                )}
                <p className="cast-name">{person.name}</p>
                <p className="cast-character">{person.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rating-section">
        <h2>Your Rating</h2>
        {existingRating && (
          <div className="existing-rating-summary">
            <StarRating value={existingRating.rating} readOnly size="sm" />
            <span>Last updated {formatDate(existingRating.updatedAt)}</span>
          </div>
        )}
        <RatingReviewForm
          existing={existingRating}
          onSave={(payload) => rateMovie(toMovieSummary(movie), payload)}
          onDelete={() => deleteRating(movie.id)}
        />
      </section>

      {similarMovies.length > 0 && <MovieRow title="Similar Movies" movies={similarMovies} isLoading={false} isError={false} />}
    </div>
  );
}

export default MovieDetails;
