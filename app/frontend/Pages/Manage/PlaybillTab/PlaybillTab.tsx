import { useCallback, useEffect, useState } from 'react';

import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';

import { Switch } from '@cctv/core';
import { Button } from '@cctv/core';
import { usePerformers, useUpdatePlaybill } from '@cctv/hooks';
import { Performer, PlaybillSection } from '@cctv/types';

import styles from './PlaybillTab.module.scss';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

interface PlaybillEntry {
  id: string;
  performer_id: string;
}

interface PlaybillTabProps {
  playbill: PlaybillSection[];
  playbillEnabled: boolean;
}

export default function PlaybillTab({ playbill, playbillEnabled }: PlaybillTabProps) {
  const [entries, setEntries] = useState<PlaybillEntry[]>(() =>
    playbill.map((s) => ({ id: s.id, performer_id: s.performer_id })),
  );
  const [enabled, setEnabled] = useState(playbillEnabled);
  const { updatePlaybill, isLoading, error } = useUpdatePlaybill();
  const { performers, isLoading: performersLoading } = usePerformers();

  useEffect(() => {
    setEntries(playbill.map((s) => ({ id: s.id, performer_id: s.performer_id })));
  }, [playbill]);

  useEffect(() => {
    setEnabled(playbillEnabled);
  }, [playbillEnabled]);

  const addedPerformerIds = new Set(entries.map((e) => e.performer_id));
  const availablePerformers = performers.filter((p) => !addedPerformerIds.has(p.id));

  const originalEntries = playbill.map((s) => ({ id: s.id, performer_id: s.performer_id }));
  const isDirty =
    JSON.stringify(entries) !== JSON.stringify(originalEntries) || enabled !== playbillEnabled;

  const handleAdd = useCallback((performer: Performer) => {
    setEntries((prev) => [...prev, { id: generateId(), performer_id: performer.id }]);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setEntries((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setEntries((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    await updatePlaybill(entries, enabled);
  }, [updatePlaybill, entries, enabled]);

  const performerById = new Map(performers.map((p) => [p.id, p]));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Playbill Performers</span>
        <label className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <span>{enabled ? 'Visible' : 'Hidden'}</span>
        </label>
      </div>

      {entries.length === 0 ? (
        <div className={styles.empty}>No performers added yet.</div>
      ) : (
        <div className={styles.addedList}>
          {entries.map((entry, index) => {
            const performer = performerById.get(entry.performer_id);
            return (
              <div key={entry.id} className={styles.addedRow}>
                <div className={styles.addedRowInfo}>
                  {performer?.photo_url ? (
                    <img
                      src={performer.photo_url}
                      alt={performer.name}
                      className={styles.addedRowPhoto}
                    />
                  ) : (
                    <div className={styles.addedRowPhotoPlaceholder}>
                      {(performer?.name ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={styles.addedRowName}>
                    {performer?.name ?? entry.performer_id}
                  </span>
                </div>
                <div className={styles.addedRowActions}>
                  <Button
                    variant="ghost"
                    size="lg"
                    icon={<ArrowUp size={14} />}
                    hideLabel
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    Move up
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    icon={<ArrowDown size={14} />}
                    hideLabel
                    onClick={() => handleMoveDown(index)}
                    disabled={index === entries.length - 1}
                    title="Move down"
                  >
                    Move down
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    icon={<Trash2 size={14} />}
                    hideLabel
                    onClick={() => handleRemove(entry.id)}
                    title="Remove"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!performersLoading && availablePerformers.length > 0 && (
        <div className={styles.availableSection}>
          <span className={styles.availableLabel}>Add performers</span>
          <div className={styles.availableList}>
            {availablePerformers.map((performer) => (
              <div key={performer.id} className={styles.availableRow}>
                {performer.photo_url ? (
                  <img
                    src={performer.photo_url}
                    alt={performer.name}
                    className={styles.addedRowPhoto}
                  />
                ) : (
                  <div className={styles.addedRowPhotoPlaceholder}>
                    {performer.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={styles.addedRowName}>{performer.name}</span>
                <Button size="sm" variant="secondary" onClick={() => handleAdd(performer)}>
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <div>{error && <span className="error-message">{error}</span>}</div>
        {isDirty && (
          <Button onClick={handleSave} loading={isLoading} loadingText="Saving...">
            Save
          </Button>
        )}
      </div>
    </div>
  );
}
