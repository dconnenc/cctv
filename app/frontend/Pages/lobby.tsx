import { useMemo, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function Lobby() {
  const params = useParams();
  const rawKey = decodeURIComponent(params.sessionKey || '');

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isPolling, setIsPolling] = useState(false);

  const { isValid, displayKey } = useMemo(() => {
    const trimmed = (rawKey || '').trim();
    return {
      isValid: trimmed.length > 0,
      displayKey: trimmed,
    };
  }, [rawKey]);

  // Fetch session info and participants
  const fetchSessionInfo = async () => {
    if (!isValid) return;

    setIsPolling(true);
    try {
      const response = await fetch(`/api/lobby/${encodeURIComponent(displayKey)}`);
      const data = await response.json();

      if (data.success) {
        setSessionInfo(data.session);
        setParticipants(data.session.participants || []);
      }
    } catch (err) {
      console.error('Error fetching session info:', err);
    } finally {
      setIsPolling(false);
    }
  };

  // Set up polling for session updates
  useEffect(() => {
    if (!isValid || !user) return;

    // Fetch immediately when user joins
    fetchSessionInfo();

    // Set up polling every 5 seconds
    const interval = setInterval(fetchSessionInfo, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [isValid, user, displayKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/lobby/${encodeURIComponent(displayKey)}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            name: name.trim()
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setSessionInfo(data.session);
        setParticipants(data.session.participants || []);
      } else {
        setError(data.errors ? data.errors.join(', ') : (data.error || 'Failed to join session'));
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Join lobby error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setName(e.target.value);
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
      <h3 style={{ marginBottom: '1rem' }}>Lobby</h3>

      {!isValid ? (
        <>
          <p style={{ color: 'var(--yellow)', marginBottom: '0.75rem' }}>
            Missing or invalid session key in the URL.
          </p>
          <Link className="link" to="/join">
            Enter a session key
          </Link>
        </>
      ) : user ? (
        // User has successfully joined
        <>
          <p className="hero-subtitle" style={{ marginBottom: '0.75rem' }}>
            Welcome, {user.name}!
          </p>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
            Session: {displayKey}
          </p>
          <p style={{ marginBottom: '1rem', opacity: 0.85 }}>
            Participants: {sessionInfo?.participant_count || participants.length}
            {isPolling && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>🔄</span>}
          </p>

          {/* Participants List */}
          <div style={{
            width: '100%',
            maxWidth: '300px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', opacity: 0.9 }}>
              Players in Lobby:
            </h4>
            {participants.length > 0 ? (
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {participants.map((participant) => (
                  <li
                    key={participant.id}
                    style={{
                      padding: '0.5rem 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{
                      marginRight: '0.5rem',
                      color: participant.id === user.id ? 'var(--green)' : 'inherit'
                    }}>
                      {participant.id === user.id ? '👑' : '👤'}
                    </span>
                    <span style={{
                      fontWeight: participant.id === user.id ? 600 : 400,
                      color: participant.id === user.id ? 'var(--green)' : 'inherit'
                    }}>
                      {participant.name}
                      {participant.id === user.id && ' (You)'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, opacity: 0.7, fontStyle: 'italic' }}>
                Loading participants...
              </p>
            )}
          </div>

          <p style={{ color: 'var(--green)', textAlign: 'center' }}>
            ✓ Successfully joined the session!
          </p>
          <p style={{ marginTop: '1rem', opacity: 0.75, fontSize: '0.9rem' }}>
            Waiting for the game to start...
          </p>
        </>
      ) : (
        // Name input form
        <>
          <p className="hero-subtitle" style={{ marginBottom: '0.75rem' }}>
            Session: {displayKey}
          </p>

          <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '300px' }}>
            <p style={{ marginBottom: '0.75rem', opacity: 0.85 }}>
              Enter your name to join:
            </p>

            <input
              className="join-input"
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              maxLength={255}
              style={{ marginBottom: '0.5rem' }}
            />

            {error && (
              <p style={{ color: 'red', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                {error}
              </p>
            )}

            <button
              className="join-submit"
              type="submit"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Joining...' : 'Join Session'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
