import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@cctv/core';
import {
  ParticipantSubmissionEntry,
  useParticipantSubmissions,
} from '@cctv/hooks/useParticipantSubmissions';
import { ParticipantSummary } from '@cctv/types';

import styles from './SubmissionsDrawer.module.scss';

interface SubmissionsDrawerProps {
  participant: ParticipantSummary | null;
  onClose: () => void;
}

function describeAnswer(entry: ParticipantSubmissionEntry): string {
  if (entry.answer?.text) return entry.answer.text;
  if (entry.answer?.options?.length) return entry.answer.options.join(', ');
  if (entry.answer?.buzzed_at) {
    return `Buzzed in at ${new Date(entry.answer.buzzed_at).toLocaleTimeString()}`;
  }
  if (entry.answer?.raw && typeof entry.answer.raw === 'object') {
    return JSON.stringify(entry.answer.raw);
  }
  return '—';
}

export default function SubmissionsDrawer({ participant, onClose }: SubmissionsDrawerProps) {
  const { entries, isLoading, error } = useParticipantSubmissions(participant?.id ?? null);

  return (
    <Dialog open={Boolean(participant)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent style={{ maxWidth: '40rem', width: '100%' }}>
        <DialogTitle className={styles.title}>
          {participant?.name || participant?.email || 'Participant'} — Submissions
        </DialogTitle>
        <DialogDescription className="sr-only">
          All submissions made by this participant during the experience
        </DialogDescription>

        {isLoading && <p className={styles.muted}>Loading…</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!isLoading && !error && entries.length === 0 && (
          <p className={styles.muted}>No submissions yet.</p>
        )}

        {entries.length > 0 && (
          <ol className={styles.list}>
            {entries.map((entry, index) => (
              <li key={`${entry.block_id}-${entry.submitted_at}-${index}`} className={styles.item}>
                <div className={styles.itemHeader}>
                  <span className={styles.kind}>{entry.block_kind.replace(/_/g, ' ')}</span>
                  <span className={styles.position}>Block #{entry.position + 1}</span>
                </div>
                <div className={styles.prompt}>{entry.prompt || '(no prompt)'}</div>
                {entry.photo_url ? (
                  <img src={entry.photo_url} alt="Submission" className={styles.photo} />
                ) : (
                  <div className={styles.answer}>{describeAnswer(entry)}</div>
                )}
                <div className={styles.timestamp}>
                  {new Date(entry.submitted_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
