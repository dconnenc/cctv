import { FormEvent, useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { Button, ImageUpload, Panel, TextInput } from '@cctv/core';
import { usePerformer } from '@cctv/hooks';

import styles from './Performers.module.scss';

export default function EditPerformer() {
  const { slug } = useParams<{ slug: string }>();
  const { performer, isLoading: loadingPerformer } = usePerformer(slug ?? '');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileSelected = (file: File) => {
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemove = () => {
    setPhoto(null);
    setPreviewUrl(null);
  };

  const displayedImageUrl = previewUrl ?? performer?.photo_url ?? null;

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
    if (photo) formData.append('photo', photo);

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
              <TextInput
                label="Bio"
                name="bio"
                multiline
                placeholder="Tell us about yourself..."
                defaultValue={performer.bio ?? ''}
              />
            </div>
            <ImageUpload
              label="Profile Photo"
              shape="circle"
              previewSize="6rem"
              imageUrl={displayedImageUrl}
              onFileSelected={handleFileSelected}
              onRemove={previewUrl ? handleRemove : undefined}
              uploadButtonLabel="Upload photo"
              changeButtonLabel="Change photo"
            />
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
