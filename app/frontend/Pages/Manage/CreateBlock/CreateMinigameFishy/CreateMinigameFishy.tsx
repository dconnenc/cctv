import { TextInput } from '@cctv/core/TextInput/TextInput';
import {
  BlockComponentProps,
  BlockKind,
  BlockStatus,
  MinigameFishyApiPayload,
  MinigameFishyData,
  MinigameFishyPayload,
  ParticipantSummary,
} from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';

// Mirrors Minigames::Fishy::Config player-cap bounds.
export const FISHY_MIN_PLAYERS = 2;
export const FISHY_MAX_PLAYERS_LIMIT = 100;
const FISHY_DEFAULT_MAX_PLAYERS = 50;

export const getDefaultMinigameFishyState = (): MinigameFishyData => ({
  title: 'Fishy',
  instructions: 'Touch to swim. Double-tap to dash. Eat smaller fish — last one swimming wins.',
  max_players: FISHY_DEFAULT_MAX_PLAYERS,
});

export const validateMinigameFishy = (data: MinigameFishyData): string | null => {
  if (!data.title.trim()) return 'Title is required';
  if (
    !Number.isInteger(data.max_players) ||
    data.max_players < FISHY_MIN_PLAYERS ||
    data.max_players > FISHY_MAX_PLAYERS_LIMIT
  ) {
    return `Player cap must be a whole number from ${FISHY_MIN_PLAYERS} to ${FISHY_MAX_PLAYERS_LIMIT}`;
  }
  return null;
};

export const buildMinigameFishyPayload = (data: MinigameFishyData): MinigameFishyApiPayload => ({
  type: BlockKind.MINIGAME_FISHY,
  title: data.title.trim(),
  instructions: data.instructions.trim(),
  max_players: data.max_players,
});

export const canMinigameFishyOpenImmediately = (
  _data: MinigameFishyData,
  _participants: ParticipantSummary[],
): boolean => false;

export const processMinigameFishyBeforeSubmit = (
  data: MinigameFishyData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): MinigameFishyData => data;

export const minigameFishyPayloadToFormData = (
  payload: MinigameFishyPayload,
): MinigameFishyData => ({
  title: payload.title,
  instructions: payload.instructions,
  max_players: payload.max_players,
});

export default function CreateMinigameFishy({
  data,
  onChange,
}: BlockComponentProps<MinigameFishyData>) {
  const handleMaxPlayers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onChange?.({ max_players: Number.isNaN(value) ? 0 : value });
  };

  return (
    <div className={sharedStyles.container}>
      <TextInput
        label="Title"
        value={data.title}
        onChange={(e) => onChange?.({ title: e.target.value })}
      />
      <TextInput
        label="Instructions"
        multiline
        rows={2}
        value={data.instructions}
        onChange={(e) => onChange?.({ instructions: e.target.value })}
      />
      <TextInput
        label={`Player cap (${FISHY_MIN_PLAYERS}–${FISHY_MAX_PLAYERS_LIMIT})`}
        type="number"
        min={FISHY_MIN_PLAYERS}
        max={FISHY_MAX_PLAYERS_LIMIT}
        value={data.max_players || ''}
        onChange={handleMaxPlayers}
      />
      <p className={sharedStyles.helpText}>
        The first {data.max_players || '…'} participants to join play; everyone else spectates.
      </p>
    </div>
  );
}
