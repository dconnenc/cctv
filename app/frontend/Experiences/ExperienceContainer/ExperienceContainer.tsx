import { Experience, ParticipantWithRole } from '@cctv/types';

import MultistepForm from '../MultistepForm/MultistepForm';
import Poll from '../Poll/Poll';
import Question from '../Question/Question';

export default function ExperienceContainer({
  experience,
  user,
}: {
  experience: Experience;
  user: ParticipantWithRole;
}) {
  switch (experience.type) {
    case 'poll':
      return <Poll user={user} {...experience} />;
    case 'question':
      return <Question user={user} {...experience} />;
    case 'multistep_form':
      return <MultistepForm user={user} {...experience} />;
    default:
      return null;
  }
}
