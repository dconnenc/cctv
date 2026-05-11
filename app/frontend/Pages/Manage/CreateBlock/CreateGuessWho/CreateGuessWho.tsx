import { useExperience } from '@cctv/contexts/ExperienceContext';
import {
  BlockComponentProps,
  BlockKind,
  BlockStatus,
  GuessWhoApiPayload,
  GuessWhoData,
  GuessWhoPayload,
  ParticipantSummary,
} from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';

export const getDefaultGuessWhoState = (): GuessWhoData => {
  return {
    segment_id: '',
  };
};

export const validateGuessWho = (data: GuessWhoData): string | null => {
  if (!data.segment_id.trim()) {
    return 'A segment is required for Guess Who';
  }
  return null;
};

export const buildGuessWhoPayload = (data: GuessWhoData): GuessWhoApiPayload => {
  return {
    type: BlockKind.GUESS_WHO,
    segment_id: data.segment_id,
  };
};

export const canGuessWhoOpenImmediately = (
  _data: GuessWhoData,
  _participants: ParticipantSummary[],
): boolean => {
  return true;
};

export const processGuessWhoBeforeSubmit = (
  data: GuessWhoData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): GuessWhoData => {
  return data;
};

export const guessWhoPayloadToFormData = (payload: GuessWhoPayload): GuessWhoData => ({
  segment_id: payload.segment_id || '',
});

export default function CreateGuessWho({ data, onChange }: BlockComponentProps<GuessWhoData>) {
  const { experience } = useExperience();
  const segments = experience?.segments || [];

  return (
    <div className={sharedStyles.container}>
      <label style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem' }}>Audience pool segment</span>
        <select
          required
          value={data.segment_id}
          onChange={(e) => onChange?.({ segment_id: e.target.value })}
          style={{ padding: '0.5rem 0.75rem', fontSize: '1rem' }}
        >
          <option value="" disabled>
            Pick a segment…
          </option>
          {segments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
          Two participants from this segment will be selected at random when the block is presented.
        </span>
      </label>
    </div>
  );
}
