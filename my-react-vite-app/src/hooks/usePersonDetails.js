import { useEffect, useState } from 'react';
import { getPersonDetails } from '../services/movieApi';

export function usePersonDetails(personId) {
  const [person, setPerson] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!personId) return undefined;

    let cancelled = false;
    setStatus('loading');
    setPerson(null);

    getPersonDetails(personId)
      .then((data) => {
        if (cancelled) return;
        setPerson(data);
        setStatus('success');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? 'Failed to load this person.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [personId]);

  return { person, status, error, isLoading: status === 'loading', isError: status === 'error' };
}
