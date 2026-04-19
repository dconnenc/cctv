import { FormEvent, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Button, NaturalDatePicker, Panel, Switch, TextInput } from '@cctv/core';
import { usePerformers } from '@cctv/hooks';
import { combineDateAndTime } from '@cctv/utils/calendar';

import styles from './CreateEvent.module.scss';

export default function CreateEvent() {
  const navigate = useNavigate();
  const { performers } = usePerformers();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [selectedPerformers, setSelectedPerformers] = useState<string[]>([]);
  const [published, setPublished] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('');

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

            <TextInput
              label="Description"
              name="description"
              multiline
              placeholder="What's this event about?"
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
              <TextInput label="Venue Name" name="venue_name" type="text" />
              <TextInput label="Venue Address" name="venue_address" type="text" />
            </div>

            <div className={styles.row}>
              <TextInput label="Pricing" name="pricing_text" type="text" />
              <TextInput label="Ticket URL" name="ticket_url" type="url" />
            </div>

            <TextInput
              label="Experience code (optional)"
              name="experience_code"
              type="text"
              placeholder="e.g. MYSHOW2026"
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
              Publish immediately
            </label>

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
