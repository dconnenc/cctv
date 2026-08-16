import { useExperience } from '@cctv/contexts/ExperienceContext';

import ParticipantsTab from '../ParticipantsTab/ParticipantsTab';
import ManageSubpage from './ManageSubpage';

export default function ManageParticipantsPage() {
  const { experience } = useExperience();

  const participants = [...(experience?.hosts || []), ...(experience?.participants || [])];

  return (
    <ManageSubpage title="Participants">
      <ParticipantsTab
        participants={participants}
        segments={experience?.segments || []}
        defaultSegmentId={experience?.default_segment_id ?? null}
      />
    </ManageSubpage>
  );
}
