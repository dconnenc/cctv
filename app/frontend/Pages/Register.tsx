import { ChangeEvent, FormEvent, KeyboardEvent, useState } from 'react';

import { useParams } from 'react-router-dom';

import { useRegisterExperience } from '@cctv/hooks';

export default function Register() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const { code } = useParams<{ code: string }>();

  const { registerExperience, isLoading, error, setError } = useRegisterExperience();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await registerExperience({ email, name });
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    // Clear error when user starts typing
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
      <p className="hero-subtitle">Register for Experience</p>
      <p style={{ marginBottom: '20px', opacity: 0.8 }}>Code: {code}</p>
      <form onSubmit={handleSubmit}>
        <input
          className="join-input"
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={handleEmailChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          maxLength={100}
          style={{ marginBottom: '0.5rem' }}
        />
        <input
          className="join-input"
          type="text"
          placeholder="Your Name (optional)"
          value={name}
          onChange={handleNameChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          maxLength={100}
        />
        {error && (
          <p className="error-message" style={{ color: 'red', marginTop: '8px' }}>
            {error}
          </p>
        )}
        <button className="join-submit" type="submit" disabled={isLoading || !email.trim()}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </section>
  );
}
