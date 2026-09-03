import { Link } from 'react-router-dom';
import { tmdbImage } from '../services/tmdbClient';
import { formatYear } from '../utils/format';
import '../css/Skeleton.css';

/**
 * The dropdown itself - a `listbox` of movie suggestions. Purely
 * presentational: all the debounce/fetch/keyboard-index state lives in
 * SearchBar, this just renders whatever state it's handed. `style` is
 * required (SearchBar renders this through a portal into document.body
 * with `position: fixed` coordinates computed from the input's own
 * bounding box - not a plain `absolute` child - because the mobile nav
 * menu that contains one of the two SearchBar instances uses
 * `overflow-hidden` for its height-collapse animation, which would
 * otherwise clip the dropdown).
 */
function SearchSuggestions({ suggestions, status, query, highlightedIndex, onHover, onSelect, style }) {
  return (
    <div
      id="search-suggestions-listbox"
      role="listbox"
      aria-label="Movie suggestions"
      style={style}
      className="dropdown-in fixed z-[100] max-h-[70vh] overflow-y-auto rounded-lg bg-panel-raised p-1.5 shadow-panel"
    >
      {status === 'loading' && (
        <div role="status" aria-label="Searching" className="flex flex-col gap-1">
          <span className="sr-only">Searching…</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2" aria-hidden="true">
              <div className="skeleton h-14 w-10 flex-none" />
              <div className="flex-1">
                <div className="skeleton mb-1.5 h-3.5 w-3/5" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <p className="fade-in-sm px-3 py-2.5 text-sm text-bad">Couldn&apos;t load suggestions.</p>
      )}

      {status === 'success' && suggestions.length === 0 && (
        <p className="fade-in-sm px-3 py-2.5 text-sm text-ink-muted">No movies found for &quot;{query}&quot;.</p>
      )}

      <div className="stagger" role="presentation">
        {suggestions.map((movie, index) => {
          const posterUrl = tmdbImage(movie.poster_path, 'w92');
          const isHighlighted = index === highlightedIndex;
          return (
            <Link
              key={movie.id}
              id={`search-suggestion-${movie.id}`}
              role="option"
              aria-selected={isHighlighted}
              to={`/movie/${movie.id}`}
              onMouseEnter={() => onHover(index)}
              onClick={() => onSelect(movie)}
              className={`fade-in-sm group flex items-center gap-3 rounded-md p-2 text-ink transition-colors duration-150 active:scale-[0.98] ${
                isHighlighted ? 'bg-panel' : 'hover:bg-panel'
              }`}
            >
              {posterUrl ? (
                <div className="h-14 w-10 flex-none overflow-hidden rounded">
                  <img
                    src={posterUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-10 flex-none items-center justify-center rounded bg-panel text-xs" aria-hidden="true">
                  🎬
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{movie.title}</p>
                <p className="text-xs text-ink-muted">{formatYear(movie.release_date)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default SearchSuggestions;
