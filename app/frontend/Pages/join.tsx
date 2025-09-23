import { FormEvent, useId, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { TextInput } from '@cctv/core';
import { useJoinExperience } from '@cctv/hooks/useJoinExperience';
import { getFormData } from '@cctv/utils';

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
  const { joinExperience, isLoading, error } = useJoinExperience();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = getFormData<{ code?: string }>(e.currentTarget);
    const code = formData.code;

    await joinExperience(code || '');
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
