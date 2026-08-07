import { useExperience } from '@cctv/contexts/ExperienceContext';

import PlaybillTab from '../PlaybillTab/PlaybillTab';
import ManageSubpage from './ManageSubpage';

export default function ManagePlaybillPage() {
  const { experience } = useExperience();

  return (
    <ManageSubpage title="Playbill">
      <PlaybillTab
        playbill={experience?.playbill || []}
        playbillEnabled={experience?.playbill_enabled !== false}
      />
    </ManageSubpage>
  );
}
