import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import { useUser } from '@cctv/contexts/UserContext';
import { Button } from '@cctv/core/Button/Button';
import { useGet } from '@cctv/hooks/useGet';
import { useRegisterExperience } from '@cctv/hooks/useRegisterExperience';

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

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
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
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="page flex-centered">
      <div className={styles.header}>
        {registrationInfo?.experience?.name && <p>{registrationInfo.experience.name}</p>}
        {registrationInfo?.experience?.code && <p>Code: {registrationInfo.experience.code}</p>}
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        {!isAuthenticated && (
          <>
            <label htmlFor="register-email" className="sr-only">
              Your email
            </label>
            <input
              id="register-email"
              className={styles.input}
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={handleEmailChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              maxLength={100}
            />
          </>
        )}
        <label htmlFor="register-name" className="sr-only">
          Your name
        </label>
        <input
          id="register-name"
          className={styles.input}
          type="text"
          placeholder="Your Name"
          value={participantName}
          onChange={handleParticipantNameChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          maxLength={100}
        />
        {error && (
          <p className={`error-message ${styles.error}`} role="alert" aria-live="polite">
            {error}
          </p>
        )}
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
