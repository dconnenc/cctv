import { TextInput } from '@cctv/core/TextInput/TextInput';
import {
  BlockComponentProps,
  BlockKind,
  BlockStatus,
  MinigameBalloonPumpApiPayload,
  MinigameBalloonPumpData,
  MinigameBalloonPumpPayload,
  ParticipantSummary,
} from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';

const STROKE_UNITS = 10;

export const getDefaultMinigameBalloonPumpState = (): MinigameBalloonPumpData => ({
  target_units: 100,
});

export const validateMinigameBalloonPump = (data: MinigameBalloonPumpData): string | null => {
  if (!Number.isInteger(data.target_units) || data.target_units <= 0) {
    return 'Target units must be a positive whole number';
  }
  return null;
};

export const buildMinigameBalloonPumpPayload = (
  data: MinigameBalloonPumpData,
): MinigameBalloonPumpApiPayload => ({
  type: BlockKind.MINIGAME_BALLOON_PUMP,
  variant: 'balloon_pump',
  target_units: data.target_units,
});

export const canMinigameBalloonPumpOpenImmediately = (
  _data: MinigameBalloonPumpData,
  _participants: ParticipantSummary[],
): boolean => false;

export const processMinigameBalloonPumpBeforeSubmit = (
  data: MinigameBalloonPumpData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): MinigameBalloonPumpData => data;

export const minigameBalloonPumpPayloadToFormData = (
  payload: MinigameBalloonPumpPayload,
): MinigameBalloonPumpData => ({
  target_units: payload.target_units,
});

export default function CreateMinigameBalloonPump({
  data,
  onChange,
}: BlockComponentProps<MinigameBalloonPumpData>) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onChange?.({ target_units: Number.isNaN(value) ? 0 : value });
  };

  const strokeEstimate =
    data.target_units > 0 ? (data.target_units / STROKE_UNITS).toFixed(1) : '0';

  return (
    <div className={sharedStyles.container}>
      <TextInput
        label="Target units to fill the balloon"
        type="number"
        min={1}
        value={data.target_units || ''}
        onChange={handleChange}
      />
      <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.25rem' }}>
        A full pump stroke = {STROKE_UNITS} units.{' '}
        {data.target_units > 0 && (
          <>
            That's about <strong>{strokeEstimate} strokes</strong> to burst.
          </>
        )}
      </p>
      <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
        A segment is required — set it under "Additional Details". Only participants in that segment
        will play.
      </p>
    </div>
  );
}
