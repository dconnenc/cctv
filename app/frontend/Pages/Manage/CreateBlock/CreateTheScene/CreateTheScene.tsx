import { TextInput } from '@cctv/core/TextInput/TextInput';
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

export const getDefaultTheSceneState = (): TheSceneData => ({
  leaderboard_size: 5,
});

export const validateTheScene = (data: TheSceneData): string | null => {
  if (!Number.isInteger(data.leaderboard_size) || data.leaderboard_size <= 0) {
    return 'Leaderboard size must be a positive whole number';
  }
  return null;
};

export const buildTheScenePayload = (data: TheSceneData): TheSceneApiPayload => ({
  type: BlockKind.THE_SCENE,
  leaderboard_size: data.leaderboard_size,
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
});

export default function CreateTheScene({ data, onChange }: BlockComponentProps<TheSceneData>) {
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
      <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
        How many top suggestions show on the monitor leaderboard. The audience can vote on any
        active suggestion — the leaderboard just controls how many ranks render publicly.
      </p>
      <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
        A segment is required — set it under "Additional Details". Suggestions persist across scenes
        unless cleared. Votes reset each scene.
      </p>
    </div>
  );
}
