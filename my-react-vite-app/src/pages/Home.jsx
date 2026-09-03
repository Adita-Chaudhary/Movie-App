import { useMemo } from 'react';
import MovieRow from '../components/MovieRow';
import RecommendationRow from '../components/RecommendationRow';
import MovieNight from '../components/MovieNight';
import PageContainer from '../components/PageContainer';
import Reveal from '../components/Reveal';
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
    <PageContainer>
      <div className="hero-ambient relative mb-10 overflow-hidden rounded-2xl px-5 py-10 sm:px-10 sm:py-14">
        <div className="stagger relative">
          <h1 className="fade-in-up mb-3 text-[clamp(1.8rem,4.5vw,2.8rem)] font-bold">
            Discover your next favorite movie
          </h1>
          <p className="fade-in-up max-w-xl text-ink-muted">
            Trending picks, personal ratings, and recommendations based on what you actually watch.
          </p>
        </div>
      </div>

      <Reveal>
        <RecommendationRow
          recommendations={recommendations}
          isLoading={isRecommendationsLoading}
          isPersonalized={isPersonalized}
        />
      </Reveal>

      <Reveal>
        <MovieNight recommendations={recommendations} isPersonalized={isPersonalized} />
      </Reveal>

      {watchlist.length > 0 && (
        <Reveal>
          <MovieRow title="From Your Watchlist" movies={watchlist.slice(0, 12)} isLoading={false} isError={false} />
        </Reveal>
      )}

      <Reveal>
        <MovieRow
          title="Trending This Week"
          movies={trending.movies}
          isLoading={trending.isLoading}
          isError={trending.isError}
          errorMessage={trending.error}
        />
      </Reveal>

      <Reveal>
        <MovieRow
          title="Popular"
          movies={popular.movies}
          isLoading={popular.isLoading}
          isError={popular.isError}
          errorMessage={popular.error}
        />
      </Reveal>

      <Reveal>
        <MovieRow
          title="Top Rated"
          movies={topRated.movies}
          isLoading={topRated.isLoading}
          isError={topRated.isError}
          errorMessage={topRated.error}
        />
      </Reveal>

      <Reveal>
        <MovieRow
          title="Upcoming"
          movies={upcoming.movies}
          isLoading={upcoming.isLoading}
          isError={upcoming.isError}
          errorMessage={upcoming.error}
        />
      </Reveal>

      {history.length > 0 && (
        <Reveal>
          <MovieRow title="Recently Viewed" movies={history.slice(0, 12)} isLoading={false} isError={false} />
        </Reveal>
      )}
    </PageContainer>
  );
}

export default Home;
