import { ExperienceSegment, ParticipantSummary } from '@cctv/types';

import PanelSidebar from '../Viewer/PanelSidebar';
import ParticipantsTab from './ParticipantsTab';

import styles from './ParticipantsSidebar.module.scss';

interface ParticipantsSidebarProps {
  participants: ParticipantSummary[];
  segments: ExperienceSegment[];
  defaultSegmentId: string | null;
  collapsed: boolean;
  onToggle: () => void;
}

export default function ParticipantsSidebar({
  participants,
  segments,
  defaultSegmentId,
  collapsed,
  onToggle,
}: ParticipantsSidebarProps) {
  return (
    <PanelSidebar
      side="right"
      collapsed={collapsed}
      onToggle={onToggle}
      title="Participants"
      collapsedContent={
        <div className={styles.collapsedLabels}>
          <span className={styles.label}>P</span>
          <span className={styles.label}>S</span>
        </div>
      }
    >
      <ParticipantsTab
        participants={participants}
        segments={segments}
        defaultSegmentId={defaultSegmentId}
      />
    </PanelSidebar>
  );
}
