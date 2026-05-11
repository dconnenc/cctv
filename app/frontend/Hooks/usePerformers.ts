import { PerformersApiResponse } from '@cctv/types';

import { useGet } from './useGet';

export function usePerformers() {
  const { data, get, isLoading, error } = useGet<PerformersApiResponse>({
    url: '/api/performers',
    enabled: true,
  });

  return {
    performers: data?.performers ?? [],
    refetch: get,
    isLoading,
    error,
  };
}
