import { ReactNode, useEffect, useRef } from 'react';

import { useExperienceState } from '../app/frontend/Contexts/ExperienceStateContext';
import { useLobbyDrawingDispatch } from '../app/frontend/Contexts/LobbyDrawingContext';
import { Experience, ParticipantSummary, SubmissionState } from '../app/frontend/types';

interface ExperienceSeederProps {
  experience?: Experience;
  participant?: ParticipantSummary;
  experienceStatus?: 'lobby' | 'live';
  monitorView?: Experience;
  submissionState?: SubmissionState;
  children: ReactNode;
}

export function ExperienceSeeder({
  experience,
  participant,
  experienceStatus = 'lobby',
  monitorView,
  submissionState,
  children,
}: ExperienceSeederProps) {
  const state = useExperienceState();
  const drawDispatch = useLobbyDrawingDispatch();
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;

    if (experience) state.setExperience(experience);
    if (participant) state.setParticipant(participant);
    state.setExperienceStatus(experienceStatus);
    state.setWsReady(true);
    if (monitorView) state.setMonitorView(monitorView);
    if (submissionState) state.setSubmissionState(submissionState);

    const source = monitorView || experience;
    if (source) {
      const allParticipants = [...(source.participants || []), ...(source.hosts || [])];
      for (const p of allParticipants) {
        if (p.avatar?.strokes?.length) {
          drawDispatch({
            type: 'drawing_update',
            participant_id: p.id,
            operation: 'avatar_committed',
            data: { strokes: p.avatar.strokes },
          });
        }
      }
    }
  }, [
    experience,
    participant,
    experienceStatus,
    monitorView,
    submissionState,
    state,
    drawDispatch,
  ]);

  return <>{children}</>;
}
