import { FormEvent, useId } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Button, TextInput } from '@cctv/core';
import { useGet } from '@cctv/hooks';
import { useJoinExperience } from '@cctv/hooks/useJoinExperience';
import { getFormData } from '@cctv/utils';

interface RegistrationInfoResponse {
  type: 'success' | 'error';
  experience?: {
    name: string;
    code: string;
    code_slug: string;
    description?: string;
    join_open: boolean;
  };
  error?: string;
}

export default function Join() {
  const [searchParams] = useSearchParams();

  // Get slug from URL query params (e.g., ?code=secret-code)
  const slugFromUrl = searchParams.get('code');

  // Fetch the actual experience code from the slug
  const { data: registrationInfo } = useGet<RegistrationInfoResponse>({
    url: `/api/experiences/${slugFromUrl}/registration_info`,
    enabled: !!slugFromUrl,
  });

  // Use the actual code from the API, not the slug
  const code = registrationInfo?.experience?.code;

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
        <Button className="join-submit" type="submit" loading={isLoading} loadingText="Joining...">
          Submit
        </Button>
      </form>
    </section>
  );
}
