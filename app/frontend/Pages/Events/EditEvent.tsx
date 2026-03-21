import { FormEvent, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { Button, Panel, TextInput } from '@cctv/core';
import { useEvent, usePerformers } from '@cctv/hooks';

import styles from './CreateEvent.module.scss';

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEvent() {
  const { slug } = useParams<{ slug: string }>();
  const { event, isLoading: loadingEvent } = useEvent(slug ?? '');
  const { performers } = usePerformers();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [selectedPerformers, setSelectedPerformers] = useState<string[]>([]);
  const [published, setPublished] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (event && !initialized) {
    setSelectedPerformers(event.performers.map((p) => p.id));
    setPublished(event.published);
    setInitialized(true);
  }

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
    if (!title) {
      setError('Title is required');
      return;
    }

    const body: Record<string, any> = {
      title,
      description: getValue('description') || null,
      starts_at: new Date(getValue('starts_at')).toISOString(),
      ends_at: new Date(getValue('ends_at')).toISOString(),
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
      const res = await fetch(`/api/events/${slug}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        navigate(`/events/${data.event.slug}`);
      } else {
        setError(data.error || data.message || 'Failed to update event');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingEvent)
    return (
      <section className="page flex-centered">
        <div>Loading...</div>
      </section>
    );
  if (!event)
    return (
      <section className="page flex-centered">
        <div>Event not found</div>
      </section>
    );

  return (
    <section className="page">
      <div className={styles.container}>
        <Panel className={styles.panel}>
          <h1 className={styles.title}>Edit Event</h1>
          <form className={styles.form} onSubmit={handleSubmit}>
            <TextInput label="Title" name="title" type="text" defaultValue={event.title} />

            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <textarea
                name="description"
                className={styles.textarea}
                defaultValue={event.description ?? ''}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Start</label>
                <input
                  name="starts_at"
                  type="datetime-local"
                  className={styles.input}
                  defaultValue={toLocalDatetimeValue(event.starts_at)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>End</label>
                <input
                  name="ends_at"
                  type="datetime-local"
                  className={styles.input}
                  defaultValue={toLocalDatetimeValue(event.ends_at)}
                />
              </div>
            </div>

            <div className={styles.row}>
              <TextInput
                label="Venue Name"
                name="venue_name"
                type="text"
                defaultValue={event.venue_name ?? ''}
              />
              <TextInput
                label="Venue Address"
                name="venue_address"
                type="text"
                defaultValue={event.venue_address ?? ''}
              />
            </div>

            <div className={styles.row}>
              <TextInput
                label="Pricing"
                name="pricing_text"
                type="text"
                defaultValue={event.pricing_text ?? ''}
              />
              <TextInput
                label="Ticket URL"
                name="ticket_url"
                type="url"
                defaultValue={event.ticket_url ?? ''}
              />
            </div>

            <TextInput
              label="Experience ID (optional)"
              name="experience_id"
              type="text"
              defaultValue={event.experience?.code_slug ?? ''}
            />

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
                Published
              </label>
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
