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
 * similar titles, TMDB's own recommendations, and keywords via TMDB's
 * append_to_response, instead of four separate round trips. `similar`
 * and `recommendations` are two distinct TMDB algorithms (see
 * utils/recommendations/similarMovies.js for how MovieNest combines and
 * re-ranks them) - both come along for free on this one request.
 */
export const getMovieDetails = (id, { signal } = {}) =>
  tmdbFetch(`/movie/${id}`, {
    params: { append_to_response: 'credits,similar,recommendations,keywords' },
    signal,
  });

/**
 * Person (actor/director/crew) details in a single request: bio, photo,
 * and their full movie filmography (cast + crew credits) via
 * append_to_response, instead of two round trips. Used by the /person/:id
 * page reached from Movie Details' cast cards and director credit.
 */
export const getPersonDetails = (id, { signal } = {}) =>
  tmdbFetch(`/person/${id}`, {
    params: { append_to_response: 'movie_credits' },
    signal,
  });

/**
 * "Where to watch" data for a movie (stream/free/ads/rent/buy providers,
 * sourced from JustWatch via TMDB). TMDB returns EVERY region's data in
 * one response keyed by ISO country code (`results.US`, `results.GB`,
 * ...) - so switching the region selector in WhereToWatch.jsx never
 * issues another request, it just reads a different key from the same
 * cached response. A 6-hour TTL is used since availability shifts day to
 * day but not minute to minute.
 */
export const getWatchProviders = (movieId, { signal } = {}) =>
  tmdbFetch(`/movie/${movieId}/watch/providers`, { signal, ttlMs: 6 * 60 * 60 * 1000 });

/**
 * The list of regions TMDB has watch-provider data for - used to
 * populate the region selector instead of a hardcoded country list.
 * Barely ever changes, so it's cached for a full day and, being cached
 * by URL like everything else in tmdbClient, is only ever fetched once
 * across the whole app regardless of how many movies the user views.
 */
export const getAvailableRegions = ({ signal } = {}) =>
  tmdbFetch('/watch/providers/regions', { signal, ttlMs: 24 * 60 * 60 * 1000 });
