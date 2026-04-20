import { FormEvent, useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { Button, NaturalDatePicker, Panel, Switch, TextInput } from '@cctv/core';
import { useEvent, usePerformers } from '@cctv/hooks';
import { combineDateAndTime, timeFromIso } from '@cctv/utils/calendar';

import styles from './CreateEvent.module.scss';

export default function EditEvent() {
  const { slug } = useParams<{ slug: string }>();
  const { event, isLoading: loadingEvent } = useEvent(slug ?? '');
  const { performers } = usePerformers();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [selectedPerformers, setSelectedPerformers] = useState<string[]>([]);
  const [published, setPublished] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (!event) return;
    setSelectedPerformers(event.performers.map((p) => p.id));
    setPublished(event.published);
    setStartDate(new Date(event.starts_at));
    setStartTime(timeFromIso(event.starts_at));
    setEndDate(new Date(event.ends_at));
    setEndTime(timeFromIso(event.ends_at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

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
    if (!startDate || !startTime) {
      setError('Start date and time are required');
      return;
    }
    if (!endDate || !endTime) {
      setError('End date and time are required');
      return;
    }

    const body: Record<string, any> = {
      title,
      description: getValue('description') || null,
      starts_at: combineDateAndTime(startDate, startTime),
      ends_at: combineDateAndTime(endDate, endTime),
      venue_name: getValue('venue_name') || null,
      venue_address: getValue('venue_address') || null,
      pricing_text: getValue('pricing_text') || null,
      ticket_url: getValue('ticket_url') || null,
      experience_code: getValue('experience_code') || null,
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

            <TextInput
              label="Description"
              name="description"
              multiline
              placeholder="What's this event about?"
              defaultValue={event.description ?? ''}
            />

            <div className={styles.row}>
              <NaturalDatePicker label="Start date" date={startDate} onSelect={setStartDate} />
              <TextInput
                label="Start time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className={styles.row}>
              <NaturalDatePicker label="End date" date={endDate} onSelect={setEndDate} />
              <TextInput
                label="End time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
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
              label="Experience code (optional)"
              name="experience_code"
              type="text"
              placeholder="e.g. MYSHOW2026"
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

            <label className={styles.checkLabel}>
              <Switch checked={published} onCheckedChange={setPublished} />
              Published
            </label>

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
