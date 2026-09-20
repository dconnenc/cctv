import { useCallback, useRef, useState } from 'react';

import { Check, Link as LinkIcon, Video } from 'lucide-react';

import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';
import { Button } from '@cctv/core';
import { TextInput } from '@cctv/core/TextInput/TextInput';
import { extractYoutubeId } from '@cctv/experiences/Newscasters/youtube';
import { useDirectUpload, useSubmitNewscastersSourceResponse } from '@cctv/hooks';
import { NewscastersSourceBlock } from '@cctv/types';

import styles from './NewscastersSource.module.scss';

const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

interface NewscastersSourceProps {
  blockId: string;
  prompt: string;
  allowUpload: boolean;
  disabled?: boolean;
  viewContext?: 'participant' | 'monitor' | 'manage';
  responses?: NewscastersSourceBlock['responses'];
}

export default function NewscastersSource({
  blockId,
  prompt,
  allowUpload,
  disabled = false,
  viewContext = 'participant',
  responses,
}: NewscastersSourceProps) {
  const { upload, isUploading, progress } = useDirectUpload();
  const { submitNewscastersSourceResponse, isLoading: isSubmitting } =
    useSubmitNewscastersSourceResponse();
  const { submissionState } = useExperienceState();

  const [mode, setMode] = useState<'link' | 'upload'>('link');
  const [linkValue, setLinkValue] = useState('');
  const [signedId, setSignedId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const submission = submissionState[blockId];
  const hasResponded = !!submission;

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      if (file.size > MAX_VIDEO_BYTES) {
        setError('Video must be less than 60 MB');
        return;
      }

      setFileName(file.name);

      try {
        const result = await upload(file);
        setSignedId(result.signedId);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Upload failed';
        setError(msg);
        setFileName(null);
      }
    },
    [upload],
  );

  const handleSubmitLink = useCallback(async () => {
    setError(null);
    const trimmed = linkValue.trim();
    if (!trimmed) return;
    if (!extractYoutubeId(trimmed)) {
      setError('Enter a valid YouTube link');
      return;
    }

    const result = await submitNewscastersSourceResponse({ blockId, videoUrl: trimmed });
    if (result && !result.success) {
      setError(result.error || 'Submission failed');
    }
  }, [blockId, linkValue, submitNewscastersSourceResponse]);

  const handleSubmitUpload = useCallback(async () => {
    if (!signedId) return;
    setError(null);
    const result = await submitNewscastersSourceResponse({ blockId, videoSignedId: signedId });
    if (result && !result.success) {
      setError(result.error || 'Submission failed');
    }
  }, [blockId, signedId, submitNewscastersSourceResponse]);

  if (viewContext === 'monitor') {
    return (
      <div className={styles.container}>
        <p className={styles.prompt}>{prompt}</p>
      </div>
    );
  }

  if (viewContext === 'manage') {
    return (
      <div className={styles.container}>
        <p className={styles.prompt}>{prompt}</p>
        <p className={styles.manageStat}>
          {responses?.total ?? 0} video{(responses?.total ?? 0) === 1 ? '' : 's'} submitted
          {allowUpload ? '' : ' · links only'}
        </p>
      </div>
    );
  }

  if (hasResponded) {
    return (
      <div className={styles.container}>
        <p className={styles.prompt}>{prompt}</p>
        <div className={styles.successBadge}>
          <Check size={16} />
          <span>Video submitted</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.prompt}>{prompt}</p>

      {error && <div className={styles.error}>{error}</div>}

      {allowUpload && (
        <div className={styles.modeToggle} role="group" aria-label="Video source">
          <button
            type="button"
            className={mode === 'link' ? styles.modeActive : styles.mode}
            onClick={() => setMode('link')}
          >
            <LinkIcon size={14} /> Video Link
          </button>
          <button
            type="button"
            className={mode === 'upload' ? styles.modeActive : styles.mode}
            onClick={() => setMode('upload')}
          >
            <Video size={14} /> Upload
          </button>
        </div>
      )}

      {mode === 'link' || !allowUpload ? (
        <>
          <TextInput
            label="YouTube link"
            placeholder="https://youtube.com/watch?v=…"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            disabled={disabled || isSubmitting}
          />
          <Button
            onClick={handleSubmitLink}
            loading={isSubmitting}
            loadingText="Submitting..."
            disabled={!linkValue.trim()}
          >
            Submit Link
          </Button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={styles.uploadArea}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <Video size={32} />
            <span>{fileName ?? 'Tap to select a video'}</span>
          </button>

          {isUploading && (
            <div className={styles.progressOverlay}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = '';
            }}
          />

          {signedId && !isUploading && (
            <Button onClick={handleSubmitUpload} loading={isSubmitting} loadingText="Submitting...">
              Submit Video
            </Button>
          )}
        </>
      )}
    </div>
  );
}
