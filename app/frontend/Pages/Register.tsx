import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { code } = useParams()

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!code.trim()) {
      setError('Missing experience code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/experiences/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          code: code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT and redirect to experience
        localStorage.setItem('experience_jwt', data.jwt);
        window.location.href = data.url;
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
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
