import { EventApiResponse } from '@cctv/types';

import { useGet } from './useGet';

export function useEvent(slug: string) {
  const { data, get, isLoading, error } = useGet<EventApiResponse>({
    url: `/api/events/${slug}`,
    enabled: !!slug,
  });

  return {
    event: data?.event ?? null,
    refetch: get,
    isLoading,
    error,
  };
}
