import { FormEvent, useRef, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { Button, Panel, TextInput } from '@cctv/core';
import { usePerformer } from '@cctv/hooks';

import styles from './Performers.module.scss';

export default function EditPerformer() {
  const { slug } = useParams<{ slug: string }>();
  const { performer, isLoading: loadingPerformer } = usePerformer(slug ?? '');
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
    formData.append('bio', bio);

    const photoFiles = photoRef.current?.files;
    if (photoFiles && photoFiles.length > 0) {
      formData.append('photo', photoFiles[0]);
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/performers/${slug}`, {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        navigate(`/performers/${data.performer.slug}`);
      } else {
        setError(data.error || data.message || 'Failed to update profile');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingPerformer) {
    return (
      <section className="page flex-centered">
        <div>Loading...</div>
      </section>
    );
  }

  if (!performer) {
    return (
      <section className="page flex-centered">
        <div>Performer not found</div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className={styles.formContainer}>
        <Panel className={styles.formPanel}>
          <h1 className={styles.formTitle}>Edit Profile</h1>
          <form className={styles.form} onSubmit={handleSubmit}>
            <TextInput label="Name" name="name" type="text" defaultValue={performer.name} />
            <div>
              <label className={styles.photoLabel}>Bio</label>
              <textarea
                name="bio"
                className={styles.textarea}
                defaultValue={performer.bio ?? ''}
                placeholder="Tell us about yourself..."
              />
            </div>
            {performer.photo_url && (
              <img src={performer.photo_url} alt="Current photo" className={styles.photoPreview} />
            )}
            <div className={styles.photoUpload}>
              <label className={styles.photoLabel}>Update Photo</label>
              <input ref={photoRef} type="file" accept="image/*" />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" loading={isLoading} loadingText="Saving...">
              Save Changes
            </Button>
          </form>
        </Panel>
      </div>
    </section>
  );
}
