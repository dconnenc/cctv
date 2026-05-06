import { Block, BlockKind, ParticipantSummary } from '@cctv/types';

import Announcement from '../Announcement/Announcement';
import Buzzer from '../Buzzer/Buzzer';
import FamilyFeud from '../FamilyFeud/FamilyFeud';
import GuessWho from '../GuessWho/GuessWho';
import MadLib from '../MadLib/MadLib';
import MinigameArithmetic from '../MinigameArithmetic/MinigameArithmetic';
import MinigameBalloonPump from '../MinigameBalloonPump/MinigameBalloonPump';
import PhotoUpload from '../PhotoUpload/PhotoUpload';
import Poll from '../Poll/Poll';
import Question from '../Question/Question';
import TheScene from '../TheScene/TheScene';

interface ExperienceBlockContainerProps {
  block: Block;
  participant?: ParticipantSummary;
  disabled?: boolean;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

export default function ExperienceBlockContainer({
  block,
  participant,
  disabled = false,
  viewContext = 'participant',
}: ExperienceBlockContainerProps) {
  if (!block.payload) {
    return <p>Party's over, everyone go home.</p>;
  }

  switch (block.kind) {
    case BlockKind.POLL:
      const { question, options, pollType = 'single' } = block.payload;

      if (!question || !options || !Array.isArray(options)) {
        return <p>This poll is incorrectly configured.</p>;
      }

      return (
        <Poll
          question={question}
          options={options}
          pollType={pollType}
          blockId={block.id}
          responses={block.responses}
          disabled={disabled}
          viewContext={viewContext}
        />
      );
    case BlockKind.QUESTION:
      return (
        <Question
          blockId={block.id}
          responses={block.responses}
          {...block.payload}
          disabled={disabled}
          viewContext={viewContext}
        />
      );
    case BlockKind.ANNOUNCEMENT:
      return <Announcement participant={participant} {...block.payload} />;
    case BlockKind.MAD_LIB:
      return <MadLib responses={block.responses} parts={block.payload.parts} />;
    case BlockKind.FAMILY_FEUD:
      return <FamilyFeud {...block.payload} contained={viewContext !== 'participant'} />;
    case BlockKind.PHOTO_UPLOAD:
      return (
        <PhotoUpload
          blockId={block.id}
          prompt={block.payload.prompt}
          responses={block.responses}
          disabled={disabled}
        />
      );
    case BlockKind.BUZZER:
      return <Buzzer block={block} viewContext={viewContext} />;
    case BlockKind.GUESS_WHO:
      return <GuessWho payload={block.payload} />;
    case BlockKind.MINIGAME_ARITHMETIC:
      return <MinigameArithmetic block={block} viewContext={viewContext} />;
    case BlockKind.MINIGAME_BALLOON_PUMP:
      return <MinigameBalloonPump block={block} viewContext={viewContext} />;
    case BlockKind.THE_SCENE:
      return <TheScene block={block} viewContext={viewContext} />;
    default:
      const exhaustiveCheck: never = block;
      return (
        <div>
          <p>Unknown block type</p>
          <pre>{JSON.stringify(exhaustiveCheck, null, 2)}</pre>
        </div>
      );
  }
}
