import { useMemo } from 'react';
import MovieRow from '../components/MovieRow';
import RecommendationRow from '../components/RecommendationRow';
import MovieNight from '../components/MovieNight';
import { useMovieList } from '../hooks/useMovieList';
import { useRecommendations } from '../hooks/useRecommendations';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useHistory } from '../contexts/HistoryContext';
import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
} from '../services/movieApi';
import '../css/Home.css';

function Home() {
  const trending = useMovieList(getTrendingMovies, []);
  const popular = useMovieList(getPopularMovies, []);
  const topRated = useMovieList(getTopRatedMovies, []);
  const upcoming = useMovieList(getUpcomingMovies, []);

  const { watchlist } = useWatchlist();
  const { history } = useHistory();

  // Recommendations' cheap first pass is scored against movies we've
  // already fetched for the other rows - no extra network requests for
  // that stage (see useRecommendations.js for the bounded second-pass
  // enrichment that follows it).
  const candidatePool = useMemo(() => {
    const combined = [...trending.movies, ...popular.movies, ...topRated.movies, ...upcoming.movies];
    const seen = new Set();
    return combined.filter((movie) => {
      if (seen.has(movie.id)) return false;
      seen.add(movie.id);
      return true;
    });
  }, [trending.movies, popular.movies, topRated.movies, upcoming.movies]);

  const { recommendations, isPersonalized, isLoading: isRecommendationsLoading } = useRecommendations(candidatePool);

  return (
    <div className="home">
      <div className="home-hero">
        <h1>Discover your next favorite movie</h1>
        <p>Trending picks, personal ratings, and recommendations based on what you actually watch.</p>
      </div>

      <RecommendationRow
        recommendations={recommendations}
        isLoading={isRecommendationsLoading}
        isPersonalized={isPersonalized}
      />

      <MovieNight recommendations={recommendations} isPersonalized={isPersonalized} />

      {watchlist.length > 0 && (
        <MovieRow title="From Your Watchlist" movies={watchlist.slice(0, 12)} isLoading={false} isError={false} />
      )}

      <MovieRow
        title="Trending This Week"
        movies={trending.movies}
        isLoading={trending.isLoading}
        isError={trending.isError}
        errorMessage={trending.error}
      />

      <MovieRow
        title="Popular"
        movies={popular.movies}
        isLoading={popular.isLoading}
        isError={popular.isError}
        errorMessage={popular.error}
      />

      <MovieRow
        title="Top Rated"
        movies={topRated.movies}
        isLoading={topRated.isLoading}
        isError={topRated.isError}
        errorMessage={topRated.error}
      />

      <MovieRow
        title="Upcoming"
        movies={upcoming.movies}
        isLoading={upcoming.isLoading}
        isError={upcoming.isError}
        errorMessage={upcoming.error}
      />

      {history.length > 0 && (
        <MovieRow title="Recently Viewed" movies={history.slice(0, 12)} isLoading={false} isError={false} />
      )}
    </div>
  );
}

export default Home;
