import { useMemo } from 'react';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useHistory } from '../contexts/HistoryContext';
import { useRatings } from '../contexts/RatingsContext';
import { useGenres } from '../hooks/useGenres';
import { buildTasteProfile } from '../utils/tasteProfile';
import '../css/TasteProfile.css';

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
    <section className="taste-profile fade-in-up">
      <h2>Your Movie DNA</h2>
      <p className="taste-profile-subtitle">
        Calculated from {profile.moviesConsidered} movies in your watchlist, ratings and viewing history.
      </p>

      <div className="taste-profile-grid">
        {topGenreNames.length > 0 && (
          <div className="taste-stat">
            <h3>Top Genres</h3>
            <div className="taste-chip-list">
              {topGenreNames.map((name) => (
                <span key={name} className="taste-chip">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.averageRating !== null && (
          <div className="taste-stat">
            <h3>Your Average Rating</h3>
            <p className="taste-stat-value">★ {profile.averageRating.toFixed(1)} / 5</p>
          </div>
        )}

        {profile.topKeywordNames.length > 0 && (
          <div className="taste-stat">
            <h3>Recurring Themes</h3>
            <div className="taste-chip-list">
              {profile.topKeywordNames.map((name) => (
                <span key={name} className="taste-chip">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.topDirector && (
          <div className="taste-stat">
            <h3>Favorite Director</h3>
            <p className="taste-stat-value">
              {profile.topDirector.name} <span className="taste-stat-count">({profile.topDirector.count} movies)</span>
            </p>
          </div>
        )}

        {profile.topCast.length > 0 && (
          <div className="taste-stat">
            <h3>Familiar Faces</h3>
            <p className="taste-stat-value">{profile.topCast.map((c) => c.name).join(', ')}</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default TasteProfile;
