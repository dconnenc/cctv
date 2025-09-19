import { usePost } from './usePost';

interface ExperienceRegisterResponse {
  jwt: string;
  url: string;
  error?: string;
}

interface RegisterExperienceParams {
  email: string;
  name?: string;
}

export function useRegisterExperience(id: string) {
  const { post, isLoading, error, setError } = usePost<ExperienceRegisterResponse>({
    url: `/api/experiences/${id}/register`,
  });

  const registerExperience = async ({ email, name }: RegisterExperienceParams) => {
    // Validate required fields
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!id?.trim()) {
      setError('Missing experience code');
      return;
    }

    // Make the API request
    const response = await post(
      JSON.stringify({
        email: email.trim(),
        name: name?.trim() || '',
        code: id,
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
    localStorage.setItem('experience_jwt', response.jwt);
    window.location.href = response.url;
  };

  return {
    registerExperience,
    isLoading,
    error,
    setError,
  };
}
