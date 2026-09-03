import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHistory } from '../contexts/HistoryContext';
import { useRatings } from '../contexts/RatingsContext';
import MovieCard from '../components/MovieCard';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import StarRating from '../components/StarRating';
import TasteProfile from '../components/TasteProfile';
import { tmdbImage } from '../services/tmdbClient';
import { formatDate, formatYear, truncate } from '../utils/format';
import '../css/Activity.css';

function HistoryTab() {
  const { history, clearHistory } = useHistory();
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (history.length === 0) {
    return (
      <EmptyState
        icon="🕓"
        title="No recently viewed movies"
        message="Movies you open will show up here."
        action={
          <Link to="/" className="state-action">
            Browse Movies
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="activity-tab-header">
        <p>{history.length} movie{history.length === 1 ? '' : 's'} viewed recently</p>
        <button type="button" className="clear-btn" onClick={() => setConfirmingClear(true)}>
          Clear History
        </button>
      </div>
      <div className="movies-grid stagger">
        {history.map((movie) => (
          <MovieCard movie={movie} key={movie.id} />
        ))}
      </div>
      {confirmingClear && (
        <ConfirmDialog
          title="Clear viewing history?"
          message="This removes every movie from your recently viewed list. This can't be undone."
          confirmLabel="Clear History"
          onConfirm={() => {
            clearHistory();
            setConfirmingClear(false);
          }}
          onCancel={() => setConfirmingClear(false)}
        />
      )}
    </div>
  );
}

function RatingsTab() {
  const { ratingsList, deleteRating } = useRatings();
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  if (ratingsList.length === 0) {
    return (
      <EmptyState
        icon="⭐"
        title="You haven't rated any movies yet"
        message="Open a movie and leave a star rating and review to see it here."
        action={
          <Link to="/" className="state-action">
            Browse Movies
          </Link>
        }
      />
    );
  }

  return (
    <div className="ratings-list stagger">
      {ratingsList.map((entry) => {
        const posterUrl = tmdbImage(entry.movie.poster_path, 'w185');
        return (
          <div className="rating-list-item fade-in-up" key={entry.movieId}>
            <Link to={`/movie/${entry.movieId}`} className="rating-list-poster">
              {posterUrl ? (
                <img src={posterUrl} alt={entry.movie.title} loading="lazy" />
              ) : (
                <div className="rating-list-poster-placeholder" aria-hidden="true">
                  🎬
                </div>
              )}
            </Link>
            <div className="rating-list-body">
              <Link to={`/movie/${entry.movieId}`} className="rating-list-title">
                {entry.movie.title} <span>({formatYear(entry.movie.release_date)})</span>
              </Link>
              <StarRating value={entry.rating} readOnly size="sm" />
              {entry.review && <p className="rating-list-review">{truncate(entry.review, 220)}</p>}
              <p className="rating-list-date">Updated {formatDate(entry.updatedAt)}</p>
              <div className="rating-list-actions">
                <Link to={`/movie/${entry.movieId}`} className="rating-list-edit">
                  Edit
                </Link>
                <button type="button" className="rating-list-delete" onClick={() => setPendingDeleteId(entry.movieId)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {pendingDeleteId !== null && (
        <ConfirmDialog
          title="Delete this rating?"
          confirmLabel="Delete"
          onConfirm={() => {
            deleteRating(pendingDeleteId);
            setPendingDeleteId(null);
          }}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  );
}

function Activity() {
  const [activeTab, setActiveTab] = useState('history');

  return (
    <div className="activity-page">
      <TasteProfile />

      <div className="activity-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          className={activeTab === 'history' ? 'activity-tab active' : 'activity-tab'}
          onClick={() => setActiveTab('history')}
        >
          Recently Viewed
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ratings'}
          className={activeTab === 'ratings' ? 'activity-tab active' : 'activity-tab'}
          onClick={() => setActiveTab('ratings')}
        >
          My Ratings
        </button>
      </div>

      {activeTab === 'history' ? <HistoryTab /> : <RatingsTab />}
    </div>
  );
}

export default Activity;
