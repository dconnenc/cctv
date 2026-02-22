import { useCallback, useState } from 'react';

import { DirectUpload } from '@rails/activestorage';

import { useExperience } from '@cctv/contexts';

interface DirectUploadResult {
  signedId: string;
}

export function useDirectUpload() {
  const { jwt } = useExperience();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    (file: File): Promise<DirectUploadResult> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      return new Promise((resolve, reject) => {
        const delegate = {
          directUploadWillCreateBlobWithXHR(xhr: XMLHttpRequest) {
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

        directUpload.create((uploadError, blob) => {
          setIsUploading(false);

          if (uploadError) {
            const msg = uploadError.message || 'Upload failed';
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
