import { Switch } from '@cctv/core';
import { TextInput } from '@cctv/core/TextInput/TextInput';
import {
  BlockComponentProps,
  BlockStatus,
  NewscastersApiPayload,
  NewscastersData,
  NewscastersPayload,
  ParticipantSummary,
} from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';

export const getDefaultNewscastersState = (): NewscastersData => ({
  source_prompt: '',
  allow_upload: false,
});

export const validateNewscasters = (data: NewscastersData): string | null => {
  if (!data.source_prompt.trim()) {
    return 'A prompt for the source block is required';
  }
  return null;
};

export const buildNewscastersPayload = (data: NewscastersData): NewscastersApiPayload => ({
  type: 'newscasters',
  source_prompt: data.source_prompt.trim(),
  allow_upload: data.allow_upload,
});

export const canNewscastersOpenImmediately = (
  _data: NewscastersData,
  _participants: ParticipantSummary[],
): boolean => true;

export const processNewscastersBeforeSubmit = (
  data: NewscastersData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): NewscastersData => data;

// The playback block carries only runtime state; nothing here maps back onto a
// form. Edits are handled through a read-only note (see EditBlock).
export const newscastersPayloadToFormData = (_payload: NewscastersPayload): NewscastersData =>
  getDefaultNewscastersState();

export default function CreateNewscasters({
  data,
  onChange,
}: BlockComponentProps<NewscastersData>) {
  return (
    <div className={sharedStyles.container}>
      <TextInput
        label="Source prompt"
        placeholder="Record your breaking news clip…"
        value={data.source_prompt}
        onChange={(e) => onChange?.({ source_prompt: e.target.value })}
      />
      <p className={sharedStyles.helpText}>
        Adds a companion &ldquo;source&rdquo; block that asks the audience for a video. It is
        created independently so you can move it to the start of the show.
      </p>

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
