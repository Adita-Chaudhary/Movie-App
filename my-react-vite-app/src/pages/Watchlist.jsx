import { useWatchlist } from '../contexts/WatchlistContext';
import MovieGrid from '../components/MovieGrid';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import PageContainer from '../components/PageContainer';

function Watchlist() {
  const { watchlist, count } = useWatchlist();

  if (count === 0) {
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
      <MovieGrid movies={watchlist} isLoading={false} isError={false} />
    </PageContainer>
  );
}

export default Watchlist;
