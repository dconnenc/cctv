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

function responseCount(block: Block): number {
  const { responses } = block;
  if (!responses || !('all_responses' in responses)) return 0;
  return responses.all_responses?.length ?? 0;
}

function configText(block: Block): string | null {
  switch (block.kind) {
    case BlockKind.ANNOUNCEMENT:
    case BlockKind.QUESTION:
    case BlockKind.POLL:
    case BlockKind.PHOTO_UPLOAD:
    case BlockKind.BUZZER:
      break;
    default:
      return null;
  }
  if (block.kind === BlockKind.ANNOUNCEMENT) return block.payload.message ?? null;
  if (block.kind === BlockKind.QUESTION || block.kind === BlockKind.POLL)
    return block.payload.question ?? null;
  if (block.kind === BlockKind.PHOTO_UPLOAD) return block.payload.prompt ?? null;
  if (block.kind === BlockKind.BUZZER) return block.payload.label || block.payload.prompt || null;
  return null;
}

function MetadataRow({ block }: { block: Block }) {
  const text = configText(block);
  const count = responseCount(block);
  const showCount =
    block.kind !== BlockKind.ANNOUNCEMENT &&
    block.kind !== BlockKind.FAMILY_FEUD &&
    block.kind !== BlockKind.MINIGAME_BALLOON_PUMP &&
    block.kind !== BlockKind.MINIGAME_ARITHMETIC;

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs text-[hsl(var(--muted-foreground))]">
      {hasTargetingRules(block) ? (
        <VisibilityDetails block={block} />
      ) : (
        <span className="bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded">Public</span>
      )}
      {text && (
        <>
          <span>·</span>
          <span className="text-white truncate max-w-xs">{text}</span>
        </>
      )}
      {block.kind === BlockKind.ANNOUNCEMENT && (
        <>
          <span>·</span>
          <span>Monitor: {block.payload.show_on_monitor === false ? 'No' : 'Yes'}</span>
        </>
      )}
      {showCount && count > 0 && (
        <>
          <span>·</span>
          <span>
            {count} {count === 1 ? 'response' : 'responses'}
          </span>
        </>
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
          <MetadataRow block={block} />
          <FamilyFeudManager block={block} />
        </div>
      );
    case BlockKind.GUESS_WHO:
      return (
        <div className="space-y-3">
          <MetadataRow block={block} />
          <GuessWhoManager block={block} />
        </div>
      );
    case BlockKind.MINIGAME_BALLOON_PUMP:
    case BlockKind.MINIGAME_ARITHMETIC:
      return (
        <div className="space-y-4">
          <MetadataRow block={block} />
          <MinigameControls block={block} />
          <BlockResponsesList block={block} participants={participants} />
        </div>
      );
    case BlockKind.ANNOUNCEMENT:
      return <MetadataRow block={block} />;
    case BlockKind.POLL:
      return (
        <div className="space-y-3">
          <MetadataRow block={block} />
          <BlockResponsesList block={block} participants={participants} />
        </div>
      );
    case BlockKind.QUESTION:
      return (
        <div className="space-y-3">
          <MetadataRow block={block} />
          <BlockResponsesList block={block} participants={participants} />
        </div>
      );
    case BlockKind.PHOTO_UPLOAD:
      return (
        <div className="space-y-3">
          <MetadataRow block={block} />
          <BlockResponsesList block={block} participants={participants} />
        </div>
      );
    case BlockKind.BUZZER:
      return (
        <div className="space-y-3">
          <MetadataRow block={block} />
          <BlockResponsesList block={block} participants={participants} />
        </div>
      );
    default:
      return (
        <div className="space-y-3">
          <MetadataRow block={block} />
          <BlockResponsesList block={block} participants={participants} />
        </div>
      );
  }
}
