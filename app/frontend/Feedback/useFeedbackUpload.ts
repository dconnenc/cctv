import { useCallback, useRef, useState } from 'react';

import { Blob as ActiveStorageBlob, DirectUpload } from '@rails/activestorage';

import { feedbackAuthHeaders } from './api';

const UPLOAD_URL = '/rails/active_storage/feedback_direct_uploads';

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;

export interface FeedbackAttachment {
  signedId: string;
  filename: string;
  contentType: string;
  previewUrl: string | null;
}

interface UploadState {
  attachments: FeedbackAttachment[];
  isUploading: boolean;
  progress: number;
  error: string | null;
}

const INITIAL_STATE: UploadState = {
  attachments: [],
  isUploading: false,
  progress: 0,
  error: null,
};

/**
 * Feedback attachments use a dedicated endpoint rather than the block photo
 * uploader: they allow video and a far larger ceiling, and they are reachable
 * outside ExperienceProvider where useDirectUpload cannot get to its JWT.
 */
export function useFeedbackUpload() {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  // Progress is reported per file but shown as one bar, so the loaded/total
  // bytes of every in-flight upload are tracked together.
  const bytesRef = useRef<Map<string, { loaded: number; total: number }>>(new Map());

  const upload = useCallback(async (selected: File[]): Promise<void> => {
    if (selected.length === 0) return;

    const oversized = selected.find((file) => file.size > MAX_ATTACHMENT_BYTES);
    if (oversized) {
      setState((prev) => ({
        ...prev,
        error: `${oversized.name} is larger than ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB`,
      }));
      return;
    }

    let rejected = false;
    setState((prev) => {
      if (prev.attachments.length + selected.length > MAX_ATTACHMENTS) {
        rejected = true;
        return { ...prev, error: `Up to ${MAX_ATTACHMENTS} files` };
      }
      return { ...prev, isUploading: true, progress: 0, error: null };
    });
    if (rejected) return;

    bytesRef.current = new Map();

    const reportProgress = (key: string, loaded: number, total: number) => {
      bytesRef.current.set(key, { loaded, total });

      let loadedSum = 0;
      let totalSum = 0;
      bytesRef.current.forEach((entry) => {
        loadedSum += entry.loaded;
        totalSum += entry.total;
      });

      const progress = totalSum === 0 ? 0 : Math.round((loadedSum / totalSum) * 100);
      setState((prev) => ({ ...prev, progress }));
    };

    try {
      const uploaded = await Promise.all(
        selected.map(async (file, index) => {
          const blob = await directUpload(file, (loaded, total) =>
            reportProgress(`${index}-${file.name}`, loaded, total),
          );

          return {
            signedId: blob.signed_id,
            filename: file.name,
            contentType: file.type,
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
          };
        }),
      );

      setState((prev) => ({
        ...prev,
        isUploading: false,
        progress: 100,
        attachments: [...prev.attachments, ...uploaded],
      }));
    } catch (uploadError) {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: uploadError instanceof Error ? uploadError.message : 'Upload failed',
      }));
    }
  }, []);

  const remove = useCallback((signedId: string) => {
    setState((prev) => {
      const target = prev.attachments.find((item) => item.signedId === signedId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);

      return {
        ...prev,
        attachments: prev.attachments.filter((item) => item.signedId !== signedId),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => {
      prev.attachments.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return INITIAL_STATE;
    });
  }, []);

  return { ...state, upload, remove, reset };
}

function directUpload(
  file: File,
  onProgress: (loaded: number, total: number) => void,
): Promise<ActiveStorageBlob> {
  return new Promise((resolve, reject) => {
    const delegate = {
      directUploadWillCreateBlobWithXHR(xhr: XMLHttpRequest) {
        Object.entries(feedbackAuthHeaders()).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      },
      directUploadWillStoreFileWithXHR(xhr: XMLHttpRequest) {
        xhr.upload.addEventListener('progress', (event: ProgressEvent) => {
          if (event.lengthComputable) onProgress(event.loaded, event.total);
        });
      },
    };

    new DirectUpload(file, UPLOAD_URL, delegate).create((error: Error, blob: ActiveStorageBlob) => {
      if (error) {
        reject(new Error(error.message || 'Upload failed'));
      } else {
        resolve(blob);
      }
    });
  });
}
