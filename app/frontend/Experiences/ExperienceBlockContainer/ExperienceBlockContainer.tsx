import {
  AnnouncementBlock,
  Block,
  MultistepFormBlock,
  ParticipantSummary,
  QuestionBlock,
} from '@cctv/types';

import Announcement from '../Announcement/Announcement';
import MultistepForm from '../MultistepForm/MultistepForm';
import Poll from '../Poll/Poll';
import Question from '../Question/Question';

interface ExperienceBlockContainerProps {
  block: Block;
  participant: ParticipantSummary;
}

export default function ExperienceBlockContainer({
  block,
  participant,
}: ExperienceBlockContainerProps) {
  if (!participant) {
    return <p>Participant information is missing.</p>;
  }

  if (!block.payload) {
    return <p>Block configuration is missing.</p>;
  }

  switch (block.kind) {
    case 'poll':
      const { question, options, pollType = 'single' } = block.payload;

      if (!question || !options || !Array.isArray(options)) {
        return <p>This poll is incorrectly configured.</p>;
      }

      return (
        <Poll
          type="poll"
          question={question}
          options={options}
          pollType={pollType}
          participant={participant}
          blockId={block.id}
          responses={block.responses}
        />
      );
    case 'question':
      return (
        <Question
          participant={participant}
          blockId={block.id}
          responses={block.responses}
          {...(block.payload as QuestionBlock)}
        />
      );
    case 'multistep_form':
      return (
        <MultistepForm
          participant={participant}
          blockId={block.id}
          responses={block.responses}
          {...(block.payload as MultistepFormBlock)}
        />
      );
    case 'announcement':
      return <Announcement participant={participant} {...(block.payload as AnnouncementBlock)} />;
    default:
      return (
        <div>
          <p>Unknown block type: {block.kind}</p>
          <pre>{JSON.stringify(block.payload, null, 2)}</pre>
        </div>
      );
  }
}
