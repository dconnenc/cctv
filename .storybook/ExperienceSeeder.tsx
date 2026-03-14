import { ReactNode, useEffect } from 'react';

import { useExperienceState } from '../app/frontend/Contexts/ExperienceStateContext';
import { Experience, ParticipantSummary } from '../app/frontend/types';

interface ExperienceSeederProps {
  experience?: Experience;
  participant?: ParticipantSummary;
  experienceStatus?: 'lobby' | 'live';
  monitorView?: Experience;
  children: ReactNode;
}

export function ExperienceSeeder({
  experience,
  participant,
  experienceStatus = 'lobby',
  monitorView,
  children,
}: ExperienceSeederProps) {
  const state = useExperienceState();

  useEffect(() => {
    if (experience) state.setExperience(experience);
    if (participant) state.setParticipant(participant);
    state.setExperienceStatus(experienceStatus);
    state.setWsReady(true);
    if (monitorView) state.setMonitorView(monitorView);
  }, []);

  return <>{children}</>;
}
