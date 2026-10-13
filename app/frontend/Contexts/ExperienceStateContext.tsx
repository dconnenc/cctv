import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { Experience, ParticipantSummary, SubmissionState } from '@cctv/types';

export interface ExperienceStateContextType {
  experience?: Experience;
  participant?: ParticipantSummary;
  experienceStatus: 'lobby' | 'live';
  error?: string;
  monitorView?: Experience;
  wsReady: boolean;
  setExperience: (exp: Experience | undefined) => void;
  setParticipant: (p: ParticipantSummary | undefined) => void;
  setExperienceStatus: (s: 'lobby' | 'live') => void;
  setError: (err: string | undefined) => void;
  setMonitorView: (exp: Experience | undefined) => void;
  setWsReady: (ready: boolean) => void;
  submissionState: SubmissionState;
  setSubmissionState: Dispatch<SetStateAction<SubmissionState>>;
  resetState: () => void;
}

const ExperienceStateContext = createContext<ExperienceStateContextType | undefined>(undefined);

export function ExperienceStateProvider({ children }: { children: ReactNode }) {
  const [experience, setExperience] = useState<Experience>();
  const [participant, setParticipant] = useState<ParticipantSummary>();
  const [experienceStatus, setExperienceStatus] = useState<'lobby' | 'live'>('lobby');
  const [error, setError] = useState<string>();
  const [monitorView, setMonitorView] = useState<Experience>();
  const [wsReady, setWsReady] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState>({});

  const resetState = useCallback(() => {
    setExperience(undefined);
    setParticipant(undefined);
    setMonitorView(undefined);
    setError(undefined);
    setWsReady(false);
    setSubmissionState({});
  }, []);

  const value = useMemo<ExperienceStateContextType>(
    () => ({
      experience,
      participant,
      experienceStatus,
      error,
      monitorView,
      wsReady,
      setExperience,
      setParticipant,
      setExperienceStatus,
      setError,
      setMonitorView,
      setWsReady,
      submissionState,
      setSubmissionState,
      resetState,
    }),
    [
      experience,
      participant,
      experienceStatus,
      error,
      monitorView,
      wsReady,
      submissionState,
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
