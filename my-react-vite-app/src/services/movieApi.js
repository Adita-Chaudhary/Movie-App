import { tmdbFetch } from './tmdbClient';

/**
 * All TMDB endpoints the app uses, in one place, so components never
 * build URLs or know about api_key/append_to_response themselves.
 */

export const getTrendingMovies = (page = 1, { signal } = {}) =>
  tmdbFetch('/trending/movie/week', { params: { page }, signal });

export const getPopularMovies = (page = 1, { signal } = {}) =>
  tmdbFetch('/movie/popular', { params: { page }, signal });

export const getTopRatedMovies = (page = 1, { signal } = {}) =>
  tmdbFetch('/movie/top_rated', { params: { page }, signal });

export const getUpcomingMovies = (page = 1, { signal } = {}) =>
  tmdbFetch('/movie/upcoming', { params: { page }, signal });

export const searchMovies = (query, { page = 1, year, signal } = {}) =>
  tmdbFetch('/search/movie', {
    params: { query, page, year, include_adult: false },
    signal,
    cache: false, // search results are cheap to refetch and rarely worth caching
  });

export const getGenres = ({ signal } = {}) =>
  tmdbFetch('/genre/movie/list', { signal, ttlMs: 24 * 60 * 60 * 1000 }); // genres barely ever change

/**
 * Filtered/sorted movie discovery, backing the Search page's filter bar
 * when there is no free-text query. TMDB's /search/movie endpoint does
 * not support with_genres or sort_by, so text search and filtered
 * browsing are two different endpoints under the hood (see Search.jsx).
 */
export const discoverMovies = ({
  page = 1,
  genre,
  year,
  sortBy = 'popularity.desc',
  minRating,
  signal,
} = {}) =>
  tmdbFetch('/discover/movie', {
    params: {
      page,
      with_genres: genre,
      primary_release_year: year,
      sort_by: sortBy,
      'vote_average.gte': minRating,
      // Screens out obscure titles with a single 10/10 vote from
      // dominating "top rated" style sorts.
      'vote_count.gte': sortBy?.startsWith('vote_average') ? 50 : undefined,
    },
    signal,
  });

/**
 * Movie detail page data in a single request: base details plus credits,
 * similar titles and keywords via TMDB's append_to_response, instead of
 * three separate round trips.
 */
export const getMovieDetails = (id, { signal } = {}) =>
  tmdbFetch(`/movie/${id}`, {
    params: { append_to_response: 'credits,similar,keywords' },
    signal,
  });
