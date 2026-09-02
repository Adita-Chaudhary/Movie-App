import { Link } from 'react-router-dom';
import { useWatchlist } from '../contexts/WatchlistContext';
import MovieCard from '../components/MovieCard';
import EmptyState from '../components/EmptyState';
import '../css/Watchlist.css';

function Watchlist() {
  const { watchlist, count } = useWatchlist();

  if (count === 0) {
    return (
      <div className="watchlist-page">
        <EmptyState
          icon="🍿"
          title="Your watchlist is empty"
          message="Add movies you want to watch later by tapping the + button on any movie card."
          action={
            <Link to="/" className="state-action">
              Browse Movies
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <h2>Your Watchlist ({count})</h2>
      <div className="movies-grid">
        {watchlist.map((movie) => (
          <MovieCard movie={movie} key={movie.id} />
        ))}
      </div>
    </div>
  );
}

export default Watchlist;
