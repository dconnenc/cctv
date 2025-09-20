import { usePost } from '@cctv/hooks/usePost';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { qaLogger } from '@cctv/utils';

interface ExperienceRegisterResponse {
  jwt: string;
  url: string;
  error?: string;
}

interface RegisterExperienceParams {
  email: string;
  name?: string;
}

export function useRegisterExperience() {
  const { code, setJWT } = useExperience();
  const { post, isLoading, error, setError } = usePost<ExperienceRegisterResponse>({
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

    qaLogger(
      `Attempting to regsiter participant: ${name}:${email} to ${code}`
    )

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

    if (response.error) {
      setError(response.error || 'Registration failed');
      return;
    }

    // Success - store JWT and redirect to experience
    qaLogger(
      `Successfully regsitered participant. Storing JWT and redirecting to experience`
    )
    setJWT(response.jwt);
    window.location.href = response.url;
  };

  return {
    registerExperience,
    isLoading,
    error,
    setError,
  };
}
