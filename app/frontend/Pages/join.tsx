import { useState } from 'react';

export default function Join() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Please enter a session code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to the lobby URL
        window.location.href = data.lobby_url;
      } else {
        setError(data.error || 'Failed to join session');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Join session error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setCode(e.target.value);
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
      <p className="hero-subtitle">Enter the secret code:</p>

      <form onSubmit={handleSubmit}>
        <input
          className="join-input"
          type="text"
          placeholder="Secret Code"
          value={code}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          maxLength={50}
        />

        {error && (
          <p className="error-message" style={{ color: 'red', marginTop: '8px' }}>
            {error}
          </p>
        )}

        <button className="join-submit" type="submit" disabled={isLoading || !code.trim()}>
          {isLoading ? 'Joining...' : 'Submit'}
        </button>
      </form>
    </section>
  );
}
