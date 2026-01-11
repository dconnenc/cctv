import { Block, BlockKind, ParticipantSummary } from '@cctv/types';

import Announcement from '../Announcement/Announcement';
import FamilyFeud from '../FamilyFeud/FamilyFeud';
import MadLib from '../MadLib/MadLib';
import MultistepForm from '../MultistepForm/MultistepForm';
import Poll from '../Poll/Poll';
import Question from '../Question/Question';

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
    case BlockKind.MULTISTEP_FORM:
      return (
        <MultistepForm
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
      return <FamilyFeud {...block.payload} />;
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
