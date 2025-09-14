import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

import { Link, useParams } from 'react-router-dom';

import { startGlitchCycle } from '@cctv/components';
import { ExperienceContainer } from '@cctv/experiences';
import { Experience, Participant } from '@cctv/types';

import {
  MOCK_MULTISTEP_FORM_EXPERIENCE,
  MOCK_POLL_EXPERIENCE,
  MOCK_QUESTION_EXPERIENCE,
} from '../mocks';
import { generateFingerprint } from '../utils';

export default function Lobby() {
  const params = useParams();
  const rawKey = decodeURIComponent(params.code || '');

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingFingerprint, setIsCheckingFingerprint] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<Participant>();
  const [experienceInfo, setExperienceInfo] = useState();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [glitchingElement, setGlitchingElement] = useState<string>();
  const [experience, setExperience] = useState<Experience>();

  const fingerprint = useMemo(() => generateFingerprint(), []);

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

    const timeout = startGlitchCycle(participants, setGlitchingElement);

    // Cleanup on unmount
    return () => clearTimeout(timeout);
  }, [user, participants]);

  // Check if fingerprint already exists in experience
  const checkExistingFingerprint = async () => {
    if (!isValid) return;

    setIsCheckingFingerprint(true);
    try {
      const response = await fetch(
        `/api/lobby/${encodeURIComponent(displayKey)}/check_fingerprint`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fingerprint: fingerprint,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // User already exists in experience, auto-join
        setUser(data.user);
        setExperienceInfo(data.experience);
      }
      // If not successful, user needs to enter name (normal flow)
    } catch (err) {
      console.error('Error checking fingerprint:', err);
      // Continue with normal flow if fingerprint check fails
    } finally {
      setIsCheckingFingerprint(false);
    }
  };

  const handleStartExperience = () => {
    // Cam - Added this to test specific experiences
    setExperience(MOCK_MULTISTEP_FORM_EXPERIENCE);

    return;

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

    try {
      const response = await fetch(`/api/lobby/${encodeURIComponent(displayKey)}`);
      const data = await response.json();

      if (data.success) {
        setExperienceInfo(data.experience);
        setParticipants(data.experience.participants || []);
      }
    } catch (err) {
      console.error('Error fetching experience info:', err);
    }
  };

  // Check fingerprint on component mount
  useEffect(() => {
    if (isValid) {
      checkExistingFingerprint();
    }
  }, [isValid, displayKey, fingerprint]);

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

  // Redirect everyone to the start URL once started
  useEffect(() => {
    const info: any = experienceInfo as any;
    if (info && info.started && info.start_url) {
      window.location.href = info.start_url as string;
    }
  }, [experienceInfo]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
          fingerprint: fingerprint,
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) {
      setError('');
    }
  };

  if (experience && user) {
    return <ExperienceContainer experience={experience} user={user} />;
  }

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
                    {/* First person to join is whoever created */}
                    {participants?.at(0)?.id === user?.id && (
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
