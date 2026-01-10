import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import { useUser } from '@cctv/contexts';
import { Button } from '@cctv/core';
import { useGet, useRegisterExperience } from '@cctv/hooks';

import styles from './Register.module.scss';

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

export default function Register() {
  const [email, setEmail] = useState('');
  const [participantName, setParticipantName] = useState('');
  const { code: slug } = useParams<{ code: string }>();
  const { user, isAuthenticated } = useUser();

  const { data: registrationInfo } = useGet<RegistrationInfoResponse>({
    url: `/api/experiences/${slug}/registration_info`,
    enabled: !!slug,
  });

  const { registerExperience, isLoading, error, setError } = useRegisterExperience();

  useEffect(() => {
    if (user?.most_recent_participant_name) {
      setParticipantName(user.most_recent_participant_name);
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await registerExperience({ email, participantName, isAuthenticated });
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) {
      setError('');
    }
  };

  const handleParticipantNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setParticipantName(e.target.value);
    if (error) {
      setError('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <section className="page flex-centered">
      {registrationInfo?.experience?.name && (
        <p style={{ marginBottom: '10px', opacity: 0.9, fontWeight: 500 }}>
          {registrationInfo.experience.name}
        </p>
      )}
      {registrationInfo?.experience?.code && (
        <p style={{ marginBottom: '20px', opacity: 0.8 }}>
          Code: {registrationInfo.experience.code}
        </p>
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        {!isAuthenticated && (
          <input
            className={styles.input}
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={handleEmailChange}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            maxLength={100}
          />
        )}
        <input
          className={styles.input}
          type="text"
          placeholder="Your Name"
          value={participantName}
          onChange={handleParticipantNameChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          maxLength={100}
        />
        {error && <p className={`error-message ${styles.errorMessage}`}>{error}</p>}
        <Button
          className="join-submit"
          type="submit"
          loading={isLoading}
          loadingText="Registering..."
          disabled={
            isAuthenticated ? !participantName.trim() : !email.trim() || !participantName.trim()
          }
        >
          Register
        </Button>
      </form>
    </section>
  );
}
