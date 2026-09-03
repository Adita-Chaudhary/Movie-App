/**
 * Turns a scored recommendation into a short, human-readable explanation.
 *
 * Hard rule: every reason returned here must be traceable to a non-empty
 * `matched*` array/id from scoreCandidates.js's scoreMovie(). Nothing is
 * inferred or guessed - if `matchedGenreIds` is empty, no genre reason is
 * produced, full stop. This is what keeps the feature honest: a
 * recommendation can always point at the exact data that justified it.
 *
 * `quality` (the popularity/rating tie-breaker) is intentionally never
 * surfaced as a reason - it's a tie-breaker between otherwise-similar
 * candidates, not a taste match, so mentioning it ("recommended because
 * it's popular") would be a non-sequitur next to genuine personalization
 * reasons.
 */

const SOURCE_PHRASES = {
  rating: 'movies you rated highly',
  watchlist: 'movies in your watchlist',
  history: 'movies you\'ve recently viewed',
};

function namesForIds(ids, idList = [], nameList = []) {
  return ids
    .map((id) => {
      const index = idList.indexOf(id);
      return index === -1 ? null : nameList[index];
    })
    .filter(Boolean);
}

/**
 * @param {object} candidate - the scored movie (needs keyword_ids/names, cast_ids/names, director_name if available)
 * @param {object} scoreResult - the object returned by scoreMovie()
 * @param {object} [options]
 * @param {(id:number)=>string|undefined} [options.getGenreName] - genre id -> name lookup (genre names aren't on the movie object itself)
 * @param {string|null} [options.dominantSource] - 'rating' | 'watchlist' | 'history' | null, from dominantSourceType()
 * @returns {{ reasons: string[], summary: string }}
 */
export function explainRecommendation(candidate, scoreResult, { getGenreName, dominantSource } = {}) {
  const reasons = [];

  if (scoreResult.matchedGenreIds.length > 0 && getGenreName) {
    const genreNames = scoreResult.matchedGenreIds.map(getGenreName).filter(Boolean).slice(0, 2);
    if (genreNames.length > 0) {
      reasons.push(`matches your preference for ${genreNames.join(' and ')}`);
    }
  }

  if (scoreResult.matchedDirectorId && candidate.director_name) {
    reasons.push(`is directed by ${candidate.director_name}, whose work you've enjoyed`);
  }

  if (scoreResult.matchedCastIds.length > 0) {
    const castNames = namesForIds(scoreResult.matchedCastIds, candidate.cast_ids, candidate.cast_names).slice(0, 2);
    if (castNames.length > 0) {
      reasons.push(`features ${castNames.join(' and ')}, who you've seen in movies you liked`);
    }
  }

  if (scoreResult.matchedKeywordIds.length > 0) {
    const keywordNames = namesForIds(scoreResult.matchedKeywordIds, candidate.keyword_ids, candidate.keyword_names).slice(0, 2);
    if (keywordNames.length > 0) {
      reasons.push(`shares themes like ${keywordNames.join(' and ')} with movies you've enjoyed`);
    }
  }

  // Only fall back to the generic "similar plot/tone" reason when nothing
  // more specific matched, and only when the text signal actually
  // contributed something meaningful - otherwise it's filler, not a reason.
  if (reasons.length === 0 && scoreResult.breakdown.text > 0.12) {
    reasons.push('has a similar plot and tone to movies you\'ve enjoyed');
  }

  if (reasons.length === 0) {
    return { reasons: [], summary: '' };
  }

  const sourcePhrase = dominantSource ? SOURCE_PHRASES[dominantSource] : null;
  const trailingClause = sourcePhrase ? ` - based on ${sourcePhrase}` : '';
  const summary = `Recommended because it ${reasons.join(' and ')}${trailingClause}.`;

  return { reasons, summary };
}
