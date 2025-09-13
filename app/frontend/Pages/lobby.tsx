import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function Lobby() {
  const params = useParams();
  const navigate = useNavigate();
  const rawKey = decodeURIComponent(params.code || '');

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingFingerprint, setIsCheckingFingerprint] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [experienceInfo, setExperienceInfo] = useState(null);
  const [participants, setParticipants] = useState<any>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [glitchingElement, setGlitchingElement] = useState(null);

  const { isValid, displayKey } = useMemo(() => {
    const trimmed = (rawKey || '').trim();
    return {
      isValid: trimmed.length > 0,
      displayKey: trimmed,
    };
  }, [rawKey]);

  const handleStartExperience = () => {
    const url =
      'https://docs.google.com/presentation/d/1Cv8YG-nTIzXVwxRExVGRTUObtDVuyP2f8FArsWVlPGs/edit?usp=sharing';
    fetch(`/api/lobby/${encodeURIComponent(displayKey)}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then(() => fetchExperienceInfo())
      .catch(() => {});
  };

  // Fetch experience info and participants
  const fetchExperienceInfo = async () => {
    if (!isValid) return;

    setIsPolling(true);
    try {
      const response = await fetch(`/api/experiences/${encodeURIComponent(displayKey)}`);
      const data = await response.json();

      if (data.success) {
        setExperienceInfo(data.experience);
        setParticipants(data.experience.participants || []);
      }
    } catch (err) {
      console.error('Error fetching experience info:', err);
    } finally {
      setIsPolling(false);
    }
  };

  // Set up polling for experience updates
  useEffect(() => {
    if (!isValid || !user) return;

    // Fetch immediately when user joins
    fetchExperienceInfo();

    // Set up polling every 3 seconds
    const interval = setInterval(fetchExperienceInfo, 3000);

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
            name: name.trim(),
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setExperienceInfo(data.experience);
        setParticipants(data.experience.participants || []);
      } else {
        setError(data.errors ? data.errors.join(', ') : data.error || 'Failed to join experience');
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
        <p style={{ opacity: 0.85 }}>Checking if you've already joined...</p>
      </section>
    );
  }

  return (
    <section className="page flex-centered">
      {!isValid ? (
        <>
          <p style={{ color: 'var(--yellow)', marginBottom: '0.75rem' }}></p>
          <Link className="link" to="/join">
            Enter a code
          </Link>
        </>
      ) : user ? (
        // User has successfully joined
        <>
          <h1
            className={glitchingElement === 'experience-key' ? 'glitch' : ''}
            style={{ marginBottom: '0.5rem' }}
          >
            {displayKey}
          </h1>
          <p style={{ marginBottom: '1rem', opacity: 0.85 }}>
            <span className={glitchingElement === 'participants-count' ? 'glitch' : ''}>
              Participants: {participants.length}
            </span>
            {isPolling && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>🔄</span>}
          </p>

          {/* Participants List */}
          <div
            style={{
              width: '100%',
              maxWidth: '300px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <h4
              className={glitchingElement === 'players-header' ? 'glitch' : ''}
              style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', opacity: 0.9 }}
            >
              Players in Lobby:
            </h4>
            {participants.length > 0 ? (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                {participants.map((participant) => (
                  <li
                    key={participant.id}
                    style={{
                      padding: '0.5rem 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    <span
                      className={
                        glitchingElement === `participant-${participant.id}` ? 'glitch' : ''
                      }
                      style={{
                        fontWeight: participant.id === user.id ? 600 : 400,
                        color: participant.id === user.id ? 'var(--green)' : 'inherit',
                      }}
                    >
                      {participant.name}
                    </span>
                    {user?.name === 'dillon c' && participant.name === 'dillon c' && (
                      <button
                        type="button"
                        onClick={handleStartExperience}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.35)',
                          color: 'inherit',
                          borderRadius: '4px',
                          padding: '0.2rem 0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        Start Experience
                      </button>
                    )}
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
            {displayKey}
          </p>

          <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '300px' }}>
            <p style={{ marginBottom: '0.75rem', opacity: 0.85 }}>Enter your name to join:</p>

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
              <p style={{ color: 'red', marginBottom: '0.75rem', fontSize: '0.9rem' }}>{error}</p>
            )}

            <button className="join-submit" type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Joining...' : 'Join'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
