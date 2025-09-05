import { useState } from 'react';

export default function Admin() {
  const [key, setKey] = useState<string>('');
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);

    const formData = new FormData(e.currentTarget);
    const raw = (formData.get('session-key') as string | null)?.trim() || '';
    if (!raw) {
      setError('Please enter a session key.');
      setKey('');
      setQrSrc(null);
      return;
    }

    setKey(raw);

    const lobbyUrl = `${window.location.origin}/lobby/${encodeURIComponent(raw)}`;
    const imgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      lobbyUrl,
    )}`;
    setQrSrc(imgUrl);
  };

  return (
    <section className="page flex-centered">
      <h3 style={{ marginBottom: '2rem' }}>{'admin portal'}</h3>
      <form action="" className="admin-form" onSubmit={handleSubmit}>
        <label style={{ display: 'block' }} htmlFor="session-key">
          {'generate new secret key:'}
        </label>
        <input
          style={{ marginRight: '.5rem' }}
          name="session-key"
          id="session-key"
          placeholder="Set Session Key"
        />
        <input type="submit" value="submit" />
      </form>

      {error && (
        <p role="alert" style={{ marginTop: '8px', color: 'var(--yellow)' }}>
          {error}
        </p>
      )}

      {key && (
        <div
          style={{
            marginTop: '20px',
            border: '2px solid white',
            padding: '10px',
            borderRadius: '8px',
          }}
        >
          <p style={{ marginBottom: '12px' }}>{key}</p>
          {qrSrc && (
            <div style={{ display: 'grid', placeItems: 'center', gap: 8 }}>
              <img
                src={qrSrc}
                alt={`QR code for /lobby/${key}`}
                width={220}
                height={220}
                style={{ borderRadius: 6 }}
              />
              <a
                href={`/lobby/${encodeURIComponent(key)}`}
                className="link"
                style={{ fontSize: 16 }}
              >
                {`go to lobby`}
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
