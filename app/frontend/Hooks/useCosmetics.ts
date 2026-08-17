import { useCallback, useEffect, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Cosmetic } from '@cctv/types';

export function useCosmetics() {
  const { code, experienceFetch } = useExperience();
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCosmetics = useCallback(async () => {
    if (!code) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await experienceFetch(`/api/experiences/${encodeURIComponent(code)}/cosmetics`);
      const data = await res.json();
      setCosmetics(data.cosmetics ?? []);
    } catch (e: any) {
      setError(
        e?.message === 'Authentication expired'
          ? 'Authentication expired'
          : 'Failed to load cosmetics',
      );
    } finally {
      setIsLoading(false);
    }
  }, [code, experienceFetch]);

  useEffect(() => {
    fetchCosmetics();
  }, [fetchCosmetics]);

  return { cosmetics, isLoading, error, refetch: fetchCosmetics };
}
