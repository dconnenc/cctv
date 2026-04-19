import { PerformerApiResponse } from '@cctv/types';

import { useGet } from './useGet';

export function usePerformer(slug: string) {
  const { data, get, isLoading, error } = useGet<PerformerApiResponse>({
    url: `/api/performers/${slug}`,
    enabled: !!slug,
  });

  return {
    performer: data?.performer ?? null,
    refetch: get,
    isLoading,
    error,
  };
}
