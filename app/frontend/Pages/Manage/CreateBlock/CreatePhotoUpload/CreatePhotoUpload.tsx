import { TextInput } from '@cctv/core';
import { BlockKind, BlockStatus, ParticipantSummary } from '@cctv/types';
import { BlockComponentProps, PhotoUploadApiPayload, PhotoUploadData } from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';

export const getDefaultPhotoUploadState = (): PhotoUploadData => {
  return {
    prompt: '',
  };
};

export const validatePhotoUpload = (data: PhotoUploadData): string | null => {
  if (!data.prompt.trim()) {
    return 'Photo upload prompt is required';
  }

  return null;
};

export const buildPhotoUploadPayload = (data: PhotoUploadData): PhotoUploadApiPayload => {
  return {
    type: BlockKind.PHOTO_UPLOAD,
    prompt: data.prompt.trim(),
  };
};

export const canPhotoUploadOpenImmediately = (
  _data: PhotoUploadData,
  _participants: ParticipantSummary[],
): boolean => {
  return true;
};

export const processPhotoUploadBeforeSubmit = (
  data: PhotoUploadData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): PhotoUploadData => {
  return data;
};

export default function CreatePhotoUpload({
  data,
  onChange,
}: BlockComponentProps<PhotoUploadData>) {
  const updateData = (updates: Partial<PhotoUploadData>) => {
    onChange?.(updates);
  };

  return (
    <div className={sharedStyles.container}>
      <TextInput
        label="Prompt"
        placeholder="Upload a photo of..."
        required
        value={data.prompt}
        onChange={(e) => updateData({ prompt: e.target.value })}
      />
    </div>
  );
}
