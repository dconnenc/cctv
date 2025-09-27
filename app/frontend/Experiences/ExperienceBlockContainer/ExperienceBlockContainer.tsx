import { Block, ParticipantSummary } from '@cctv/types';

import Announcement from '../Announcement/Announcement';
import MultistepForm from '../MultistepForm/MultistepForm';
import Poll from '../Poll/Poll';
import Question from '../Question/Question';

interface ExperienceBlockContainerProps {
  block: Block;
  participant: ParticipantSummary;
  disabled?: boolean;
}

export default function ExperienceBlockContainer({
  block,
  participant,
  disabled = false,
}: ExperienceBlockContainerProps) {
  if (!participant) {
    return <p>Do you even go here? You're not part of this!</p>;
  }

  if (!block.payload) {
    return <p>Party's over, everyone go home. Experience not found.</p>;
  }

  switch (block.kind) {
    case 'poll':
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
        />
      );
    case 'question':
      return (
        <Question
          blockId={block.id}
          responses={block.responses}
          {...block.payload}
          disabled={disabled}
        />
      );
    case 'multistep_form':
      return (
        <MultistepForm
          blockId={block.id}
          responses={block.responses}
          {...block.payload}
          disabled={disabled}
        />
      );
    case 'announcement':
      return <Announcement participant={participant} {...block.payload} />;
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
