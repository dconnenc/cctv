import { TextInput } from '@cctv/core/TextInput/TextInput';
import {
  BlockKind,
  BlockStatus,
  BuzzerApiPayload,
  BuzzerData,
  BuzzerPayload,
  ParticipantSummary,
} from '@cctv/types';
import { BlockComponentProps } from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';

export const getDefaultBuzzerState = (): BuzzerData => ({
  label: '',
  prompt: '',
});

export const validateBuzzer = (_data: BuzzerData): string | null => null;

export const buildBuzzerPayload = (data: BuzzerData): BuzzerApiPayload => ({
  type: BlockKind.BUZZER,
  label: data.label.trim() || undefined,
  prompt: data.prompt.trim() || undefined,
});

export const canBuzzerOpenImmediately = (
  _data: BuzzerData,
  _participants: ParticipantSummary[],
): boolean => true;

export const buzzerPayloadToFormData = (payload: BuzzerPayload): BuzzerData => ({
  label: payload.label || '',
  prompt: payload.prompt || '',
});

export const processBuzzerBeforeSubmit = (
  data: BuzzerData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): BuzzerData => data;

export default function CreateBuzzer({ data, onChange }: BlockComponentProps<BuzzerData>) {
  return (
    <div className={sharedStyles.container}>
      <TextInput
        label="Prompt"
        placeholder="Contestants be ready to buzz in!"
        value={data.prompt}
        onChange={(e) => onChange?.({ prompt: e.target.value })}
      />
      <TextInput
        label="Button Label (optional)"
        placeholder="Buzz In"
        value={data.label}
        onChange={(e) => onChange?.({ label: e.target.value })}
      />
    </div>
  );
}
