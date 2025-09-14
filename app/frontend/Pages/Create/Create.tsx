import { FormEvent, useMemo, useRef, useState } from 'react';

import { Button, TextInput } from '@cctv/core';
import { usePost } from '@cctv/hooks';
import { ExperienceCreateResponse } from '@cctv/types';
import { getFormData } from '@cctv/utils';

import styles from './Create.module.scss';

/** Form page for creating a new experience */
export default function Create() {
  const [experienceUrl, setExperienceUrl] = useState<string>();
  const [experienceCodeActual, setExperienceCodeActual] = useState<string>();
  const nameRef = useRef<HTMLInputElement>(null);

  const { post, isLoading, error, setError } = usePost<ExperienceCreateResponse>({
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
        code: code.trim().toUpperCase(),
        name: name.trim(),
      }),
    );

    setExperienceUrl(response?.experience?.url);
    setExperienceCodeActual(response?.experience?.code);
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
        <h1 className={styles.title}>Exprience: {nameRef.current?.value}</h1>
        <img src={qrCode} alt={`QR code for joining an experience`} />
        <a href={experienceUrl} className={styles.link}>
          Go to lobby
        </a>
      </section>
    );
  }

  return (
    <section className="page flex-centered">
      <h1 className={styles.title}>Create experience</h1>
      <form className={styles.form} onSubmit={handleCreate}>
        {isLoading && <p>Creating...</p>}
        <TextInput ref={nameRef} label="Name" name="name" type="text" />
        <TextInput label="Code" name="code" type="text" />
        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit">Create</Button>
      </form>
    </section>
  );
}
