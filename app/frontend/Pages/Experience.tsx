import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function Experience() {
  const params = useParams();
  const rawKey = decodeURIComponent(params.code || '');
  const { isValid, code } = useMemo(() => {
    const trimmed = (rawKey || '').trim();
    return { isValid: trimmed.length > 0, code: trimmed };
  }, [rawKey]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startUrl, setStartUrl] = useState<string | null>(null);

  const fetchExperience = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`/api/lobby/${encodeURIComponent(code)}`);
      const data = await resp.json();
      if (data.success) {
        setStartUrl(data.experience.start_url || null);
      } else {
        setError(data.error || 'Failed to load experience');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isValid) fetchExperience();
  }, [isValid, code]);

  return (
    <section className="page flex-centered">
      <h1 style={{ marginBottom: '0.5rem' }}>{code || 'Experience'}</h1>
      {loading ? (
        <p style={{ opacity: 0.85 }}>Preparing experience…</p>
      ) : error ? (
        <>
          <p style={{ color: 'var(--yellow)' }}>{error}</p>
          <Link
            to={`/lobby/${encodeURIComponent(code)}`}
            className="link"
            style={{ marginTop: '1rem' }}
          >
            Back to lobby
          </Link>
        </>
      ) : (
        <>
          <p style={{ marginBottom: '1rem', opacity: 0.85 }}>Experience has started.</p>
          <button
            className="join-submit"
            disabled={!startUrl}
            onClick={() => startUrl && window.open(startUrl, '_blank', 'noopener,noreferrer')}
          >
            {startUrl ? 'Open Link' : 'Waiting for link…'}
          </button>
          <p style={{ marginTop: '1rem' }}>
            <Link to={`/lobby/${encodeURIComponent(code)}`} className="link">
              Return to lobby
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
