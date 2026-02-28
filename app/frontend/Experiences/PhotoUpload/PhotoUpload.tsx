import { useCallback, useRef, useState } from 'react';

import { Camera, Check } from 'lucide-react';

import { Button } from '@cctv/core';
import { useDirectUpload, useSubmitPhotoUploadResponse } from '@cctv/hooks';
import { PhotoUploadBlock } from '@cctv/types';

import styles from './PhotoUpload.module.scss';

interface PhotoUploadProps {
  blockId: string;
  prompt: string;
  responses?: PhotoUploadBlock['responses'];
  disabled?: boolean;
}

export default function PhotoUpload({
  blockId,
  prompt,
  responses,
  disabled = false,
}: PhotoUploadProps) {
  const { upload, isUploading, progress } = useDirectUpload();
  const { submitPhotoUploadResponse, isLoading: isSubmitting } = useSubmitPhotoUploadResponse();
  const [signedId, setSignedId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasResponded = responses?.user_responded;
  const userResponse = responses?.user_response;

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);
      setPreviewUrl(URL.createObjectURL(file));

      try {
        const result = await upload(file);
        setSignedId(result.signedId);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Upload failed';
        setError(msg);
        setPreviewUrl(null);
      }
    },
    [upload],
  );

  const handleSubmit = useCallback(async () => {
    if (!signedId) return;
    setError(null);

    const result = await submitPhotoUploadResponse({
      blockId,
      photoSignedId: signedId,
    });

    if (result && !result.success) {
      setError(result.error || 'Submission failed');
    }
  }, [blockId, signedId, submitPhotoUploadResponse]);

  if (hasResponded && userResponse) {
    return (
      <div className={styles.container}>
        <p className={styles.prompt}>{prompt}</p>
        <div className={styles.submitted}>
          <div className={styles.successBadge}>
            <Check size={16} />
            <span>Photo submitted</span>
          </div>
          {userResponse.photo_url && (
            <img
              src={userResponse.photo_url}
              alt="Your submission"
              className={styles.submittedPhoto}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.prompt}>{prompt}</p>

      {error && <div className={styles.error}>{error}</div>}

      {previewUrl ? (
        <div className={styles.previewWrapper}>
          <img src={previewUrl} alt="Preview" className={styles.preview} />
          {isUploading && (
            <div className={styles.progressOverlay}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      ) : (
        <button
          className={styles.uploadArea}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <Camera size={32} />
          <span>Tap to select a photo</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = '';
        }}
      />

      {signedId && !isUploading && (
        <Button onClick={handleSubmit} loading={isSubmitting} loadingText="Submitting...">
          Submit Photo
        </Button>
      )}
    </div>
  );
}
