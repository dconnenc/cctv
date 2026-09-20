import { ExperiencesIndexResponse } from '@cctv/types';

import { useGet } from './useGet';

export function useExperiences() {
  const { data, isLoading, error } = useGet<ExperiencesIndexResponse>({
    url: '/api/experiences',
    enabled: true,
  });

  return {
    experiences: data?.experiences ?? [],
    isLoading,
    error,
  };
}
