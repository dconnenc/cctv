import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';

export function useCreateSegment() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSegment = useCallback(
    async (name: string, color: string) => {
      if (!code) return null;
      setIsLoading(true);
      setError(null);
      try {
        const res = await adminFetch(`/api/experiences/${encodeURIComponent(code)}/segments`, {
          method: 'POST',
          body: JSON.stringify({ name, color }),
        });
        const data = await res.json();
        if (!data?.success) {
          setError(data?.error || 'Failed to create segment');
          return null;
        }
        return data.data;
      } catch {
        setError('Connection error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [code, adminFetch],
  );

  return { createSegment, isLoading, error };
}

export function useUpdateSegment() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSegment = useCallback(
    async (segmentId: string, attrs: { name?: string; color?: string }) => {
      if (!code) return null;
      setIsLoading(true);
      setError(null);
      try {
        const res = await adminFetch(
          `/api/experiences/${encodeURIComponent(code)}/segments/${segmentId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(attrs),
          },
        );
        const data = await res.json();
        if (!data?.success) {
          setError(data?.error || 'Failed to update segment');
          return null;
        }
        return data.data;
      } catch {
        setError('Connection error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [code, adminFetch],
  );

  return { updateSegment, isLoading, error };
}

export function useDeleteSegment() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSegment = useCallback(
    async (segmentId: string) => {
      if (!code) return false;
      setIsLoading(true);
      setError(null);
      try {
        const res = await adminFetch(
          `/api/experiences/${encodeURIComponent(code)}/segments/${segmentId}`,
          { method: 'DELETE' },
        );
        const data = await res.json();
        if (!data?.success) {
          setError(data?.error || 'Failed to delete segment');
          return false;
        }
        return true;
      } catch {
        setError('Connection error');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [code, adminFetch],
  );

  return { deleteSegment, isLoading, error };
}

export function useAssignSegment() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignSegment = useCallback(
    async (segmentId: string, participantIds: string[], assignAction: 'add' | 'remove' = 'add') => {
      if (!code) return false;
      setIsLoading(true);
      setError(null);
      try {
        const res = await adminFetch(
          `/api/experiences/${encodeURIComponent(code)}/segments/${segmentId}/assign`,
          {
            method: 'POST',
            body: JSON.stringify({ participant_ids: participantIds, assign_action: assignAction }),
          },
        );
        const data = await res.json();
        if (!data?.success) {
          setError(data?.error || 'Failed to assign segment');
          return false;
        }
        return true;
      } catch {
        setError('Connection error');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [code, adminFetch],
  );

  return { assignSegment, isLoading, error };
}
