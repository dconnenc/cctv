import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { SyntheticGenerationPanel } from './FamilyFeudManager';
import type { QuestionWithBuckets } from './familyFeudReducer';
import { DEFAULT_SYNTHETIC_COUNT } from './synthetic';

const baseQuestion: QuestionWithBuckets = {
  questionId: 'q1',
  questionText: 'Name a vegetable',
  buckets: [],
  unassignedAnswers: [],
  synthetic: true,
  generateCount: DEFAULT_SYNTHETIC_COUNT,
};

const answeredQuestion: QuestionWithBuckets = {
  ...baseQuestion,
  unassignedAnswers: [
    { id: '1', text: 'carrot', participantId: '', userName: 'AI', questionId: 'q1' },
    { id: '2', text: 'broccoli', participantId: '', userName: 'AI', questionId: 'q1' },
    { id: '3', text: 'potato', participantId: '', userName: 'AI', questionId: 'q1' },
  ],
};

const meta: Meta<typeof SyntheticGenerationPanel> = {
  title: 'Block/FamilyFeud/SyntheticGenerationPanel',
  component: SyntheticGenerationPanel,
  // The panel is controlled; wrap it so the inputs are interactive in the story.
  render: (args) => {
    const [questionText, setQuestionText] = useState(args.questionText);
    const [count, setCount] = useState(args.count);
    return (
      <div style={{ maxWidth: 640 }}>
        <SyntheticGenerationPanel
          {...args}
          questionText={questionText}
          count={count}
          onQuestionTextChange={setQuestionText}
          onCountChange={setCount}
        />
      </div>
    );
  },
};
export default meta;

type Story = StoryObj<typeof SyntheticGenerationPanel>;

// Empty question — the Generate button is disabled until a question is entered.
export const Empty: Story = {
  args: {
    question: baseQuestion,
    questionText: '',
    count: DEFAULT_SYNTHETIC_COUNT,
    isGenerating: false,
  },
};

// Question entered, no answers yet — ready to dispatch to the agent.
export const ReadyToGenerate: Story = {
  args: {
    question: baseQuestion,
    questionText: 'Name a vegetable',
    count: DEFAULT_SYNTHETIC_COUNT,
    isGenerating: false,
  },
};

// In-flight request to the agent.
export const Generating: Story = {
  args: {
    question: baseQuestion,
    questionText: 'Name a vegetable',
    count: DEFAULT_SYNTHETIC_COUNT,
    isGenerating: true,
  },
};

// Answers already generated — the action becomes a Reroll.
export const HasAnswers: Story = {
  args: {
    question: answeredQuestion,
    questionText: 'Name a vegetable',
    count: DEFAULT_SYNTHETIC_COUNT,
    isGenerating: false,
  },
};
