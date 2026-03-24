import { FormEvent, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Button, Panel, TextInput } from '@cctv/core';

import styles from './Performers.module.scss';

export default function CreatePerformer() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const photoRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);

    const form = e.currentTarget;
    const formData = new FormData();

    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const bio = (form.elements.namedItem('bio') as HTMLTextAreaElement).value.trim();

    if (!name) {
      setError('Name is required');
      return;
    }

    formData.append('name', name);
    if (bio) formData.append('bio', bio);

    const photoFiles = photoRef.current?.files;
    if (photoFiles && photoFiles.length > 0) {
      formData.append('photo', photoFiles[0]);
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/performers', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        navigate(`/performers/${data.performer.slug}`);
      } else {
        setError(data.error || data.message || 'Failed to create profile');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="page">
      <div className={styles.formContainer}>
        <Panel className={styles.formPanel}>
          <h1 className={styles.formTitle}>Become a Performer</h1>
          <form className={styles.form} onSubmit={handleSubmit}>
            <TextInput label="Name" name="name" type="text" />
            <div>
              <label className={styles.photoLabel}>Bio</label>
              <textarea
                name="bio"
                className={styles.textarea}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className={styles.photoUpload}>
              <label className={styles.photoLabel}>Profile Photo</label>
              <input ref={photoRef} type="file" accept="image/*" />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" loading={isLoading} loadingText="Creating...">
              Create Profile
            </Button>
          </form>
        </Panel>
      </div>
    </section>
  );
}
