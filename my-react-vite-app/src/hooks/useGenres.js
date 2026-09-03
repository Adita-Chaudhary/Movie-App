import { useEffect, useMemo, useState } from 'react';
import { getGenres } from '../services/movieApi';

/** Fetches the genre id -> name map once (cached by tmdbClient) for filters and detail chips. */
export function useGenres() {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    let isMounted = true;
    getGenres()
      .then((data) => {
        if (isMounted) setGenres(data.genres ?? []);
      })
      .catch(() => {
        // Genre list is a nice-to-have for filters; fail quietly.
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Memoized (not rebuilt every render): useRecommendations depends on
  // genreMap's identity to safely recompute only when genres actually
  // change, not on every render - a fresh Map here would otherwise
  // re-trigger that effect in a loop.
  const genreMap = useMemo(() => new Map(genres.map((genre) => [genre.id, genre.name])), [genres]);
  const getGenreNames = useMemo(
    () => (genreIds = []) => genreIds.map((id) => genreMap.get(id)).filter(Boolean),
    [genreMap]
  );

  return { genres, genreMap, getGenreNames };
}
