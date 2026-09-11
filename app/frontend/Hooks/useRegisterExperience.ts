import { useExperience } from '@cctv/contexts/ExperienceContext';
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
  const { code, setParticipantJWT } = useExperience();
  const { post, isLoading, error, setError } = usePost<RegisterExperienceApiResponse>({
    url: `/api/experiences/${code}/register`,
  });

  const registerExperience = async ({
    email,
    name,
    participantName,
    isAuthenticated,
  }: RegisterExperienceParams): Promise<{ url: string } | null> => {
    // Validate required fields
    if (!isAuthenticated && (!email || !email.trim())) {
      setError('Please enter your email');
      return null;
    }

    if (!participantName.trim()) {
      setError('Please enter your name');
      return null;
    }

    if (!code?.trim()) {
      setError('Missing experience code');
      return null;
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
      return null;
    }

    if (response.type === 'error') {
      setError(response.error || 'Registration failed');
      return null;
    }

    // Success - store JWT and hand back the destination for the ticket animation
    qaLogger(`Successfully regsitered participant. Storing JWT`);
    setParticipantJWT(response.jwt);
    return { url: response.url };
  };

  return {
    registerExperience,
    isLoading,
    error,
    setError,
  };
}
