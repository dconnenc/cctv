import { FormEvent, useMemo, useRef, useState } from 'react';

import { Button, Panel, TextInput } from '@cctv/core';
import { usePost } from '@cctv/hooks';
import { CreateExperienceApiResponse } from '@cctv/types';
import { addSessionCreatedExperience, getFormData } from '@cctv/utils';

import styles from './Create.module.scss';

/** Form page for creating a new experience */
export default function Create() {
  const [experienceUrl, setExperienceUrl] = useState<string>();
  const nameRef = useRef<HTMLInputElement>(null);

  const { post, isLoading, error, setError } = usePost<CreateExperienceApiResponse>({
    url: '/api/experiences',
  });

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = getFormData<{ code: string; name: string }>(e.currentTarget);
    const code = formData.code;
    const name = formData.name;

    if (!code || code.trim() === '') {
      setError('Please enter a code');
      return;
    }

    if (!name || name.trim() === '') {
      setError('Please enter a name');
      return;
    }

    const response = await post(
      JSON.stringify({
        experience: {
          code: code.trim(),
          name: name.trim(),
        },
      }),
    );

    if (response && response.type === 'success') {
      setExperienceUrl(response.experience.url);
      if (name && code) {
        addSessionCreatedExperience({ code: code.trim(), name: name.trim() });
      }
    } else if (response && response.type === 'error') {
      setError(response.error || 'Failed to create experience');
    }
  };

  const qrCode = useMemo(() => {
    if (!experienceUrl) return null;

    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      experienceUrl,
    )}`;
  }, [experienceUrl]);

  if (qrCode) {
    return (
      <section className="page flex-centered">
        <Panel className={styles.container}>
          <h1 className={styles.title}>{`Experience: ${nameRef.current?.value}`}</h1>
          <img src={qrCode} alt={`QR code for joining an experience`} />
          <a href={experienceUrl} className={styles.link}>
            {'Go to lobby'}
          </a>
        </Panel>
      </section>
    );
  }

  return (
    <section className="page flex-centered">
      <Panel className={styles.container}>
        <h1 className={styles.title}>{'Create Experience'}</h1>
        <form className={styles.form} onSubmit={handleCreate}>
          <TextInput ref={nameRef} label="Name" name="name" type="text" />
          <TextInput label="Code" name="code" type="text" />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" loading={isLoading} loadingText="Creating...">
            {'Create'}
          </Button>
        </form>
      </Panel>
    </section>
  );
}
