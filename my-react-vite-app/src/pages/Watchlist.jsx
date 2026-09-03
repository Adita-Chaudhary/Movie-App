import { useWatchlist } from '../contexts/WatchlistContext';
import MovieGrid from '../components/MovieGrid';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import PageContainer from '../components/PageContainer';
import { useExitingItems } from '../hooks/useExitingItems';

function Watchlist() {
  const { watchlist, count } = useWatchlist();
  // Removing the very last item would otherwise flip straight to the
  // empty state the instant `count` hits 0, cutting off that card's exit
  // animation mid-flight - stay on the grid until it's actually gone.
  const stillAnimatingOut = useExitingItems(watchlist, (movie) => movie.id).length > 0;

  if (count === 0 && !stillAnimatingOut) {
    return (
      <PageContainer>
        <EmptyState
          icon="🍿"
          title="Your watchlist is empty"
          message="Add movies you want to watch later by tapping the + button on any movie card."
          action={<Button to="/">Browse Movies</Button>}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h2 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl">Your Watchlist ({count})</h2>
      <MovieGrid movies={watchlist} isLoading={false} isError={false} animateRemovals />
    </PageContainer>
  );
}

export default Watchlist;
