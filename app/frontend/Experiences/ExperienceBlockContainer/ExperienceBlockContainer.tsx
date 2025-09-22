import { Block, ParticipantWithRole } from '@cctv/types';
import Poll from '../Poll/Poll';
import Question from '../Question/Question';
import MultistepForm from '../MultistepForm/MultistepForm';

interface ExperienceBlockContainerProps {
  block: Block;
  user: ParticipantWithRole;
}

export default function ExperienceBlockContainer({
  block,
  user,
}: ExperienceBlockContainerProps) {
  if (!user) {
    return <p>User information is missing.</p>;
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
          user={user}
          blockId={block.id}
          responses={block.responses}
        />
      );
    case 'question':
      return <Question user={user} {...block.payload} />;
    case 'multistep_form':
      return <MultistepForm user={user} {...block.payload} />;
    default:
      return (
        <div>
          <p>Unknown block type: {block.kind}</p>
          <pre>{JSON.stringify(block.payload, null, 2)}</pre>
        </div>
      );
  }
}
