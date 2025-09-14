import { useEffect, useMemo, useState } from 'react';

import { Link, useParams, useNavigate } from 'react-router-dom';

export default function Experience() {
  const params = useParams();
  const navigate = useNavigate();
  const rawKey = decodeURIComponent(params.code || '');

  const { isValid, code } = useMemo(() => {
    const trimmed = (rawKey || '').trim();
    return { isValid: trimmed.length > 0, code: trimmed };
  }, [rawKey]);

  // State for different experience phases
  const [experienceState, setExperienceState] = useState('loading'); // 'loading', 'lobby', 'active'
  const [user, setUser] = useState(null);
  const [experienceInfo, setExperienceInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState('');
  const [startUrl, setStartUrl] = useState(null);

  // Check authentication and load experience
  useEffect(() => {
    if (!isValid) return;

    const jwt = localStorage.getItem('experience_jwt');
    if (!jwt) {
      // No JWT, redirect to join flow
      navigate(`/join?code=${code}`);
      return;
    }

    loadExperience();
  }, [code, navigate, isValid]);

  // Set up polling when in lobby state
  useEffect(() => {
    if (experienceState === 'lobby') {
      const interval = setInterval(loadExperience, 3000);
      return () => clearInterval(interval);
    }
  }, [experienceState]);

  const loadExperience = async () => {
    if (!isValid) return;

    const jwt = localStorage.getItem('experience_jwt');
    if (!jwt) {
      navigate(`/join?code=${code}`);
      return;
    }

    setIsPolling(true);
    try {
      const response = await fetch(`/api/experiences/${encodeURIComponent(code)}`, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setExperienceInfo(data.experience);
        setParticipants(data.experience.participants || []);

        setExperienceState('lobby');
        setError('');
      } else {
        setError(data.error || 'Failed to load experience');
        // If unauthorized, redirect to join
        if (response.status === 401) {
          localStorage.removeItem('experience_jwt');
          navigate(`/join?code=${code}`);
        }
      }
    } catch (err) {
      console.error('Error loading experience:', err);
      setError('Network error');
    } finally {
      setIsPolling(false);
    }
  };

  // Loading state
  if (experienceState === 'loading') {
    return (
      <section className="page flex-centered">
        <h1 style={{ marginBottom: '0.5rem' }}>{code || 'Experience'}</h1>
        <p style={{ opacity: 0.85 }}>Preparing experience…</p>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="page flex-centered">
        <h1 style={{ marginBottom: '0.5rem' }}>{code || 'Experience'}</h1>
        <p style={{ color: 'var(--yellow)', marginBottom: '1rem' }}>{error}</p>
        <button onClick={() => navigate('/join')} className="join-submit">
          Try Again
        </button>
      </section>
    );
  }

  // Lobby state (default state - waiting for experience to start)
  if (experienceState === 'lobby') {
    return (
      <section className="page flex-centered">
        {!isValid ? (
          <>
            <p style={{ color: 'var(--yellow)', marginBottom: '0.75rem' }}>Invalid code</p>
            <Link className="link" to="/join">
              Enter a code
            </Link>
          </>
        ) : (
          // User is authenticated and in lobby
          <>
            <h1 style={{ marginBottom: '0.5rem' }}>{code}</h1>
            <p style={{ marginBottom: '1rem', opacity: 0.85 }}>
              Participants: {participants.length}
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
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', opacity: 0.9 }}>
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
                        style={{
                          fontWeight: participant.id === user?.id ? 600 : 400,
                          color: participant.id === user?.id ? 'var(--green)' : 'inherit',
                        }}
                      >
                        {participant.name || participant.email}
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
              Waiting for the experience to start...
            </p>
          </>
        )}
      </section>
    );
  }

  return null;
}
