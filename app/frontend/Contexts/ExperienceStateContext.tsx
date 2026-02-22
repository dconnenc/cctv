import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';

import { Experience, ParticipantSummary } from '@cctv/types';

export interface ExperienceStateContextType {
  experience?: Experience;
  participant?: ParticipantSummary;
  experienceStatus: 'lobby' | 'live';
  error?: string;
  monitorView?: Experience;
  participantView?: Experience;
  impersonatedParticipantId?: string;
  setExperience: (exp: Experience | undefined) => void;
  setParticipant: (p: ParticipantSummary | undefined) => void;
  setExperienceStatus: (s: 'lobby' | 'live') => void;
  setError: (err: string | undefined) => void;
  setMonitorView: (exp: Experience | undefined) => void;
  setParticipantView: (exp: Experience | undefined) => void;
  setImpersonatedParticipantId: (id: string | undefined) => void;
  resetState: () => void;
}

const ExperienceStateContext = createContext<ExperienceStateContextType | undefined>(undefined);

export function ExperienceStateProvider({ children }: { children: ReactNode }) {
  const [experience, setExperience] = useState<Experience>();
  const [participant, setParticipant] = useState<ParticipantSummary>();
  const [experienceStatus, setExperienceStatus] = useState<'lobby' | 'live'>('lobby');
  const [error, setError] = useState<string>();
  const [monitorView, setMonitorView] = useState<Experience>();
  const [participantView, setParticipantView] = useState<Experience>();
  const [impersonatedParticipantId, setImpersonatedParticipantId] = useState<string>();

  const resetState = useCallback(() => {
    setExperience(undefined);
    setParticipant(undefined);
    setMonitorView(undefined);
    setParticipantView(undefined);
    setError(undefined);
  }, []);

  const value = useMemo<ExperienceStateContextType>(
    () => ({
      experience,
      participant,
      experienceStatus,
      error,
      monitorView,
      participantView,
      impersonatedParticipantId,
      setExperience,
      setParticipant,
      setExperienceStatus,
      setError,
      setMonitorView,
      setParticipantView,
      setImpersonatedParticipantId,
      resetState,
    }),
    [
      experience,
      participant,
      experienceStatus,
      error,
      monitorView,
      participantView,
      impersonatedParticipantId,
      resetState,
    ],
  );

  return (
    <ExperienceStateContext.Provider value={value}>{children}</ExperienceStateContext.Provider>
  );
}

export function useExperienceState() {
  const context = useContext(ExperienceStateContext);
  if (context === undefined) {
    throw new Error('useExperienceState must be used within an ExperienceStateProvider');
  }
  return context;
}
