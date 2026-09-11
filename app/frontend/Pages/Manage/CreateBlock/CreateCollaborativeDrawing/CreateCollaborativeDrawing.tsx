import { TextInput } from '@cctv/core/TextInput/TextInput';
import {
  BlockComponentProps,
  BlockKind,
  BlockStatus,
  CollaborativeDrawingApiPayload,
  CollaborativeDrawingData,
  CollaborativeDrawingPayload,
  ParticipantSummary,
} from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';

export const getDefaultCollaborativeDrawingState = (): CollaborativeDrawingData => ({
  prompt: '',
  min_subsections: 3,
  max_subsections: 6,
  drawing_time_seconds: 60,
  total_drawings: 4,
});

export const validateCollaborativeDrawing = (data: CollaborativeDrawingData): string | null => {
  if (!data.prompt.trim()) return 'Prompt is required';
  if (!Number.isInteger(data.min_subsections) || data.min_subsections <= 0) {
    return 'Minimum subsections must be a positive whole number';
  }
  if (!Number.isInteger(data.max_subsections) || data.max_subsections <= 0) {
    return 'Maximum subsections must be a positive whole number';
  }
  if (data.max_subsections < data.min_subsections) {
    return 'Maximum subsections must be greater than or equal to minimum';
  }
  if (!Number.isInteger(data.drawing_time_seconds) || data.drawing_time_seconds <= 0) {
    return 'Drawing time must be a positive whole number of seconds';
  }
  if (!Number.isInteger(data.total_drawings) || data.total_drawings <= 0) {
    return 'Total drawings must be a positive whole number';
  }
  return null;
};

export const buildCollaborativeDrawingPayload = (
  data: CollaborativeDrawingData,
): CollaborativeDrawingApiPayload => ({
  type: BlockKind.COLLABORATIVE_DRAWING,
  prompt: data.prompt.trim(),
  min_subsections: data.min_subsections,
  max_subsections: data.max_subsections,
  drawing_time_seconds: data.drawing_time_seconds,
  total_drawings: data.total_drawings,
});

// The intake phase is opened first for photo collection; it never opens
// straight into a running round.
export const canCollaborativeDrawingOpenImmediately = (
  _data: CollaborativeDrawingData,
  _participants: ParticipantSummary[],
): boolean => true;

export const processCollaborativeDrawingBeforeSubmit = (
  data: CollaborativeDrawingData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): CollaborativeDrawingData => data;

export const collaborativeDrawingPayloadToFormData = (
  payload: CollaborativeDrawingPayload,
): CollaborativeDrawingData => ({
  prompt: payload.prompt,
  min_subsections: payload.min_subsections,
  max_subsections: payload.max_subsections,
  drawing_time_seconds: payload.drawing_time_seconds,
  total_drawings: payload.total_drawings,
});

export default function CreateCollaborativeDrawing({
  data,
  onChange,
}: BlockComponentProps<CollaborativeDrawingData>) {
  const handleNumber =
    (key: keyof CollaborativeDrawingData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      onChange?.({ ...data, [key]: Number.isNaN(value) ? 0 : value });
    };

  return (
    <div className={sharedStyles.container}>
      <TextInput
        label="Photo prompt"
        value={data.prompt}
        onChange={(e) => onChange?.({ ...data, prompt: e.target.value })}
        placeholder="e.g. Submit a photo of your pet"
      />
      <TextInput
        label="Total drawings (unique photos dispatched)"
        type="number"
        min={1}
        value={data.total_drawings || ''}
        onChange={handleNumber('total_drawings')}
      />
      <TextInput
        label="Minimum subsections (horizontal slices)"
        type="number"
        min={1}
        value={data.min_subsections || ''}
        onChange={handleNumber('min_subsections')}
      />
      <TextInput
        label="Maximum subsections (horizontal slices)"
        type="number"
        min={1}
        value={data.max_subsections || ''}
        onChange={handleNumber('max_subsections')}
      />
      <TextInput
        label="Drawing time (seconds)"
        type="number"
        min={1}
        value={data.drawing_time_seconds || ''}
        onChange={handleNumber('drawing_time_seconds')}
      />
    </div>
  );
}
