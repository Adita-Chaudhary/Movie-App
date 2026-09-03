import MovieCard from './MovieCard';
import { SkeletonRow } from './SkeletonCard';
import '../css/MovieRow.css';
import '../css/Recommendations.css';

/**
 * Renders "Recommended for You", reusing MovieRow's visual language
 * (same classes) but adding a short, honest explanation caption under
 * each card - see utils/recommendations/explain.js for how `explanation`
 * is generated. Falls back to a "Popular Picks" framing (no explanation
 * captions, since a fallback pick isn't personalized) when the user
 * doesn't have enough activity yet for real personalization.
 */
function RecommendationRow({ recommendations, isLoading, isPersonalized }) {
  if (isLoading) {
    return (
      <section className="movie-row">
        <h2 className="movie-row-title">Recommended for You</h2>
        <SkeletonRow count={6} />
      </section>
    );
  }

  if (recommendations.length === 0) return null;

  const title = isPersonalized ? 'Recommended for You' : 'Popular Picks';
  const subtitle = isPersonalized
    ? 'Personalized picks based on your watchlist, ratings and viewing history'
    : 'Rate or watchlist a few movies to personalize this section';

  return (
    <section className="movie-row">
      <div className="movie-row-header">
        <h2 className="movie-row-title">{title}</h2>
        <p className="movie-row-subtitle">{subtitle}</p>
      </div>
      <div className="movie-row-scroller stagger">
        {recommendations.map(({ movie, explanation }) => (
          <div className="movie-row-item recommendation-item" key={movie.id}>
            <MovieCard movie={movie} />
            {explanation?.summary && (
              <p className="recommendation-reason" title={explanation.summary}>
                {explanation.summary}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default RecommendationRow;
