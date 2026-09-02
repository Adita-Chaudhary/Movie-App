/**
 * Bag-of-words text similarity.
 *
 * This is deliberately simple, explainable math - NOT machine learning.
 * There is no model, no training step, and no learned weights. It is a
 * classic information-retrieval technique (term-frequency vectors +
 * cosine similarity) used here to compare movie overviews.
 */

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'to', 'of', 'in', 'on', 'for', 'with', 'as', 'by',
  'at', 'from', 'this', 'that', 'these', 'those', 'it', 'its', 'his', 'her',
  'he', 'she', 'they', 'their', 'them', 'who', 'what', 'when', 'where',
  'which', 'while', 'after', 'before', 'into', 'about', 'than', 'then',
  'so', 'not', 'no', 'do', 'does', 'did', 'has', 'have', 'had', 'will',
  'would', 'can', 'could', 'up', 'out', 'one', 'all', 'her', 'him', 'you',
  'your', 'his', 'own', 'more', 'most', 'other', 'must', 'now', 'over',
]);

/** Lowercases, strips punctuation, splits on whitespace, drops stopwords/short tokens. */
export function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

/** Converts a token list into a { term: frequency } map. */
export function termFrequencyVector(tokens) {
  const vector = new Map();
  tokens.forEach((token) => {
    vector.set(token, (vector.get(token) ?? 0) + 1);
  });
  return vector;
}

/**
 * Cosine similarity between two term-frequency maps: the cosine of the
 * angle between the vectors in term-space, in [0, 1] for non-negative
 * frequencies. 1 = identical word usage, 0 = no shared vocabulary.
 */
export function cosineSimilarity(vectorA, vectorB) {
  if (vectorA.size === 0 || vectorB.size === 0) return 0;

  let dotProduct = 0;
  for (const [term, freqA] of vectorA) {
    const freqB = vectorB.get(term);
    if (freqB) dotProduct += freqA * freqB;
  }

  if (dotProduct === 0) return 0;

  const magnitude = (vector) =>
    Math.sqrt([...vector.values()].reduce((sum, freq) => sum + freq * freq, 0));

  return dotProduct / (magnitude(vectorA) * magnitude(vectorB));
}
