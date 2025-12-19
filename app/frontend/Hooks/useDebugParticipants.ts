import { useCallback, useMemo, useState } from 'react';

import { useExperience } from '@cctv/contexts';

export interface DebugParticipant {
  id: string;
  user_id: string;
  name: string;
  email: string;
  jwt?: string;
}

export function useDebugParticipants() {
  const { code, experienceFetch, experience } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdParticipants, setCreatedParticipants] = useState<DebugParticipant[]>([]);
  const [participantJwts, setParticipantJwts] = useState<Map<string, string>>(new Map());

  // Get existing participants from the experience (hosts + participants)
  const existingParticipants = useMemo<DebugParticipant[]>(() => {
    if (!experience) return [];
    const hosts = (experience.hosts || []).map((p) => ({
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      email: p.email,
      jwt: participantJwts.get(p.id),
    }));
    const participants = (experience.participants || []).map((p) => ({
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      email: p.email,
      jwt: participantJwts.get(p.id),
    }));
    return [...hosts, ...participants];
  }, [experience, participantJwts]);

  // Combine existing participants with any created debug participants
  const allParticipants = useMemo<DebugParticipant[]>(() => {
    const existingIds = new Set(existingParticipants.map((p) => p.id));
    const uniqueCreated = createdParticipants.filter((p) => !existingIds.has(p.id));
    return [...existingParticipants, ...uniqueCreated];
  }, [existingParticipants, createdParticipants]);

  // Participants that have JWTs (can be used for simulation)
  const simulatableParticipants = useMemo<DebugParticipant[]>(() => {
    return allParticipants.filter((p) => p.jwt);
  }, [allParticipants]);

  const createParticipants = useCallback(
    async (count: number): Promise<DebugParticipant[]> => {
      if (!code) {
        setError('Missing experience code');
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await experienceFetch(
          `/api/experiences/${encodeURIComponent(code)}/debug/create_participants`,
          {
            method: 'POST',
            body: JSON.stringify({ count }),
          },
        );

        const data = await res.json();

        if (!res.ok || !data?.success) {
          const msg = data?.error || 'Failed to create debug participants';
          setError(msg);
          return [];
        }

        const newParticipants = data.participants as DebugParticipant[];
        setCreatedParticipants((prev) => [...prev, ...newParticipants]);

        // Also store JWTs in the map so they persist when participants move to existingParticipants
        setParticipantJwts((prev) => {
          const newMap = new Map(prev);
          for (const p of newParticipants) {
            if (p.jwt) {
              newMap.set(p.id, p.jwt);
            }
          }
          return newMap;
        });

        return newParticipants;
      } catch (e: any) {
        const msg =
          e?.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch],
  );

  const clearParticipants = useCallback(() => {
    setCreatedParticipants([]);
    setParticipantJwts(new Map());
  }, []);

  // Fetch JWTs for existing participants so they can be used for simulation
  const fetchJwtsForExisting = useCallback(async (): Promise<void> => {
    if (!code || existingParticipants.length === 0) {
      return;
    }

    // Only fetch for participants that don't already have JWTs
    const participantsNeedingJwts = existingParticipants.filter((p) => !p.jwt);
    if (participantsNeedingJwts.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await experienceFetch(
        `/api/experiences/${encodeURIComponent(code)}/debug/get_participant_jwts`,
        {
          method: 'POST',
          body: JSON.stringify({ participant_ids: participantsNeedingJwts.map((p) => p.id) }),
        },
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        const msg = data?.error || 'Failed to fetch participant JWTs';
        setError(msg);
        return;
      }

      const participantsWithJwts = data.participants as DebugParticipant[];
      setParticipantJwts((prev) => {
        const newMap = new Map(prev);
        for (const p of participantsWithJwts) {
          if (p.jwt) {
            newMap.set(p.id, p.jwt);
          }
        }
        return newMap;
      });
    } catch (e: any) {
      const msg =
        e?.message === 'Authentication expired'
          ? 'Authentication expired'
          : 'Connection error. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [code, experienceFetch, existingParticipants]);

  return {
    createParticipants,
    clearParticipants,
    fetchJwtsForExisting,
    participants: allParticipants,
    existingParticipants,
    createdParticipants,
    simulatableParticipants,
    isLoading,
    error,
    setError,
  };
}
