import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts';

export function useFamilyFeudBuckets() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addBucket = useCallback(
    async (blockId: string, name: string = 'New Bucket') => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }
      setIsLoading(true);
      setError(null);

      const url = `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/family_feud/add_bucket`;

      try {
        const res = await experienceFetch(url, {
          method: 'POST',
          body: JSON.stringify({ name }),
        });

        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const msg = data?.error || 'Failed to add bucket';
          setError(msg);
          return null;
        }
        return data.data.bucket;
      } catch (e: any) {
        const msg =
          e?.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch],
  );

  const renameBucket = useCallback(
    async (blockId: string, bucketId: string, name: string) => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }
      setIsLoading(true);
      setError(null);

      const url = `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/family_feud/buckets/${encodeURIComponent(bucketId)}`;

      try {
        const res = await experienceFetch(url, {
          method: 'PATCH',
          body: JSON.stringify({ name }),
        });

        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const msg = data?.error || 'Failed to rename bucket';
          setError(msg);
          return false;
        }
        return true;
      } catch (e: any) {
        const msg =
          e?.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch],
  );

  const deleteBucket = useCallback(
    async (blockId: string, bucketId: string) => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }
      setIsLoading(true);
      setError(null);

      const url = `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/family_feud/buckets/${encodeURIComponent(bucketId)}`;

      try {
        const res = await experienceFetch(url, {
          method: 'DELETE',
        });

        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const msg = data?.error || 'Failed to delete bucket';
          setError(msg);
          return false;
        }
        return true;
      } catch (e: any) {
        const msg =
          e?.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch],
  );

  const assignAnswer = useCallback(
    async (blockId: string, answerId: string, bucketId: string | null) => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }
      setIsLoading(true);
      setError(null);

      const url = `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/family_feud/answers/${encodeURIComponent(answerId)}/bucket`;

      try {
        const res = await experienceFetch(url, {
          method: 'PATCH',
          body: JSON.stringify({ bucket_id: bucketId }),
        });

        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const msg = data?.error || 'Failed to assign answer';
          setError(msg);
          return false;
        }
        return true;
      } catch (e: any) {
        const msg =
          e?.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch],
  );

  return { addBucket, renameBucket, deleteBucket, assignAnswer, isLoading, error, setError };
}
