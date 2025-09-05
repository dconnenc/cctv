import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function SessionView() {
  const params = useParams();
  const rawKey = decodeURIComponent(params.sessionKey || '');
  const { isValid, displayKey } = useMemo(() => {
    const trimmed = (rawKey || '').trim();
    return { isValid: trimmed.length > 0, displayKey: trimmed };
  }, [rawKey]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startUrl, setStartUrl] = useState<string | null>(null);

  const fetchSession = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`/api/lobby/${encodeURIComponent(displayKey)}`);
      const data = await resp.json();
      if (data.success) {
        setStartUrl(data.session.start_url || null);
      } else {
        setError(data.error || 'Failed to load session');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isValid) fetchSession();
  }, [isValid, displayKey]);

  return (
    <section className="page flex-centered">
      <h1 style={{ marginBottom: '0.5rem' }}>{displayKey || 'Session'}</h1>
      {loading ? (
        <p style={{ opacity: 0.85 }}>Preparing session…</p>
      ) : error ? (
        <>
          <p style={{ color: 'var(--yellow)' }}>{error}</p>
          <Link
            to={`/lobby/${encodeURIComponent(displayKey)}`}
            className="link"
            style={{ marginTop: '1rem' }}
          >
            Back to lobby
          </Link>
        </>
      ) : (
        <>
          <p style={{ marginBottom: '1rem', opacity: 0.85 }}>Session has started.</p>
          <button
            className="join-submit"
            disabled={!startUrl}
            onClick={() => startUrl && window.open(startUrl, '_blank', 'noopener,noreferrer')}
          >
            {startUrl ? 'Open Link' : 'Waiting for link…'}
          </button>
          <p style={{ marginTop: '1rem' }}>
            <Link to={`/lobby/${encodeURIComponent(displayKey)}`} className="link">
              Return to lobby
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
