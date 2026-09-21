import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Block, BlockKind, ParticipantSummary } from '@cctv/types';

import FamilyFeudManager from '../../Block/FamilyFeudManager/FamilyFeudManager';
import GuessWhoManager from '../../Block/GuessWhoManager/GuessWhoManager';
import BlockResponsesList from './BlockResponsesList';
import { VisibilityDetails, hasTargetingRules } from './BlockVisibility';
import MinigameControls from './MinigameControls';

interface BlockContextTabProps {
  block: Block;
  participants: ParticipantSummary[];
}

function VisibilitySection({ block }: { block: Block }) {
  return (
    <div>
      {hasTargetingRules(block) ? (
        <VisibilityDetails block={block} />
      ) : (
        <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded">
          Public
        </span>
      )}
    </div>
  );
}

export default function BlockContextTab({ block, participants }: BlockContextTabProps) {
  const { experience } = useExperience();

  if (block.kind === BlockKind.QUESTION && Boolean(block.payload.synthetic)) {
    const parentBlock = experience?.blocks?.find((b) => b.id === block.parent_block_id);
    if (parentBlock) {
      return <FamilyFeudManager key={block.id} block={parentBlock} focusQuestionId={block.id} />;
    }
  }

  switch (block.kind) {
    case BlockKind.FAMILY_FEUD:
      return (
        <div className="space-y-3">
          <VisibilitySection block={block} />
          <FamilyFeudManager block={block} />
        </div>
      );
    case BlockKind.GUESS_WHO:
      return (
        <div className="space-y-3">
          <VisibilitySection block={block} />
          <GuessWhoManager block={block} />
        </div>
      );
    case BlockKind.MINIGAME_BALLOON_PUMP:
    case BlockKind.MINIGAME_ARITHMETIC:
      return (
        <div className="space-y-4">
          <VisibilitySection block={block} />
          <MinigameControls block={block} />
          <BlockResponsesList block={block} participants={participants} />
        </div>
      );
    case BlockKind.ANNOUNCEMENT:
      return (
        <div className="space-y-3">
          <VisibilitySection block={block} />
          <div className="space-y-2">
            <div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Message</span>
              <p className="text-sm text-white mt-0.5">{block.payload.message}</p>
            </div>
            <div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Monitor</span>
              <p className="text-sm text-white mt-0.5">
                {block.payload.show_on_monitor === false ? 'No' : 'Yes'}
              </p>
            </div>
          </div>
        </div>
      );
    case BlockKind.POLL:
      return (
        <div className="space-y-3">
          <VisibilitySection block={block} />
          <p className="text-sm text-white">{block.payload.question}</p>
          <BlockResponsesList block={block} participants={participants} />
        </div>
      );
    case BlockKind.QUESTION:
      return (
        <div className="space-y-3">
          <VisibilitySection block={block} />
          <p className="text-sm text-white">{block.payload.question}</p>
          <BlockResponsesList block={block} participants={participants} />
        </div>
      );
    case BlockKind.PHOTO_UPLOAD:
      return (
        <div className="space-y-3">
          <VisibilitySection block={block} />
          <p className="text-sm text-white">{block.payload.prompt}</p>
          <BlockResponsesList block={block} participants={participants} />
        </div>
      );
    case BlockKind.BUZZER: {
      const { label, prompt } = block.payload;
      return (
        <div className="space-y-3">
          <VisibilitySection block={block} />
          {(label || prompt) && (
            <div className="space-y-0.5">
              {label && <p className="text-sm text-white">{label}</p>}
              {prompt && <p className="text-sm text-[hsl(var(--muted-foreground))]">{prompt}</p>}
            </div>
          )}
          <BlockResponsesList block={block} participants={participants} />
        </div>
      );
    }
    default:
      return (
        <div className="space-y-3">
          <VisibilitySection block={block} />
          <BlockResponsesList block={block} participants={participants} />
        </div>
      );
  }
}
