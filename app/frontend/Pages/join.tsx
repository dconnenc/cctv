import { ChangeEvent, FormEvent, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Button } from '@cctv/core';
import { useGet } from '@cctv/hooks';
import { useJoinExperience } from '@cctv/hooks/useJoinExperience';

import styles from './Join.module.scss';

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
  const [code, setCode] = useState('');

  const slugFromUrl = searchParams.get('code');

  const { data: registrationInfo } = useGet<RegistrationInfoResponse>({
    url: `/api/experiences/${slugFromUrl}/registration_info`,
    enabled: !!slugFromUrl,
  });

  const { joinExperience, isLoading, error, setError } = useJoinExperience();

  const actualCode = code || registrationInfo?.experience?.code || '';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await joinExperience(actualCode);
  };

  const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
    if (error) {
      setError('');
    }
  };

  return (
    <section className="page flex-centered">
      <div className={styles.header}>
        {registrationInfo?.experience?.name && <p>{registrationInfo.experience.name}</p>}
        <p>Enter the secret code:</p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Secret Code"
          value={actualCode}
          onChange={handleCodeChange}
          disabled={isLoading}
          maxLength={50}
        />
        {error && <p className={`error-message ${styles.error}`}>{error}</p>}
        <Button
          className="join-submit"
          type="submit"
          loading={isLoading}
          loadingText="Joining..."
          disabled={!actualCode.trim()}
        >
          Submit
        </Button>
      </form>
    </section>
  );
}
