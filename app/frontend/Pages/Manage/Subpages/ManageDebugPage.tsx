import { useExperience } from '@cctv/contexts/ExperienceContext';

import DebugPanel from '../Viewer/DebugPanel/DebugPanel';
import ManageSubpage from './ManageSubpage';

export default function ManageDebugPage() {
  const { experience } = useExperience();

  const openBlock = experience?.blocks?.find((block) => block.status === 'open');

  return (
    <ManageSubpage title="Debug">
      <DebugPanel selectedBlock={openBlock} />
    </ManageSubpage>
  );
}
