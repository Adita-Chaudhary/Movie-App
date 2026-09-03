import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHistory } from '../contexts/HistoryContext';
import { useRatings } from '../contexts/RatingsContext';
import MovieGrid from '../components/MovieGrid';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import StarRating from '../components/StarRating';
import TasteProfile from '../components/TasteProfile';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { tmdbImage } from '../services/tmdbClient';
import { formatDate, formatYear, truncate } from '../utils/format';

function HistoryTab() {
  const { history, clearHistory } = useHistory();
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (history.length === 0) {
    return (
      <EmptyState
        icon="🕓"
        title="No recently viewed movies"
        message="Movies you open will show up here."
        action={<Button to="/">Browse Movies</Button>}
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-ink-muted">
        <p>
          {history.length} movie{history.length === 1 ? '' : 's'} viewed recently
        </p>
        <button
          type="button"
          className="border-bad bg-transparent px-3.5 py-1.5 text-sm text-bad"
          onClick={() => setConfirmingClear(true)}
        >
          Clear History
        </button>
      </div>
      <MovieGrid movies={history} isLoading={false} isError={false} />
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
        action={<Button to="/">Browse Movies</Button>}
      />
    );
  }

  return (
    <div className="stagger flex flex-col gap-4">
      {ratingsList.map((entry) => {
        const posterUrl = tmdbImage(entry.movie.poster_path, 'w185');
        return (
          <div
            className="fade-in-up flex gap-4 rounded-[10px] bg-panel p-4 transition-[background-color,box-shadow] duration-200 hover:bg-panel-raised hover:shadow-panel"
            key={entry.movieId}
          >
            <Link to={`/movie/${entry.movieId}`} className="w-16 flex-none sm:w-20">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={entry.movie.title}
                  loading="lazy"
                  className="block aspect-[2/3] w-16 rounded-md object-cover sm:w-20"
                />
              ) : (
                <div
                  className="flex aspect-[2/3] w-16 items-center justify-center rounded-md bg-panel-raised sm:w-20"
                  aria-hidden="true"
                >
                  🎬
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={`/movie/${entry.movieId}`} className="mb-1 block font-bold">
                {entry.movie.title} <span className="font-normal text-ink-muted">({formatYear(entry.movie.release_date)})</span>
              </Link>
              <StarRating value={entry.rating} readOnly size="sm" />
              {entry.review && <p className="my-2 text-sm leading-relaxed text-ink">{truncate(entry.review, 220)}</p>}
              <p className="mt-1 text-xs text-ink-muted">Updated {formatDate(entry.updatedAt)}</p>
              <div className="mt-1.5 flex gap-4 text-sm">
                <Link to={`/movie/${entry.movieId}`} className="font-semibold text-brand">
                  Edit
                </Link>
                <button
                  type="button"
                  className="border-0 bg-transparent p-0 text-sm font-semibold text-bad"
                  onClick={() => setPendingDeleteId(entry.movieId)}
                >
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

  const tabClass = (tab) =>
    `border-b-2 px-4 py-3 font-semibold transition-colors duration-200 ${
      activeTab === tab ? 'border-brand text-brand' : 'border-transparent text-ink-muted'
    }`;

  return (
    <PageContainer size="narrow">
      <TasteProfile />

      <div className="mb-6 flex gap-2 border-b border-line" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          className={tabClass('history')}
          onClick={() => setActiveTab('history')}
        >
          Recently Viewed
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ratings'}
          className={tabClass('ratings')}
          onClick={() => setActiveTab('ratings')}
        >
          My Ratings
        </button>
      </div>

      {activeTab === 'history' ? <HistoryTab /> : <RatingsTab />}
    </PageContainer>
  );
}

export default Activity;
