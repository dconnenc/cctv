import { FormEvent, useState } from 'react';

import styles from './Create.module.scss';

/** Form page for creating a new experience */
export default function Create() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = formData.get('experience-code');
    const name = formData.get('experience-name');

    if (!code || typeof code !== 'string' || code.trim() === '') {
      setError('Please enter a code');
      return;
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      setError('Please enter a name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/experiences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to the lobby URL
        window.location.href = data.lobby_url;
      } else {
        setError(data.error || 'Failed to join experiences');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Create experiences error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="page flex-centered">
      <h1>{'Create'}</h1>
      <form className={styles.form} onSubmit={handleCreate}>
        {isLoading && <p>Creating...</p>}
        <input name="experience-name" type="text" placeholder="Name" />
        <input name="experience-code" type="text" placeholder="Code" />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit">Create</button>
      </form>
    </section>
  );
}
