import { Link } from 'react-router-dom';
import { useWatchlist } from '../contexts/WatchlistContext';
import { tmdbImage } from '../services/tmdbClient';
import { formatRating, formatYear } from '../utils/format';

/**
 * `titleBadge` is an optional small element rendered inline next to the
 * title (e.g. RecommendationRow's "why recommended" info badge) - kept
 * as a slot rather than baked into MovieCard so plain movie cards
 * elsewhere in the app are completely unaffected.
 */
function MovieCard({ movie, titleBadge }) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const inWatchlist = isInWatchlist(movie.id);
  const posterUrl = tmdbImage(movie.poster_path, 'w500');

  function onWatchlistClick(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(movie);
  }

  return (
    <Link to={`/movie/${movie.id}`} className="movie-card-link fade-in-up group block h-full text-ink">
      <div
        className="flex h-full flex-col overflow-hidden rounded-lg bg-panel shadow-panel transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:-translate-y-1.5 group-hover:scale-[1.015] group-hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] group-focus-within:-translate-y-1.5 group-focus-within:scale-[1.015] group-focus-within:shadow-[0_16px_28px_rgba(0,0,0,0.35)]"
      >
        <div className="relative aspect-[2/3] w-full bg-panel-raised">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={movie.title}
              loading="lazy"
              decoding="async"
              className="block h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08] group-focus-within:scale-[1.08]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-ink-muted" aria-hidden="true">
              🎬
            </div>
          )}

          {typeof movie.vote_average === 'number' && movie.vote_average > 0 && (
            <span className="absolute left-2 top-2 rounded bg-black/75 px-2 py-0.5 text-xs font-semibold text-gold transition-transform duration-200 group-hover:scale-110 group-focus-within:scale-110">
              ★ {formatRating(movie.vote_average)}
            </span>
          )}

          {/* Decorative reveal-on-hover scrim - purely visual, so it's fine
              for it to stay hover-gated even on touch devices. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-black/75 opacity-0 transition-opacity duration-250 group-hover:opacity-100 group-focus-within:opacity-100" />

          {/* Watchlist toggle is real functionality, not decoration, so it
              stays visible by default on touch/small screens (no hover to
              rely on) and only becomes hover-reveal from `sm` up, where a
              pointer is the norm. */}
          <button
            type="button"
            onClick={onWatchlistClick}
            aria-pressed={inWatchlist}
            aria-label={inWatchlist ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}
            title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-xl font-bold text-white opacity-100 transition-[transform,opacity,background-color] duration-200 hover:bg-black/85 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-hover:hover:scale-110 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 ${
              inWatchlist ? 'animate-[pop_0.35s_cubic-bezier(0.34,1.56,0.64,1)] bg-black/85 text-good' : ''
            }`}
          >
            {inWatchlist ? '✓' : '+'}
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="line-clamp-2 flex-1 text-sm font-normal sm:text-base">{movie.title}</h3>
            {titleBadge}
          </div>
          <p className="text-sm text-ink-muted">{formatYear(movie.release_date)}</p>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;
