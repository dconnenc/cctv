import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Block, BlockKind, ParticipantSummary } from '@cctv/types';

import FamilyFeudManager from '../../Block/FamilyFeudManager/FamilyFeudManager';
import GuessWhoManager from '../../Block/GuessWhoManager/GuessWhoManager';
import BlockResponsesList from './BlockResponsesList';
import MinigameControls from './MinigameControls';

interface BlockContextTabProps {
  block: Block;
  participants: ParticipantSummary[];
}

export default function BlockContextTab({ block, participants }: BlockContextTabProps) {
  const { experience } = useExperience();

  // Synthetic questions (Family Feud AI-generated) have no participant view.
  // Show the parent FamilyFeudManager focused on this specific question.
  if (block.kind === BlockKind.QUESTION && Boolean(block.payload.synthetic)) {
    const parentBlock = experience?.blocks?.find((b) => b.id === block.parent_block_id);
    if (parentBlock) {
      return <FamilyFeudManager key={block.id} block={parentBlock} focusQuestionId={block.id} />;
    }
  }

  switch (block.kind) {
    case BlockKind.FAMILY_FEUD:
      return <FamilyFeudManager block={block} />;
    case BlockKind.GUESS_WHO:
      return <GuessWhoManager block={block} />;
    case BlockKind.MINIGAME_BALLOON_PUMP:
    case BlockKind.MINIGAME_ARITHMETIC:
      return (
        <div className="space-y-4">
          <MinigameControls block={block} />
          <BlockResponsesList block={block} participants={participants} />
        </div>
      );
    case BlockKind.ANNOUNCEMENT:
      return null;
    default:
      return <BlockResponsesList block={block} participants={participants} />;
  }
}
