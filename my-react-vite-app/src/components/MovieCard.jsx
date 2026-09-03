import { Link } from 'react-router-dom';
import { useWatchlist } from '../contexts/WatchlistContext';
import { tmdbImage } from '../services/tmdbClient';
import { formatRating, formatYear } from '../utils/format';
import '../css/MovieCard.css';

function MovieCard({ movie }) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const inWatchlist = isInWatchlist(movie.id);
  const posterUrl = tmdbImage(movie.poster_path, 'w500');

  function onWatchlistClick(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(movie);
  }

  return (
    <Link to={`/movie/${movie.id}`} className="movie-card-link fade-in-up">
      <div className="movie-card">
        <div className="movie-poster">
          {posterUrl ? (
            <img src={posterUrl} alt={movie.title} loading="lazy" decoding="async" />
          ) : (
            <div className="movie-poster-placeholder" aria-hidden="true">
              🎬
            </div>
          )}
          {typeof movie.vote_average === 'number' && movie.vote_average > 0 && (
            <span className="rating-badge">★ {formatRating(movie.vote_average)}</span>
          )}
          <div className="movie-overlay">
            <button
              type="button"
              className={`watchlist-btn ${inWatchlist ? 'active' : ''}`}
              onClick={onWatchlistClick}
              aria-pressed={inWatchlist}
              aria-label={inWatchlist ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}
              title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              {inWatchlist ? '✓' : '+'}
            </button>
          </div>
        </div>
        <div className="movie-info">
          <h3>{movie.title}</h3>
          <p>{formatYear(movie.release_date)}</p>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;
