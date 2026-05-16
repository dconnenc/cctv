import { useCallback, useEffect, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { BlockKind } from '@cctv/types';

export interface ParticipantSubmissionEntry {
  block_id: string;
  block_kind: BlockKind;
  position: number;
  prompt: string;
  answer: { text?: string | null; raw?: unknown; options?: string[]; buzzed_at?: string | null };
  photo_url: string | null;
  submitted_at: string;
}

export function useParticipantSubmissions(participantId: string | null) {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [entries, setEntries] = useState<ParticipantSubmissionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!code || !participantId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await adminFetch(
        `/api/experiences/${encodeURIComponent(code)}/participants/${encodeURIComponent(participantId)}/submissions`,
      );
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        setError(data?.error || 'Failed to fetch submissions');
        setEntries([]);
        return;
      }
      setEntries(data?.data?.submissions ?? []);
    } catch (e: unknown) {
      const msg =
        e instanceof Error && e.message === 'Authentication expired'
          ? 'Authentication expired'
          : 'Connection error. Please try again.';
      setError(msg);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [code, participantId, adminFetch]);

  useEffect(() => {
    if (participantId) fetchEntries();
    else setEntries([]);
  }, [participantId, fetchEntries]);

  return { entries, isLoading, error, refresh: fetchEntries };
}
