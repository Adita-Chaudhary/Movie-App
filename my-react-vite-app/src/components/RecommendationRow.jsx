import MovieCard from './MovieCard';
import { SkeletonRow } from './SkeletonCard';
import { ROW_SCROLLER_CLASS, ROW_ITEM_CLASS } from './MovieRow';

/**
 * Renders "Recommended for You", reusing MovieRow's row/scroller/item
 * classes but adding a short, honest explanation caption under each
 * card - see utils/recommendations/explain.js for how `explanation` is
 * generated. Falls back to a "Popular Picks" framing (no explanation
 * captions, since a fallback pick isn't personalized) when the user
 * doesn't have enough activity yet for real personalization.
 */
function RecommendationRow({ recommendations, isLoading, isPersonalized }) {
  if (isLoading) {
    return (
      <section className="mb-10">
        <h2 className="text-lg font-bold sm:text-xl">Recommended for You</h2>
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
    <section className="mb-10">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        <p className="text-sm text-ink-muted">{subtitle}</p>
      </div>
      <div className={ROW_SCROLLER_CLASS}>
        {recommendations.map(({ movie, explanation }) => (
          <div className={`${ROW_ITEM_CLASS} flex flex-col gap-2`} key={movie.id}>
            <MovieCard movie={movie} />
            {explanation?.summary && (
              <p
                className="recommendation-reason line-clamp-3 text-xs leading-snug text-ink-muted"
                title={explanation.summary}
              >
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
