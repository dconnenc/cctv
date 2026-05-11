import { EventsApiResponse } from '@cctv/types';

import { useGet } from './useGet';

export function useEvents({ month, year }: { month?: number; year?: number } = {}) {
  const params = month && year ? `?month=${month}&year=${year}` : '';
  const { data, get, isLoading, error } = useGet<EventsApiResponse>({
    url: `/api/events${params}`,
    enabled: true,
  });

  return {
    events: data?.events ?? [],
    refetch: get,
    isLoading,
    error,
  };
}
