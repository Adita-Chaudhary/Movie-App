import { useEffect, useState } from 'react';
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

  const genreMap = new Map(genres.map((genre) => [genre.id, genre.name]));
  const getGenreNames = (genreIds = []) =>
    genreIds.map((id) => genreMap.get(id)).filter(Boolean);

  return { genres, genreMap, getGenreNames };
}
