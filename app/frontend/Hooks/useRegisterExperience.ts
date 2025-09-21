import { useExperience } from '@cctv/contexts';
import { usePost } from '@cctv/hooks/usePost';
import { RegisterExperienceApiResponse } from '@cctv/types';
import { qaLogger } from '@cctv/utils';

interface RegisterExperienceParams {
  email: string;
  name?: string;
}

export function useRegisterExperience() {
  const { code, setJWT } = useExperience();
  const { post, isLoading, error, setError } = usePost<RegisterExperienceApiResponse>({
    url: `/api/experiences/${code}/register`,
  });

  const registerExperience = async ({ email, name }: RegisterExperienceParams) => {
    // Validate required fields
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!code?.trim()) {
      setError('Missing experience code');
      return;
    }

    qaLogger(`Attempting to regsiter participant: ${name}:${email} to ${code}`);

    const response = await post(
      JSON.stringify({
        email: email.trim(),
        name: name?.trim() || '',
        code: code,
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
