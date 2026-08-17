import { Pause, Play, RotateCcw } from 'lucide-react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button } from '@cctv/core/Button/Button';
import { useNewscasters } from '@cctv/hooks';
import { BlockKind, NewscastersBlock, NewscastersSourceBlock } from '@cctv/types';

import styles from './NewscastersManager.module.scss';

export default function NewscastersManager({ block }: { block: NewscastersBlock }) {
  const { experience } = useExperience();
  const { selectVideo, setPlaying, restart } = useNewscasters();

  const sourceBlock = experience?.blocks?.find(
    (b) => b.id === block.payload.source_block_id && b.kind === BlockKind.NEWSCASTERS_SOURCE,
  ) as NewscastersSourceBlock | undefined;

  const submissions = sourceBlock?.responses?.all_responses ?? [];
  const selectedId = block.payload.selected_video?.submission_id ?? null;
  const playing = block.payload.playing;

  const participants = [...(experience?.hosts ?? []), ...(experience?.participants ?? [])];
  const nameFor = (participantId: string) =>
    participants.find((p) => p.id === participantId)?.name ?? participantId.slice(0, 6);

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        {playing ? (
          <Button
            variant="secondary"
            icon={<Pause size={16} />}
            onClick={() => setPlaying(block.id, false)}
          >
            Pause
          </Button>
        ) : (
          <Button
            icon={<Play size={16} />}
            onClick={() => setPlaying(block.id, true)}
            disabled={!selectedId}
          >
            Play
          </Button>
        )}
        <Button
          variant="secondary"
          icon={<RotateCcw size={16} />}
          onClick={() => restart(block.id)}
          disabled={!selectedId}
        >
          Restart
        </Button>
      </div>

      {!sourceBlock && (
        <p className={styles.empty}>Source block not found — it may have been deleted.</p>
      )}

      {sourceBlock && submissions.length === 0 && (
        <p className={styles.empty}>No videos submitted to the source block yet.</p>
      )}

      {submissions.length > 0 && (
        <div className={styles.list}>
          {submissions.map((s) => {
            const selected = s.id === selectedId;
            return (
              <div key={s.id} className={selected ? styles.rowSelected : styles.row}>
                <div className={styles.rowInfo}>
                  <span className={styles.rowName}>{nameFor(s.experience_participant_id)}</span>
                  <span className={styles.rowKind}>
                    {s.video_kind === 'youtube' ? 'YouTube link' : 'Upload'}
                  </span>
                </div>
                {s.video_url && (
                  <a className={styles.rowLink} href={s.video_url} target="_blank" rel="noreferrer">
                    Preview
                  </a>
                )}
                <Button
                  variant="secondary"
                  onClick={() => selectVideo(block.id, selected ? null : s.id)}
                >
                  {selected ? 'Deselect' : 'Select'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
