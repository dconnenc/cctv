import { useMemo } from 'react';

import { TextInput } from '@cctv/core/TextInput/TextInput';
import { usePerformers } from '@cctv/hooks/usePerformers';
import {
  BlockComponentProps,
  BlockKind,
  BlockStatus,
  ParticipantSummary,
  TheSceneApiPayload,
  TheSceneData,
  TheScenePayload,
} from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';
import styles from './CreateTheScene.module.scss';

export const getDefaultTheSceneState = (): TheSceneData => ({
  leaderboard_size: 5,
  prompt_input_count: 3,
  performer_participant_ids: [],
});

export const validateTheScene = (data: TheSceneData): string | null => {
  if (!Number.isInteger(data.leaderboard_size) || data.leaderboard_size <= 0) {
    return 'Leaderboard size must be a positive whole number';
  }
  if (!Number.isInteger(data.prompt_input_count) || data.prompt_input_count <= 0) {
    return 'Prompt input count must be a positive whole number';
  }
  return null;
};

export const buildTheScenePayload = (data: TheSceneData): TheSceneApiPayload => ({
  type: BlockKind.THE_SCENE,
  leaderboard_size: data.leaderboard_size,
  prompt_input_count: data.prompt_input_count,
  performer_participant_ids: data.performer_participant_ids,
});

export const canTheSceneOpenImmediately = (
  _data: TheSceneData,
  _participants: ParticipantSummary[],
): boolean => false;

export const processTheSceneBeforeSubmit = (
  data: TheSceneData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): TheSceneData => data;

export const theScenePayloadToFormData = (payload: TheScenePayload): TheSceneData => ({
  leaderboard_size: payload.leaderboard_size,
  prompt_input_count: payload.prompt_input_count ?? 3,
  performer_participant_ids: payload.performer_participant_ids ?? [],
});

export default function CreateTheScene({
  data,
  onChange,
  participants = [],
}: BlockComponentProps<TheSceneData>) {
  const { performers } = usePerformers();

  const performerUserIds = useMemo(
    () => new Set(performers.map((p) => p.user_id).filter(Boolean) as string[]),
    [performers],
  );

  const sortedParticipants = useMemo(() => {
    const eligible = participants.filter((p) => p.role !== 'host' && p.role !== 'moderator');
    return eligible.slice().sort((a, b) => {
      const aHas = performerUserIds.has(a.user_id) ? 0 : 1;
      const bHas = performerUserIds.has(b.user_id) ? 0 : 1;
      if (aHas !== bHas) return aHas - bHas;
      return a.name.localeCompare(b.name);
    });
  }, [participants, performerUserIds]);

  const togglePerformer = (id: string) => {
    const ids = data.performer_participant_ids ?? [];
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    onChange?.({ performer_participant_ids: next });
  };

  return (
    <div className={sharedStyles.container}>
      <TextInput
        label="Leaderboard size"
        type="number"
        min={1}
        value={data.leaderboard_size || ''}
        onChange={(e) => {
          const value = parseInt(e.target.value, 10);
          onChange?.({ leaderboard_size: Number.isNaN(value) ? 0 : value });
        }}
      />
      <p className={styles.help}>How many top suggestions show on the monitor leaderboard.</p>

      <TextInput
        label="Prompt recipients per scene"
        type="number"
        min={1}
        value={data.prompt_input_count || ''}
        onChange={(e) => {
          const value = parseInt(e.target.value, 10);
          onChange?.({ prompt_input_count: Number.isNaN(value) ? 0 : value });
        }}
      />
      <p className={styles.help}>
        Random audience members who receive the suggestion input each scene. One additional
        participant gets the buzzer.
      </p>

      <fieldset className={styles.performersField}>
        <legend>Performers ({(data.performer_participant_ids ?? []).length})</legend>
        <p className={styles.help}>
          Performers won't be dispatched suggestion inputs or the buzzer. Members with a Performer
          profile are listed first.
        </p>
        <div className={styles.performerList}>
          {sortedParticipants.map((p) => {
            const selected = (data.performer_participant_ids ?? []).includes(p.id);
            const hasProfile = performerUserIds.has(p.user_id);
            return (
              <label key={p.id} className={styles.performerRow}>
                <input type="checkbox" checked={selected} onChange={() => togglePerformer(p.id)} />
                <span>{p.name}</span>
                {hasProfile && <span className={styles.performerBadge}>Performer</span>}
              </label>
            );
          })}
          {sortedParticipants.length === 0 && (
            <p className={styles.help}>Invite participants first to assign performers.</p>
          )}
        </div>
      </fieldset>

      <p className={styles.help}>
        Suggestions persist across scenes unless cleared. Votes reset each scene.
      </p>
    </div>
  );
}
