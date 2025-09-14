import { FormEvent, useId, useEffect } from 'react';

import { TextInput } from '@cctv/core';
import { usePost } from '@cctv/hooks';
import { ExperienceCreateResponse } from '@cctv/types';
import { getFormData } from '@cctv/utils';
import { useSearchParams } from 'react-router-dom'
import { qaLogger } from '@cctv/utils'

export default function Join() {
  const [searchParams] = useSearchParams()

  // Check for prefilled code from QR code or URL params
  useEffect(() => {
    const prefilledCode = searchParams.get('code')
    if (prefilledCode) {
      setCode(prefilledCode.toUpperCase())
    }
  }, [searchParams])

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
        code: code.trim(),
      }),
    );

    if (response.error === undefined) {
      if (response.status === 'registered') {
        // User is already registered - store JWT and redirect to experience
        qaLogger(`User already registrated, redirecting to: ${response.url}`)

        localStorage.setItem('experience_jwt', response.jwt)
        window.location.href = response.url
      } else if (response.status === 'needs_registration') {
        // User needs to register - redirect to registration page
        qaLogger(`User needs registration, redirecting to: ${response.url}`)

        console.log("User needs registration")
        window.location.href = response.url
      }
    } else {
      setError(response.error || 'Failed to join experience')
    }
  }

  const handleInputChange = (e) => {
    setCode(e.target.value)
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

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
  )
}
