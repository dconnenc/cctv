import { JoinExperienceApiResponse } from '@cctv/types';
import { qaLogger } from '@cctv/utils';

import { usePost } from './usePost';

export function useJoinExperience() {
  const { post, isLoading, error, setError } = usePost<JoinExperienceApiResponse>({
    url: '/api/experiences/join',
  });

  const joinExperience = async (code: string) => {
    // Validate code
    if (!code || code.trim() === '') {
      setError('Please enter a code');
      return;
    }

    // Make the API request
    const response = await post(
      JSON.stringify({
        code: code.trim(),
      }),
    );

    if (!response) {
      setError('Failed to join experience');
      return;
    }

    // Handle different response types
    switch (response.type) {
      case 'success':
        // User is already registered - redirect to experience
        qaLogger(`User already registrated, redirecting to: ${response.url}`);
        window.location.href = response.url;
        break;
      case 'needs_registration':
        // User needs to register - redirect to registration page
        qaLogger(`User needs registration, redirecting to: ${response.url}`);
        window.location.href = response.url;
        break;
      case 'error':
        setError(response.error || 'Failed to join experience');
        break;
      default:
        console.error(`Unknown response type encountered: ${response}`);
        break;
    }
  };

  return {
    joinExperience,
    isLoading,
    error,
    setError,
  };
}
