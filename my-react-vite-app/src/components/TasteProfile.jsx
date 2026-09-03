import { useMemo } from 'react';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useHistory } from '../contexts/HistoryContext';
import { useRatings } from '../contexts/RatingsContext';
import { useGenres } from '../hooks/useGenres';
import { buildTasteProfile } from '../utils/tasteProfile';

/**
 * "Movie DNA" - a human-readable view of the same taste profile that
 * powers recommendations (see utils/tasteProfile.js). Plain counting and
 * averaging over local activity, not AI/ML. Renders nothing at all when
 * there isn't enough activity yet, rather than a sparse/misleading
 * profile from one or two movies.
 */
function TasteProfile() {
  const { watchlist } = useWatchlist();
  const { history } = useHistory();
  const { ratingsList } = useRatings();
  const { genreMap } = useGenres();

  const profile = useMemo(
    () => buildTasteProfile({ watchlist, history, ratingsList }),
    [watchlist, history, ratingsList]
  );

  if (!profile.hasEnoughData) return null;

  const topGenreNames = profile.topGenreIds.map((id) => genreMap.get(id)).filter(Boolean);

  return (
    <section className="fade-in-up mb-8 rounded-xl bg-panel p-5 sm:p-6">
      <h2 className="mb-1 text-xl font-bold">Your Movie DNA</h2>
      <p className="mb-5 text-sm text-ink-muted">
        Calculated from {profile.moviesConsidered} movies in your watchlist, ratings and viewing history.
      </p>

      <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
        {topGenreNames.length > 0 && (
          <div className="fade-in-up">
            <h3 className="mb-2 text-xs uppercase tracking-wide text-ink-muted">Top Genres</h3>
            <div className="stagger flex flex-wrap gap-1.5">
              {topGenreNames.map((name) => (
                <span key={name} className="fade-in-sm rounded-full bg-panel-raised px-2.5 py-1 text-sm">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.averageRating !== null && (
          <div className="fade-in-up">
            <h3 className="mb-2 text-xs uppercase tracking-wide text-ink-muted">Your Average Rating</h3>
            <p className="text-[1.05rem] font-semibold">★ {profile.averageRating.toFixed(1)} / 5</p>
          </div>
        )}

        {profile.topKeywordNames.length > 0 && (
          <div className="fade-in-up">
            <h3 className="mb-2 text-xs uppercase tracking-wide text-ink-muted">Recurring Themes</h3>
            <div className="stagger flex flex-wrap gap-1.5">
              {profile.topKeywordNames.map((name) => (
                <span key={name} className="fade-in-sm rounded-full bg-panel-raised px-2.5 py-1 text-sm">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.topDirector && (
          <div className="fade-in-up">
            <h3 className="mb-2 text-xs uppercase tracking-wide text-ink-muted">Favorite Director</h3>
            <p className="text-[1.05rem] font-semibold">
              {profile.topDirector.name}{' '}
              <span className="text-sm font-normal text-ink-muted">({profile.topDirector.count} movies)</span>
            </p>
          </div>
        )}

        {profile.topCast.length > 0 && (
          <div className="fade-in-up">
            <h3 className="mb-2 text-xs uppercase tracking-wide text-ink-muted">Familiar Faces</h3>
            <p className="text-[1.05rem] font-semibold">{profile.topCast.map((c) => c.name).join(', ')}</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default TasteProfile;
