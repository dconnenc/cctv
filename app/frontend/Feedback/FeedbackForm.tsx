import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { FileVideo, Paperclip, X } from 'lucide-react';

import { Button, TextInput } from '@cctv/core';
import { FEEDBACK_TYPE_LABELS, FeedbackSource, FeedbackType } from '@cctv/types';

import { createFeedback, enrichFeedback } from './api';
import { getConsoleLogs } from './consoleBuffer';
import { buildFeedbackContext } from './feedbackContext';
import { MAX_ATTACHMENTS, useFeedbackUpload } from './useFeedbackUpload';

import styles from './FeedbackForm.module.scss';

const ACCEPTED_FILES =
  'image/png,image/jpeg,image/gif,image/webp,image/heic,video/mp4,video/quicktime,video/webm';

const ALL_FEEDBACK_TYPES = [
  FeedbackType.BUG,
  FeedbackType.EXPERIENCE,
  FeedbackType.GENERAL,
  FeedbackType.OTHER,
];

export interface FeedbackFormProps {
  /** Which report this form files. Block feedback carries its block id. */
  source: FeedbackSource;
  experienceBlockId?: string;
  /** Present when adding detail to an error report the client already filed. */
  enrichFeedbackId?: string;
  availableTypes?: FeedbackType[];
  defaultType?: FeedbackType;
  requireTitle?: boolean;
  submitLabel?: string;
  onSubmitted: () => void;
}

export function FeedbackForm({
  source,
  experienceBlockId,
  enrichFeedbackId,
  availableTypes = ALL_FEEDBACK_TYPES,
  defaultType,
  requireTitle = false,
  submitLabel = 'Send feedback',
  onSubmitted,
}: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(
    defaultType ?? availableTypes[0] ?? FeedbackType.GENERAL,
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    attachments,
    upload,
    remove,
    reset,
    isUploading,
    progress,
    error: uploadError,
  } = useFeedbackUpload();

  // Attachment previews hold object URLs; release them when the drawer closes.
  useEffect(() => reset, [reset]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      void upload(Array.from(files));
    },
    [upload],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) return;

      setIsSubmitting(true);
      setError(null);

      const signedIds = attachments.map((attachment) => attachment.signedId);

      const result = enrichFeedbackId
        ? await enrichFeedback({
            id: enrichFeedbackId,
            feedbackType,
            title: title.trim() || undefined,
            description: description.trim(),
            attachmentSignedIds: signedIds,
          })
        : await createFeedback({
            feedbackType,
            source,
            experienceBlockId,
            title: title.trim() || undefined,
            description: description.trim(),
            context: buildFeedbackContext(experienceBlockId ? { block_id: experienceBlockId } : {}),
            consoleLogs: getConsoleLogs(),
            attachmentSignedIds: signedIds,
          });

      setIsSubmitting(false);

      if (result.success) {
        onSubmitted();
      } else {
        setError(result.error);
      }
    },
    [
      attachments,
      description,
      enrichFeedbackId,
      experienceBlockId,
      feedbackType,
      isSubmitting,
      onSubmitted,
      source,
      title,
    ],
  );

  const canSubmit =
    description.trim().length > 0 && (!requireTitle || title.trim().length > 0) && !isUploading;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {availableTypes.length > 1 && (
        <fieldset className={styles.types}>
          <legend className={styles.legend}>Type</legend>
          <div className={styles.typeOptions}>
            {availableTypes.map((type) => (
              <label key={type} className={styles.typeOption} data-selected={type === feedbackType}>
                <input
                  type="radio"
                  name="feedback_type"
                  value={type}
                  className={styles.typeInput}
                  checked={type === feedbackType}
                  onChange={() => setFeedbackType(type)}
                />
                {FEEDBACK_TYPE_LABELS[type]}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <TextInput
        label={requireTitle ? 'Title' : 'Title (optional)'}
        value={title}
        maxLength={200}
        placeholder="Short summary"
        onChange={(event) => setTitle(event.target.value)}
      />

      <TextInput
        multiline
        label="What happened?"
        value={description}
        rows={5}
        maxLength={10000}
        placeholder="Tell us what you were doing and what you expected."
        onChange={(event) => setDescription(event.target.value)}
      />

      <div className={styles.attachments}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<Paperclip size={16} />}
          disabled={isUploading || attachments.length >= MAX_ATTACHMENTS}
          onClick={() => fileInputRef.current?.click()}
        >
          Attach screenshot or video
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          className={styles.fileInput}
          accept={ACCEPTED_FILES}
          multiple
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = '';
          }}
        />

        {isUploading && (
          <progress className={styles.progress} max={100} value={progress}>
            {progress}%
          </progress>
        )}

        {attachments.length > 0 && (
          <ul className={styles.attachmentList}>
            {attachments.map((attachment) => (
              <li key={attachment.signedId} className={styles.attachment}>
                {attachment.previewUrl ? (
                  <img src={attachment.previewUrl} alt="" className={styles.thumb} />
                ) : (
                  <FileVideo size={20} className={styles.thumbIcon} />
                )}
                <span className={styles.attachmentName}>{attachment.filename}</span>
                <button
                  type="button"
                  className={styles.removeAttachment}
                  aria-label={`Remove ${attachment.filename}`}
                  onClick={() => remove(attachment.signedId)}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(error || uploadError) && (
        <p className={styles.error} role="alert">
          {error ?? uploadError}
        </p>
      )}

      <Button type="submit" disabled={!canSubmit} loading={isSubmitting} loadingText="Sending…">
        {submitLabel}
      </Button>
    </form>
  );
}
