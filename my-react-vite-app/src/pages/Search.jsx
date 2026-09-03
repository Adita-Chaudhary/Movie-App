import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieGrid from '../components/MovieGrid';
import FilterBar from '../components/FilterBar';
import EmptyState from '../components/EmptyState';
import { useDebounce } from '../hooks/useDebounce';
import { useGenres } from '../hooks/useGenres';
import { searchMovies, discoverMovies } from '../services/movieApi';
import PageContainer from '../components/PageContainer';

const DEFAULT_FILTERS = { genre: undefined, year: undefined, minRating: undefined, sortBy: 'popularity.desc' };

/**
 * Applies genre/rating/sort filters client-side to a page of free-text
 * search results. TMDB's /search/movie endpoint doesn't accept
 * with_genres or sort_by, so when there's an active text query we filter
 * and sort what came back instead of losing those controls entirely.
 * /discover/movie (used when there's no text query) supports all of
 * this server-side, across the full catalog.
 */
function applyClientFilters(movies, filters) {
  let result = movies;
  if (filters.genre) {
    const genreId = Number(filters.genre);
    result = result.filter((movie) => movie.genre_ids?.includes(genreId));
  }
  if (filters.minRating) {
    result = result.filter((movie) => (movie.vote_average ?? 0) >= Number(filters.minRating));
  }
  const [field, direction] = (filters.sortBy ?? 'popularity.desc').split('.');
  const sortField = field === 'primary_release_date' ? 'release_date' : field;
  result = [...result].sort((a, b) => {
    const aVal = a[sortField] ?? '';
    const bVal = b[sortField] ?? '';
    if (aVal === bVal) return 0;
    const comparison = aVal > bVal ? 1 : -1;
    return direction === 'desc' ? -comparison : comparison;
  });
  return result;
}

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [queryInput, setQueryInput] = useState(initialQuery);
  const debouncedQuery = useDebounce(queryInput, 400);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const { genres } = useGenres();
  const trimmedQuery = debouncedQuery.trim();

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (trimmedQuery) next.set('q', trimmedQuery);
    else next.delete('q');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedQuery]);

  const fetchPage = useCallback(
    async (pageToLoad, { signal } = {}) => {
      if (trimmedQuery) {
        const data = await searchMovies(trimmedQuery, { page: pageToLoad, year: filters.year, signal });
        return { results: applyClientFilters(data.results ?? [], filters), totalPages: data.total_pages ?? 0 };
      }
      const data = await discoverMovies({ ...filters, page: pageToLoad, signal });
      return { results: data.results ?? [], totalPages: data.total_pages ?? 0 };
    },
    [trimmedQuery, filters]
  );

  const [retryToken, setRetryToken] = useState(0);

  // Reset and load page 1 whenever the query, filters, or a manual retry change.
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError(null);
    setPage(1);

    fetchPage(1, { signal: controller.signal })
      .then(({ results, totalPages: total }) => {
        setMovies(results);
        setTotalPages(total);
        setStatus('success');
      })
      .catch((err) => {
        if (err.isAborted) return;
        setError(err.message ?? 'Search failed.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [fetchPage, retryToken]);

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    fetchPage(nextPage)
      .then(({ results }) => {
        setMovies((prev) => [...prev, ...results]);
        setPage(nextPage);
      })
      .catch((err) => {
        if (!err.isAborted) setError(err.message ?? 'Failed to load more movies.');
      })
      .finally(() => setIsLoadingMore(false));
  }, [fetchPage, isLoadingMore, page, totalPages]);

  return (
    <PageContainer>
      <div className="mx-auto mb-6 max-w-[900px]">
        <input
          type="search"
          className="w-full rounded-lg px-4 py-3.5 text-base sm:text-[1.05rem]"
          placeholder="Search for movies..."
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          aria-label="Search for movies"
          autoFocus
        />
      </div>

      <FilterBar genres={genres} filters={filters} onChange={setFilters} disableSort={Boolean(trimmedQuery)} />

      <MovieGrid
        movies={movies}
        isLoading={status === 'loading'}
        isError={status === 'error'}
        errorMessage={error}
        onRetry={() => setRetryToken((t) => t + 1)}
        hasMore={page < totalPages && page < 500}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
        emptyState={
          <EmptyState
            title={trimmedQuery ? `No results for "${trimmedQuery}"` : 'No movies match these filters'}
            message="Try a different search term or adjust the filters above."
          />
        }
      />
    </PageContainer>
  );
}

export default Search;
