import MovieCard from './MovieCard';
import InfoTooltip from './InfoTooltip';
import { SkeletonRow } from './SkeletonCard';
import { ROW_SCROLLER_CLASS, ROW_ITEM_CLASS } from './MovieRow';

/**
 * Renders "Recommended for You", reusing MovieRow's row/scroller/item
 * classes. Each card's explanation (see utils/recommendations/explain.js)
 * is still generated exactly as before and still fully available - it's
 * just surfaced through a compact "i" badge + tooltip (InfoTooltip)
 * instead of a permanent multi-line caption under every card, so the row
 * stays the same height as every other row. Falls back to a
 * "Popular Picks" framing (no explanations, since a fallback pick isn't
 * personalized) when the user doesn't have enough activity yet for real
 * personalization.
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
          <div className={ROW_ITEM_CLASS} key={movie.id}>
            <MovieCard
              movie={movie}
              titleBadge={
                explanation?.summary && (
                  <InfoTooltip label={`Why ${movie.title} was recommended`} content={explanation.summary} />
                )
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default RecommendationRow;
