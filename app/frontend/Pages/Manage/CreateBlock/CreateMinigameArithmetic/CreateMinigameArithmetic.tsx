import { TextInput } from '@cctv/core/TextInput/TextInput';
import {
  BlockComponentProps,
  BlockKind,
  BlockStatus,
  MinigameArithmeticApiPayload,
  MinigameArithmeticData,
  MinigameArithmeticPayload,
  ParticipantSummary,
} from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';

export const getDefaultMinigameArithmeticState = (): MinigameArithmeticData => ({
  duration_seconds: 60,
  question_count: 30,
  leaderboard_size: 5,
});

export const validateMinigameArithmetic = (data: MinigameArithmeticData): string | null => {
  if (!Number.isInteger(data.duration_seconds) || data.duration_seconds <= 0) {
    return 'Duration must be a positive whole number of seconds';
  }
  if (!Number.isInteger(data.question_count) || data.question_count <= 0) {
    return 'Question count must be a positive whole number';
  }
  if (!Number.isInteger(data.leaderboard_size) || data.leaderboard_size <= 0) {
    return 'Leaderboard size must be a positive whole number';
  }
  return null;
};

export const buildMinigameArithmeticPayload = (
  data: MinigameArithmeticData,
): MinigameArithmeticApiPayload => ({
  type: BlockKind.MINIGAME_ARITHMETIC,
  variant: 'arithmetic',
  duration_seconds: data.duration_seconds,
  question_count: data.question_count,
  leaderboard_size: data.leaderboard_size,
});

export const canMinigameArithmeticOpenImmediately = (
  _data: MinigameArithmeticData,
  _participants: ParticipantSummary[],
): boolean => false;

export const processMinigameArithmeticBeforeSubmit = (
  data: MinigameArithmeticData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): MinigameArithmeticData => data;

export const minigameArithmeticPayloadToFormData = (
  payload: MinigameArithmeticPayload,
): MinigameArithmeticData => ({
  duration_seconds: payload.duration_seconds,
  question_count: payload.question_count,
  leaderboard_size: payload.leaderboard_size,
});

export default function CreateMinigameArithmetic({
  data,
  onChange,
}: BlockComponentProps<MinigameArithmeticData>) {
  const handleNumberChange =
    (key: keyof MinigameArithmeticData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      onChange?.({ [key]: Number.isNaN(value) ? 0 : value } as Partial<MinigameArithmeticData>);
    };

  return (
    <div className={sharedStyles.container}>
      <TextInput
        label="Duration (seconds)"
        type="number"
        min={5}
        value={data.duration_seconds || ''}
        onChange={handleNumberChange('duration_seconds')}
      />
      <TextInput
        label="Number of questions"
        type="number"
        min={1}
        value={data.question_count || ''}
        onChange={handleNumberChange('question_count')}
      />
      <TextInput
        label="Leaderboard size"
        type="number"
        min={1}
        value={data.leaderboard_size || ''}
        onChange={handleNumberChange('leaderboard_size')}
      />
      <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
        A segment is required — set it under "Additional Details". Only participants in that segment
        will see and play the minigame.
      </p>
    </div>
  );
}
