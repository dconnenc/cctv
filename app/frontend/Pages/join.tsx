import { FormEvent, useId } from 'react';

import { TextInput } from '@cctv/core';
import { usePost } from '@cctv/hooks';
import { ExperienceCreateResponse } from '@cctv/types';
import { getFormData } from '@cctv/utils';

export default function Join() {
  const id = useId();
  const { post, isLoading, error, setError } = usePost<ExperienceCreateResponse>({
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
        code: code.trim().toUpperCase(),
      }),
    );

    if (response?.success) {
      window.location.href = response.lobby_url;
    } else {
      setError(response?.error || 'Failed to join experience');
    }
  };

  return (
    <section className="page flex-centered">
      <label htmlFor={id} className="hero-subtitle">
        Enter the secret code:
      </label>

      <form onSubmit={handleSubmit}>
        <TextInput id={id} name="code" disabled={isLoading} maxLength={50} />

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
