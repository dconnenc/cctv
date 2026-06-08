import { DiscoverApiResponse } from '@cctv/types';

import { useGet } from './useGet';

export function useDiscover() {
  const { data, get, isLoading, error } = useGet<DiscoverApiResponse>({
    url: '/api/discover',
    enabled: true,
  });

  return {
    theaters: data?.theaters ?? [],
    events: data?.events ?? [],
    refetch: get,
    isLoading,
    error,
  };
}
