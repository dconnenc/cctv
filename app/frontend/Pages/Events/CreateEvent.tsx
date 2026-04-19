import { FormEvent, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Button, Panel, TextInput } from '@cctv/core';
import { usePerformers } from '@cctv/hooks';

import styles from './CreateEvent.module.scss';

export default function CreateEvent() {
  const navigate = useNavigate();
  const { performers } = usePerformers();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [selectedPerformers, setSelectedPerformers] = useState<string[]>([]);
  const [published, setPublished] = useState(false);

  const togglePerformer = (id: string) => {
    setSelectedPerformers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement)?.value?.trim() ?? '';

    const title = getValue('title');
    const starts_at = getValue('starts_at');
    const ends_at = getValue('ends_at');

    if (!title) {
      setError('Title is required');
      return;
    }
    if (!starts_at) {
      setError('Start date/time is required');
      return;
    }
    if (!ends_at) {
      setError('End date/time is required');
      return;
    }

    const body: Record<string, any> = {
      title,
      description: getValue('description') || null,
      starts_at: new Date(starts_at).toISOString(),
      ends_at: new Date(ends_at).toISOString(),
      venue_name: getValue('venue_name') || null,
      venue_address: getValue('venue_address') || null,
      pricing_text: getValue('pricing_text') || null,
      ticket_url: getValue('ticket_url') || null,
      experience_id: getValue('experience_id') || null,
      published,
      performer_ids: selectedPerformers,
    };

    setIsLoading(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        navigate(`/events/${data.event.slug}`);
      } else {
        setError(data.error || data.message || 'Failed to create event');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="page">
      <div className={styles.container}>
        <Panel className={styles.panel}>
          <h1 className={styles.title}>Create Event</h1>
          <form className={styles.form} onSubmit={handleSubmit}>
            <TextInput label="Title" name="title" type="text" />

            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <textarea
                name="description"
                className={styles.textarea}
                placeholder="What's this event about?"
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Start</label>
                <input name="starts_at" type="datetime-local" className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>End</label>
                <input name="ends_at" type="datetime-local" className={styles.input} />
              </div>
            </div>

            <div className={styles.row}>
              <TextInput label="Venue Name" name="venue_name" type="text" />
              <TextInput label="Venue Address" name="venue_address" type="text" />
            </div>

            <div className={styles.row}>
              <TextInput label="Pricing" name="pricing_text" type="text" />
              <TextInput label="Ticket URL" name="ticket_url" type="url" />
            </div>

            <TextInput label="Experience ID (optional)" name="experience_id" type="text" />

            {performers.length > 0 && (
              <div className={styles.field}>
                <label className={styles.label}>Performers</label>
                <div className={styles.performerPicker}>
                  {performers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`${styles.performerChip} ${selectedPerformers.includes(p.id) ? styles.selected : ''}`}
                      onClick={() => togglePerformer(p.id)}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                Publish immediately
              </label>
            </div>

            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" loading={isLoading} loadingText="Creating...">
              Create Event
            </Button>
          </form>
        </Panel>
      </div>
    </section>
  );
}
