import { buildUserProfile } from './buildProfile';
import { scoreMovie } from './scoreCandidates';

/**
 * "Similar Movies" for the Movie Details page - similarity to the movie
 * currently being viewed, as distinct from "Recommended For You"
 * (utils/recommendations/index.js's useRecommendations pipeline), which
 * is personalized to the user's overall activity. The two are kept
 * architecturally separate on purpose even though they share scoring
 * code: this one always answers "what's like *this* movie", never "what
 * does *this user* like".
 *
 * Rather than showing TMDB's raw `similar` list, this:
 * 1. Builds a "profile of one" from the current movie (its own genres +
 *    overview text - and keywords/cast/director too, since the current
 *    movie's own details response already has them for free).
 * 2. Merges TMDB's `similar` and `recommendations` lists (two different
 *    TMDB algorithms, both already fetched via append_to_response - see
 *    movieApi.js), tracking which list(s) each candidate appeared in.
 * 3. Removes the current movie and de-duplicates.
 * 4. Re-scores every candidate with the same genre/text/quality engine
 *    used for personalized recommendations (keyword/cast/director
 *    components naturally score as "unavailable" here, since these list
 *    endpoints don't carry that data per-candidate - see
 *    scoreCandidates.js's renormalization).
 * 5. Applies a small "consensus boost": a movie both TMDB algorithms
 *    independently agree on is a stronger signal than one only one of
 *    them suggested.
 */
const CONSENSUS_BOOST = 1.15; // modest, deliberately can't outweigh a genuinely bad genre/text match

export function rankSimilarMovies(currentMovie, similarList = [], recommendedList = [], { limit = 12 } = {}) {
  const profile = buildUserProfile([{ movie: currentMovie, weight: 1, sourceType: 'currentMovie' }]);

  const byId = new Map();
  similarList.forEach((movie) => {
    if (movie.id === currentMovie.id) return;
    byId.set(movie.id, { movie, inSimilar: true, inRecommended: false });
  });
  recommendedList.forEach((movie) => {
    if (movie.id === currentMovie.id) return;
    const existing = byId.get(movie.id);
    if (existing) existing.inRecommended = true;
    else byId.set(movie.id, { movie, inSimilar: false, inRecommended: true });
  });

  const maxVoteCount = Math.max(1, ...[...byId.values()].map(({ movie }) => movie.vote_count ?? 0));

  return [...byId.values()]
    .map(({ movie, inSimilar, inRecommended }) => {
      const result = scoreMovie(movie, profile, { maxVoteCount });
      const bothListsAgree = inSimilar && inRecommended;
      const score = bothListsAgree ? result.score * CONSENSUS_BOOST : result.score;
      return { movie, score, bothListsAgree, matchedGenreIds: result.matchedGenreIds };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.movie.id - b.movie.id)
    .slice(0, limit);
}
