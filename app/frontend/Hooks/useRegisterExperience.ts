import { useExperience } from '@cctv/contexts';
import { usePost } from '@cctv/hooks/usePost';
import { RegisterExperienceApiResponse } from '@cctv/types';
import { qaLogger } from '@cctv/utils';

interface RegisterExperienceParams {
  email?: string;
  name?: string;
  participantName: string;
  isAuthenticated: boolean;
}

export function useRegisterExperience() {
  const { code, setJWT } = useExperience();
  const { post, isLoading, error, setError } = usePost<RegisterExperienceApiResponse>({
    url: `/api/experiences/${code}/register`,
  });

  const registerExperience = async ({
    email,
    name,
    participantName,
    isAuthenticated,
  }: RegisterExperienceParams) => {
    // Validate required fields
    if (!isAuthenticated && (!email || !email.trim())) {
      setError('Please enter your email');
      return;
    }

    if (!participantName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!code?.trim()) {
      setError('Missing experience code');
      return;
    }

    qaLogger(
      `Attempting to register participant: ${participantName}:${email || 'logged-in user'} to ${code}`,
    );

    const response = await post(
      JSON.stringify({
        email: email?.trim() || '',
        name: name?.trim() || '',
        participant_name: participantName.trim(),
      }),
    );

    if (!response) {
      setError('Connection error. Please try again.');
      return;
    }

    if (response.type === 'error') {
      setError(response.error || 'Registration failed');
      return;
    }

    if (response.type === 'success') {
      // Success - store JWT and redirect to experience
      qaLogger(`Successfully regsitered participant. Storing JWT and redirecting to experience`);
      setJWT(response.jwt);
      window.location.href = response.url;
    }
  };

  return {
    registerExperience,
    isLoading,
    error,
    setError,
  };
}
