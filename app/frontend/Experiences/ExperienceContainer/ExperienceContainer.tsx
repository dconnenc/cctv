import { Experience, Participant } from '@cctv/types';

import Poll from '../Poll/Poll';

export default function ExperienceContainer({
  experience,
  user,
}: {
  experience: Experience;
  user: Participant;
}) {
  switch (experience.type) {
    case 'poll':
      return <Poll user={user} {...experience} />;
    default:
      return null;
  }
}
