import { useCallback, useState } from 'react';

import { Blob as ActiveStorageBlob, DirectUpload } from '@rails/activestorage';

import { useExperience } from '@cctv/contexts';

interface DirectUploadResult {
  signedId: string;
}

// Mirrors the server limit in Api::DirectUploadsController#validate_upload_params.
export const MAX_UPLOAD_BYTES = 7 * 1024 * 1024;
const MAX_UPLOAD_LABEL = '7 MB';

function megabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function serverErrorMessage(xhr: XMLHttpRequest | null): string | null {
  if (!xhr || xhr.status < 400 || !xhr.responseText) return null;
  try {
    const body = JSON.parse(xhr.responseText);
    return body?.error ?? null;
  } catch {
    return null;
  }
}

export function useDirectUpload() {
  const { jwt } = useExperience();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    (file: File): Promise<DirectUploadResult> => {
      setError(null);

      if (!file.type.startsWith('image/')) {
        const msg = 'That file is not an image. Please choose a photo (JPG, PNG, HEIC).';
        setError(msg);
        return Promise.reject(new Error(msg));
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        const msg = `That image is ${megabytes(file.size)} MB. Please choose one under ${MAX_UPLOAD_LABEL}.`;
        setError(msg);
        return Promise.reject(new Error(msg));
      }

      setIsUploading(true);
      setProgress(0);

      return new Promise((resolve, reject) => {
        let blobXhr: XMLHttpRequest | null = null;

        const delegate = {
          directUploadWillCreateBlobWithXHR(xhr: XMLHttpRequest) {
            blobXhr = xhr;
            if (jwt) {
              xhr.setRequestHeader('Authorization', `Bearer ${jwt}`);
            }
          },
          directUploadWillStoreFileWithXHR(xhr: XMLHttpRequest) {
            xhr.upload.addEventListener('progress', (event: ProgressEvent) => {
              if (event.lengthComputable) {
                setProgress(Math.round((event.loaded / event.total) * 100));
              }
            });
          },
        };

        const directUpload = new DirectUpload(
          file,
          '/rails/active_storage/direct_uploads',
          delegate,
        );

        directUpload.create((uploadError: Error, blob: ActiveStorageBlob) => {
          setIsUploading(false);

          if (uploadError) {
            const msg =
              serverErrorMessage(blobXhr) ||
              uploadError.message ||
              'Upload failed. Please try again.';
            setError(msg);
            reject(new Error(msg));
          } else if (blob) {
            setProgress(100);
            resolve({ signedId: blob.signed_id });
          }
        });
      });
    },
    [jwt],
  );

  return { upload, isUploading, progress, error };
}
