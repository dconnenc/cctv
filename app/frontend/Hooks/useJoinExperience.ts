import { usePost } from './usePost';
import { ExperienceJoinResponse } from '@cctv/types';
import { qaLogger } from '@cctv/utils';

export function useJoinExperience() {
  const { post, isLoading, error, setError } = usePost<ExperienceJoinResponse>({
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

    if (response.error != null) {
      setError(response.error || 'Failed to join experience');
      return;
    }

    // Handle different response statuses
    switch (response.status) {
      case 'registered':
        // User is already registered - store JWT and redirect to experience
        qaLogger(`User already registrated, redirecting to: ${response.url}`);
        localStorage.setItem('experience_jwt', response.jwt);
        window.location.href = response.url;
        break;
      case 'needs_registration':
        // User needs to register - redirect to registration page
        qaLogger(`User needs registration, redirecting to: ${response.url}`);
        console.log('User needs registration');
        window.location.href = response.url;
        break;
      default:
        console.log(`Unknown response status encountered: ${response}`);
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
