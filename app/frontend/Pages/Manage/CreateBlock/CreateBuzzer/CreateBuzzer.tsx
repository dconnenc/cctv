import { TextInput } from '@cctv/core/TextInput/TextInput';
import {
  BlockKind,
  BlockStatus,
  BuzzerApiPayload,
  BuzzerData,
  ParticipantSummary,
} from '@cctv/types';
import { BlockComponentProps } from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';

export const getDefaultBuzzerState = (): BuzzerData => ({
  label: '',
});

export const validateBuzzer = (_data: BuzzerData): string | null => null;

export const buildBuzzerPayload = (data: BuzzerData): BuzzerApiPayload => ({
  type: BlockKind.BUZZER,
  label: data.label.trim() || undefined,
});

export const canBuzzerOpenImmediately = (
  _data: BuzzerData,
  _participants: ParticipantSummary[],
): boolean => true;

export const processBuzzerBeforeSubmit = (
  data: BuzzerData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): BuzzerData => data;

export default function CreateBuzzer({ data, onChange }: BlockComponentProps<BuzzerData>) {
  return (
    <div className={sharedStyles.container}>
      <TextInput
        label="Button Label (optional)"
        placeholder="Buzz In"
        value={data.label}
        onChange={(e) => onChange?.({ label: e.target.value })}
      />
    </div>
  );
}
