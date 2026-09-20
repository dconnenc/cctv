import { AnalyticsEvent, capture } from '@cctv/analytics';
import { setStoredParticipantJWT } from '@cctv/contexts/jwtStorage';
import { JoinExperienceApiResponse } from '@cctv/types';
import { qaLogger } from '@cctv/utils';

import { usePost } from './usePost';

export interface JoinExperienceResult {
  url: string;
  status: 'registered' | 'needs_registration';
  experienceName: string;
}

export function useJoinExperience() {
  const { post, isLoading, error, setError } = usePost<JoinExperienceApiResponse>({
    url: '/api/experiences/join',
  });

  const joinExperience = async (code: string): Promise<JoinExperienceResult | null> => {
    if (!code || code.trim() === '') {
      setError('Please enter a code');
      return null;
    }

    const response = await post(
      JSON.stringify({
        code: code.trim(),
      }),
    );

    if (!response) {
      setError('Failed to join experience');
      return null;
    }

    switch (response.type) {
      case 'success':
        qaLogger(`User already registrated, redirecting to: ${response.url}`);
        sessionStorage.setItem('cctv_last_join_code', code.trim());
        // Store the participant JWT so the lobby route guard admits us; without
        // it the lobby bounces back to /join and loops.
        setStoredParticipantJWT(response.experience_code_slug, response.jwt);
        capture(AnalyticsEvent.ExperienceJoined, {
          status: 'registered',
          experience_name: response.experience_name,
        });
        return {
          url: response.url,
          status: 'registered',
          experienceName: response.experience_name,
        };
      case 'needs_registration':
        qaLogger(`User needs registration, redirecting to: ${response.url}`);
        sessionStorage.setItem('cctv_last_join_code', code.trim());
        capture(AnalyticsEvent.ExperienceJoined, {
          status: 'needs_registration',
          experience_name: response.experience_name,
        });
        return {
          url: response.url,
          status: 'needs_registration',
          experienceName: response.experience_name,
        };
      case 'error':
        setError(response.error || 'Failed to join experience');
        return null;
      default:
        console.error(`Unknown response type encountered: ${response}`);
        return null;
    }
  };

  return {
    joinExperience,
    isLoading,
    error,
    setError,
  };
}
