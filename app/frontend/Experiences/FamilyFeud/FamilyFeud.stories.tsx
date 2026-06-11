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

export const ShowingXWithSound: Story = {
  args: {
    ...ShowingX.args,
    viewContext: 'monitor',
    sounds: { on_show_x: 'buzzer_error' },
  },
};

// Monitor-only: the theme track loops while `theme_music_playing` is true.
// Toggling the control off in the Storybook controls panel pauses it.
export const ThemeMusicPlaying: Story = {
  args: {
    ...Playing.args,
    viewContext: 'monitor',
    theme_music_playing: true,
    sounds: { theme: 'family_feud_theme' },
  },
};

// Participant view while buckets are still being revealed on the monitor. The
// cards are not yet tappable — the drawers stay locked until every bucket for
// the current question is revealed.
export const ParticipantLocked: Story = {
  args: {
    title: 'Family Feud',
    viewContext: 'participant',
    game_state: {
      phase: 'playing',
      current_question_index: 0,
      show_x: false,
      questions: [
        {
          question_id: 'q1',
          question_text: 'Name something you bring to a picnic',
          buckets: [
            {
              bucket_id: 'b1',
              bucket_name: 'Sandwiches',
              percentage: 35,
              revealed: true,
              answers: [
                { id: 'a1', text: 'PB&J' },
                { id: 'a2', text: 'turkey sub' },
              ],
            },
            {
              bucket_id: 'b2',
              bucket_name: 'Drinks',
              percentage: 25,
              revealed: false,
              answers: [],
            },
            {
              bucket_id: 'b3',
              bucket_name: 'Blanket',
              percentage: 20,
              revealed: false,
              answers: [],
            },
          ],
        },
      ],
    },
  },
};

// Participant view once the whole board is revealed. Each card becomes a toggle;
// tapping one opens its answers drawer and closes any other open card. Answers
// are shown verbatim, including near-duplicates from the crowd.
export const ParticipantExpandable: Story = {
  args: {
    title: 'Family Feud',
    viewContext: 'participant',
    game_state: {
      phase: 'playing',
      current_question_index: 0,
      show_x: false,
      questions: [
        {
          question_id: 'q1',
          question_text: 'Name something you bring to a picnic',
          buckets: [
            {
              bucket_id: 'b1',
              bucket_name: 'Sandwiches',
              percentage: 35,
              revealed: true,
              answers: [
                { id: 'a1', text: 'PB&J' },
                { id: 'a2', text: 'turkey sub' },
                { id: 'a3', text: 'a sandwich' },
                { id: 'a4', text: 'Sandwiches' },
              ],
            },
            {
              bucket_id: 'b2',
              bucket_name: 'Drinks',
              percentage: 25,
              revealed: true,
              answers: [
                { id: 'a5', text: 'soda' },
                { id: 'a6', text: 'lemonade' },
                { id: 'a7', text: 'water bottles' },
              ],
            },
            {
              bucket_id: 'b3',
              bucket_name: 'Blanket',
              percentage: 20,
              revealed: true,
              answers: [
                { id: 'a8', text: 'a blanket' },
                { id: 'a9', text: 'picnic blanket' },
              ],
            },
          ],
        },
      ],
    },
  },
};
