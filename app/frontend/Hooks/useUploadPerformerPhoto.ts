import { useCallback, useState } from 'react';

import { Blob as ActiveStorageBlob, DirectUpload } from '@rails/activestorage';

import { Performer } from '@cctv/types';

interface UploadPerformerPhotoResult {
  performer: Performer;
  error?: string;
}

export function useUploadPerformerPhoto() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = useCallback(
    async (file: File, slug: string): Promise<UploadPerformerPhotoResult | null> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const signedId = await new Promise<string>((resolve, reject) => {
          const delegate = {
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
            if (uploadError) {
              reject(uploadError);
            } else {
              setProgress(100);
              resolve(blob.signed_id);
            }
          });
        });

        const res = await fetch(`/api/performers/${encodeURIComponent(slug)}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo: signedId }),
        });

        const data: UploadPerformerPhotoResult = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to update performer photo');
        }

        return data;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Upload failed';
        setError(msg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  return { uploadPhoto, isUploading, progress, error };
}
