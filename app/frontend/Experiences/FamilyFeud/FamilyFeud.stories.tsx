import type { Meta, StoryObj } from '@storybook/react-vite';

import FamilyFeud from './FamilyFeud';

const meta: Meta<typeof FamilyFeud> = {
  title: 'Experiences/FamilyFeud',
  component: FamilyFeud,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof FamilyFeud>;

export const Gathering: Story = {
  args: {
    title: 'Family Feud',
    game_state: {
      phase: 'gathering',
      current_question_index: 0,
      questions: [],
      show_x: false,
    },
  },
};

export const Playing: Story = {
  args: {
    title: 'Family Feud',
    game_state: {
      phase: 'playing',
      current_question_index: 0,
      show_x: false,
      questions: [
        {
          question_id: 'q1',
          question_text: 'Name something you bring to a picnic',
          buckets: [
            { bucket_id: 'b1', bucket_name: 'Sandwiches', percentage: 35, revealed: true },
            { bucket_id: 'b2', bucket_name: 'Drinks', percentage: 25, revealed: true },
            { bucket_id: 'b3', bucket_name: 'Blanket', percentage: 20, revealed: false },
            { bucket_id: 'b4', bucket_name: 'Snacks', percentage: 12, revealed: false },
            { bucket_id: 'b5', bucket_name: 'Sunscreen', percentage: 8, revealed: false },
          ],
        },
      ],
    },
  },
};

export const ShowingX: Story = {
  args: {
    title: 'Family Feud',
    contained: true,
    game_state: {
      phase: 'playing',
      current_question_index: 0,
      show_x: true,
      questions: [
        {
          question_id: 'q1',
          question_text: 'Name a fruit that is red',
          buckets: [
            { bucket_id: 'b1', bucket_name: 'Apple', percentage: 45, revealed: true },
            { bucket_id: 'b2', bucket_name: 'Strawberry', percentage: 30, revealed: false },
            { bucket_id: 'b3', bucket_name: 'Cherry', percentage: 25, revealed: false },
          ],
        },
      ],
    },
  },
};
