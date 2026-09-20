import { Switch } from '@cctv/core';
import { TextInput } from '@cctv/core/TextInput/TextInput';
import {
  BlockComponentProps,
  BlockStatus,
  NewscastersSourceApiPayload,
  NewscastersSourceData,
  NewscastersSourcePayload,
  ParticipantSummary,
} from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';

export const getDefaultNewscastersSourceState = (): NewscastersSourceData => ({
  prompt: '',
  allow_upload: false,
});

export const validateNewscastersSource = (data: NewscastersSourceData): string | null => {
  if (!data.prompt.trim()) {
    return 'A prompt is required';
  }
  return null;
};

export const buildNewscastersSourcePayload = (
  data: NewscastersSourceData,
): NewscastersSourceApiPayload => ({
  type: 'newscasters_source',
  prompt: data.prompt.trim(),
  allow_upload: data.allow_upload,
});

export const canNewscastersSourceOpenImmediately = (
  _data: NewscastersSourceData,
  _participants: ParticipantSummary[],
): boolean => true;

export const processNewscastersSourceBeforeSubmit = (
  data: NewscastersSourceData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): NewscastersSourceData => data;

export const newscastersSourcePayloadToFormData = (
  payload: NewscastersSourcePayload,
): NewscastersSourceData => ({
  prompt: payload.prompt ?? '',
  allow_upload: payload.allow_upload ?? false,
});

export default function CreateNewscastersSource({
  data,
  onChange,
}: BlockComponentProps<NewscastersSourceData>) {
  return (
    <div className={sharedStyles.container}>
      <TextInput
        label="Prompt"
        placeholder="Record your breaking news clip…"
        value={data.prompt}
        onChange={(e) => onChange?.({ prompt: e.target.value })}
      />

      <label className={sharedStyles.playbillRow}>
        <span>
          Allow direct uploads
          <div className={sharedStyles.playbillHint}>
            When off, the audience can only submit a video link. When on, they can also upload a
            file (60 MB max).
          </div>
        </span>
        <Switch
          checked={data.allow_upload}
          onCheckedChange={(value) => onChange?.({ allow_upload: value })}
        />
      </label>
    </div>
  );
}
