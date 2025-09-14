import { FormEvent, useId, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { TextInput } from '@cctv/core';
import { usePost } from '@cctv/hooks';
import { ExperienceJoinResponse } from '@cctv/types';
import { getFormData } from '@cctv/utils';
import { qaLogger } from '@cctv/utils';

export default function Join() {
  const [searchParams] = useSearchParams();

  // Check for prefilled code from QR code or URL params
  const code = useMemo(() => {
    const prefilledCode = searchParams.get('code');
    if (prefilledCode) {
      return prefilledCode.toUpperCase();
    }
  }, [searchParams]);

  const id = useId();
  const { post, isLoading, error, setError } = usePost<ExperienceJoinResponse>({
    url: '/api/experiences/join',
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = getFormData<{ code?: string }>(e.currentTarget);
    const code = formData.code;

    if (!code || code.trim() === '') {
      setError('Please enter a code');
      return;
    }

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
    }

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

  return (
    <section className="page flex-centered">
      <label htmlFor={id} className="hero-subtitle">
        Enter the secret code:
      </label>

      <form onSubmit={handleSubmit}>
        <TextInput defaultValue={code} id={id} name="code" disabled={isLoading} maxLength={50} />

        {error && (
          <p className="error-message" style={{ color: 'red', marginTop: '8px' }}>
            {error}
          </p>
        )}

        <button className="join-submit" type="submit" disabled={isLoading}>
          {isLoading ? 'Joining...' : 'Submit'}
        </button>
      </form>
    </section>
  );
}
