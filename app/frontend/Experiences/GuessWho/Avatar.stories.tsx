import type { Meta, StoryObj } from '@storybook/react-vite';

import Avatar from './Avatar';

// A tiny flattened drawing (a face) as an SVG data URL, standing in for the PNG
// a real avatar flattens to.
const FACE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
  <circle cx="160" cy="170" r="90" fill="#c8f060"/>
  <circle cx="130" cy="150" r="10" fill="#080808"/>
  <circle cx="190" cy="150" r="10" fill="#080808"/>
  <path d="M120 200 Q160 230 200 200" stroke="#080808" stroke-width="6" fill="none"/>
</svg>`;
const faceImage = `data:image/svg+xml,${encodeURIComponent(FACE_SVG)}`;

const meta: Meta<typeof Avatar> = {
  title: 'Experiences/GuessWho/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: { size: 192 },
};
export default meta;

type Story = StoryObj<typeof Avatar>;

export const FlattenedImage: Story = {
  args: {
    avatar: { image: faceImage, cosmetics: [] },
  },
};

export const FlattenedWithHat: Story = {
  args: {
    avatar: {
      image: faceImage,
      cosmetics: [
        {
          cosmetic_id: 'hat-1',
          slug: 'top-hat',
          asset_key: 'hat',
          category: 'clothing',
          x: 100,
          y: 20,
          width: 120,
          height: 96,
          rotation: 0,
        },
      ],
    },
  },
};

export const FlattenedWithFrame: Story = {
  args: {
    avatar: {
      image: faceImage,
      cosmetics: [
        {
          cosmetic_id: 'frame-1',
          slug: 'beta-tester-frame',
          asset_key: 'beta_tester_frame',
          category: 'frame',
          x: 0,
          y: 0,
          width: 320,
          height: 320,
          rotation: 0,
        },
      ],
    },
  },
};

export const LegacyStrokes: Story = {
  args: {
    avatar: {
      strokes: [
        { points: [80, 60, 160, 60, 160, 140, 80, 140, 80, 60], color: '#c8f060', width: 4 },
        { points: [100, 90, 120, 80, 140, 90], color: '#ff4911', width: 3 },
      ],
    },
  },
};

export const Empty: Story = {
  args: {
    avatar: null,
  },
};
