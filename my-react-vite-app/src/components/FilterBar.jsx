import '../css/FilterBar.css';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i);

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'primary_release_date.desc', label: 'Newest First' },
  { value: 'primary_release_date.asc', label: 'Oldest First' },
];

const MIN_RATINGS = [0, 5, 6, 7, 8, 9];

/**
 * Genre / year / rating / sort controls. When a free-text search is
 * active, sort and rating are applied client-side to that page of
 * results (TMDB's search endpoint doesn't support with_genres/sort_by) -
 * see Search.jsx for how the two modes are reconciled.
 */
function FilterBar({ genres, filters, onChange, disableSort = false }) {
  const update = (key, value) => onChange({ ...filters, [key]: value || undefined });

  return (
    <div className="filter-bar">
      <label className="filter-field">
        <span>Genre</span>
        <select value={filters.genre ?? ''} onChange={(e) => update('genre', e.target.value)}>
          <option value="">All</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-field">
        <span>Year</span>
        <select value={filters.year ?? ''} onChange={(e) => update('year', e.target.value)}>
          <option value="">All</option>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-field">
        <span>Min Rating</span>
        <select
          value={filters.minRating ?? ''}
          onChange={(e) => update('minRating', e.target.value)}
        >
          <option value="">Any</option>
          {MIN_RATINGS.filter((r) => r > 0).map((rating) => (
            <option key={rating} value={rating}>
              {rating}+
            </option>
          ))}
        </select>
      </label>

      <label className="filter-field">
        <span>Sort By {disableSort && <em className="filter-hint">(applies to this page)</em>}</span>
        <select value={filters.sortBy ?? 'popularity.desc'} onChange={(e) => update('sortBy', e.target.value)}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default FilterBar;
