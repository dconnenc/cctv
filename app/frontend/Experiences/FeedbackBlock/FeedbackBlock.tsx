import { Check } from 'lucide-react';

import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';
import { FeedbackForm } from '@cctv/feedback';
import { FeedbackBlock as FeedbackBlockType, FeedbackSource, FeedbackType } from '@cctv/types';

import styles from './FeedbackBlock.module.scss';

interface FeedbackBlockProps {
  block: FeedbackBlockType;
  disabled?: boolean;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

const DEFAULT_TYPES = [FeedbackType.EXPERIENCE, FeedbackType.BUG, FeedbackType.GENERAL];

export default function FeedbackBlock({
  block,
  disabled = false,
  viewContext = 'participant',
}: FeedbackBlockProps) {
  const { submissionState, setSubmissionState } = useExperienceState();
  const { prompt, allowed_types, require_title } = block.payload;

  const hasSubmitted = Boolean(submissionState[block.id]);

  // The monitor projects the prompt so the room knows what is being asked; the
  // responses themselves are private and only ever surface in triage.
  if (viewContext === 'monitor') {
    return (
      <div className={styles.container}>
        <p className={styles.monitorPrompt}>{prompt}</p>
      </div>
    );
  }

  if (viewContext === 'manage') {
    return (
      <div className={styles.container}>
        <p className={styles.prompt}>{prompt}</p>
        <p className={styles.managerNote}>
          {block.responses?.total ?? 0} submitted — triaged in Linear.
        </p>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className={styles.container}>
        <p className={styles.prompt}>{prompt}</p>
        <div className={styles.submitted}>
          <Check size={16} />
          <span>Thanks for the feedback</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.prompt}>{prompt}</p>

      {disabled ? (
        <p className={styles.closed}>This feedback round is closed.</p>
      ) : (
        <FeedbackForm
          source={FeedbackSource.BLOCK}
          experienceBlockId={block.id}
          availableTypes={allowed_types?.length ? allowed_types : DEFAULT_TYPES}
          requireTitle={require_title ?? false}
          submitLabel="Submit"
          onSubmitted={() =>
            setSubmissionState((prev) => ({
              ...prev,
              [block.id]: { answer: { submitted: true } },
            }))
          }
        />
      )}
    </div>
  );
}
