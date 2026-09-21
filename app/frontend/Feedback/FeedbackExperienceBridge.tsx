import { useEffect } from 'react';

import { useExperience } from '@cctv/contexts';

import { setExperienceSnapshot } from './feedbackContext';

/**
 * Publishes the current experience into the feedback context store. The feedback
 * trigger is mounted above the router so it survives navigation, which puts it
 * outside ExperienceProvider — this headless component bridges the gap rather
 * than forcing the panel to live inside the experience tree. Renders nothing.
 */
export function FeedbackExperienceBridge() {
  const { experience, participant, code } = useExperience();

  const status = experience?.status;
  const participantRole = participant?.role;
  const segmentNames = participant?.segments?.join(',');
  const blockKinds = experience?.blocks?.map((block) => block.kind).join(',');

  useEffect(() => {
    if (!code) {
      setExperienceSnapshot(null);
      return undefined;
    }

    setExperienceSnapshot({
      code,
      status: status ?? 'unknown',
      participantRole: participantRole ?? null,
      segmentNames: segmentNames ? segmentNames.split(',') : [],
      visibleBlockKinds: blockKinds ? blockKinds.split(',') : [],
    });

    return () => setExperienceSnapshot(null);
  }, [code, status, participantRole, segmentNames, blockKinds]);

  return null;
}
