import { useMemo, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

// Generate a browser fingerprint
const generateFingerprint = () => {
  // Try to get existing fingerprint from localStorage
  const stored = localStorage.getItem('browser_fingerprint');
  if (stored) return stored;

  // Generate new fingerprint combining random ID with browser characteristics
  const randomId = 'fp_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  const browserInfo = [
    navigator.userAgent.slice(-50), // Last 50 chars to avoid being too long
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language
  ].join('|');

  const fingerprint = randomId + '_' + btoa(browserInfo).slice(0, 20);

  // Store for future use
  localStorage.setItem('browser_fingerprint', fingerprint);
  return fingerprint;
};

export default function Lobby() {
  const params = useParams();
  const rawKey = decodeURIComponent(params.sessionKey || '');

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingFingerprint, setIsCheckingFingerprint] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [fingerprint] = useState(() => generateFingerprint());
  const [glitchingElement, setGlitchingElement] = useState(null);

  const { isValid, displayKey } = useMemo(() => {
    const trimmed = (rawKey || '').trim();
    return {
      isValid: trimmed.length > 0,
      displayKey: trimmed,
    };
  }, [rawKey]);

  // Glitch effect management
  useEffect(() => {
    if (!user || participants.length === 0) return;

    const startGlitchCycle = () => {
      // Random interval between 20-60 seconds (20000-60000ms)
      const nextGlitchTime = Math.random() * 40000 + 20000;

      const glitchTimeout = setTimeout(() => {
        // Define all possible elements that can glitch
        const glitchableElements = [
          'session-key',
          'participants-count',
          'players-header'
        ];

        // Add participant elements if they exist
        if (participants.length > 0) {
          glitchableElements.push(`participant-${participants[Math.floor(Math.random() * participants.length)].id}`);
        }

        // Choose random element to glitch
        const randomElement = glitchableElements[Math.floor(Math.random() * glitchableElements.length)];
        setGlitchingElement(randomElement);

        // Remove glitch after 5 seconds and start next cycle
        setTimeout(() => {
          setGlitchingElement(null);
          startGlitchCycle(); // Schedule next glitch
        }, 5000);
      }, nextGlitchTime);

      return glitchTimeout;
    };

    const timeout = startGlitchCycle();

    // Cleanup on unmount
    return () => clearTimeout(timeout);
  }, [user, participants]);

  // Check if fingerprint already exists in session
  const checkExistingFingerprint = async () => {
    if (!isValid) return;

    setIsCheckingFingerprint(true);
    try {
      const response = await fetch(`/api/lobby/${encodeURIComponent(displayKey)}/check_fingerprint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fingerprint: fingerprint
        }),
      });

      const data = await response.json();

      if (data.success) {
        // User already exists in session, auto-join
        setUser(data.user);
        setSessionInfo(data.session);
      }
      // If not successful, user needs to enter name (normal flow)
    } catch (err) {
      console.error('Error checking fingerprint:', err);
      // Continue with normal flow if fingerprint check fails
    } finally {
      setIsCheckingFingerprint(false);
    }
  };

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

  // Check fingerprint on component mount
  useEffect(() => {
    if (isValid) {
      checkExistingFingerprint();
    }
  }, [isValid, displayKey, fingerprint]);

  // Set up polling for session updates
  useEffect(() => {
    if (!isValid || !user) return;

    // Fetch immediately when user joins
    fetchSessionInfo();

    // Set up polling every 3 seconds
    const interval = setInterval(fetchSessionInfo, 3000);

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
          },
          fingerprint: fingerprint
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

  // Show loading while checking fingerprint
  if (isCheckingFingerprint) {
    return (
      <section className="page flex-centered">
        <h3 style={{ marginBottom: '1rem' }}>Lobby</h3>
        <p style={{ opacity: 0.85 }}>Checking if you're already in this session...</p>
      </section>
    );
  }

  return (
    <section className="page flex-centered">
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
          <h1
            className={glitchingElement === 'session-key' ? 'glitch' : ''}
            style={{ marginBottom: '0.5rem' }}
          >
            {displayKey}
          </h1>
          <p style={{ marginBottom: '1rem', opacity: 0.85 }}>
            <span className={glitchingElement === 'participants-count' ? 'glitch' : ''}>
              Participants: {sessionInfo?.participant_count || participants.length}
            </span>
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
            <h4
              className={glitchingElement === 'players-header' ? 'glitch' : ''}
              style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', opacity: 0.9 }}
            >
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
                    <span
                      className={glitchingElement === `participant-${participant.id}` ? 'glitch' : ''}
                      style={{
                        fontWeight: participant.id === user.id ? 600 : 400,
                        color: participant.id === user.id ? 'var(--green)' : 'inherit'
                      }}
                    >
                      {participant.name}
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
