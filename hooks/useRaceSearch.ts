import { useState, useCallback, useRef } from 'react';
import { searchRaces } from '../lib/ultrasignup';
import type { RaceOption } from '../types/app.types';

export function useRaceSearch() {
  const [query, setQuery] = useState('');
  const [races, setRaces] = useState<RaceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchUnavailable, setSearchUnavailable] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((text: string) => {
    setQuery(text);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setRaces([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { races: results, error: err } = await searchRaces(text);
      setRaces(results);
      if (err) {
        setError(err);
        setSearchUnavailable(true);
      } else {
        setSearchUnavailable(false);
      }
      setLoading(false);
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setRaces([]);
    setError(null);
  }, []);

  return { query, races, loading, error, searchUnavailable, search, clear };
}
