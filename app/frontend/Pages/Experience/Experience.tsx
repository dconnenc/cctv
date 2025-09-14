import { useEffect, useMemo, useState } from 'react';

import { Link, useParams, useNavigate } from 'react-router-dom';

import styles from './Experience.module.scss';

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
        <h1 className={styles.title}>{code || 'Experience'}</h1>
        <p className={styles.subtitle}>Preparing experience…</p>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || 'Experience'}</h1>
        <p className={styles.error}>{error}</p>
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
            <p className={styles.invalidCode}>Invalid code</p>
            <Link className={styles.link} to="/join">
              Enter a code
            </Link>
          </>
        ) : (
          // User is authenticated and in lobby
          <>
            <h1 className={styles.title}>{code}</h1>
            <p className={styles.participantsCount}>
              Participants: {participants.length}
              {isPolling && <span className={styles.loadingSpinner}>🔄</span>}
            </p>

            {/* Participants List */}
            <div className={styles.participantsContainer}>
              <h4 className={styles.participantsTitle}>
                Players in Lobby:
              </h4>
              {participants.length > 0 ? (
                <ul className={styles.participantsList}>
                  {participants.map((participant) => (
                    <li
                      key={participant.id}
                      className={styles.participantItem}
                    >
                      <span
                        className={`${styles.participantName} ${
                          participant.id === user?.id ? styles.currentUser : ''
                        }`}
                      >
                        {participant.name || participant.email}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.loadingParticipants}>
                  Loading participants...
                </p>
              )}
            </div>

            <p className={styles.waitingMessage}>
              Waiting for the experience to start...
            </p>
          </>
        )}
      </section>
    );
  }

  return null;
}
