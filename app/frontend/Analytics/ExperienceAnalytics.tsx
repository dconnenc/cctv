import { useEffect, useRef } from 'react';

import { useExperience } from '@cctv/contexts';

import { identifyExperienceGroup, setPersonProperties } from './client';

/**
 * Associates analytics events with the current experience's PostHog group and
 * records the participant's experience role on the person profile. Renders
 * nothing. Must be mounted within ExperienceProvider.
 */
export function ExperienceAnalytics() {
  const { experience, participant, code } = useExperience();
  const groupedId = useRef<string | null>(null);

  const experienceId = experience?.id;
  const experienceName = experience?.name;
  const participantRole = participant?.role;

  useEffect(() => {
    if (!experienceId || groupedId.current === experienceId) return;
    identifyExperienceGroup(experienceId, { code, name: experienceName });
    groupedId.current = experienceId;
  }, [experienceId, experienceName, code]);

  useEffect(() => {
    if (!participantRole) return;
    setPersonProperties({ experience_role: participantRole });
  }, [participantRole]);

  return null;
}
