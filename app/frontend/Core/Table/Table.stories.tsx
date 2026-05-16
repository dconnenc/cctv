import type { Meta, StoryObj } from '@storybook/react-vite';

import { Table } from './Table';

interface Player {
  name: string;
  role: string;
  score: number;
}

const meta: Meta<typeof Table<Player>> = {
  title: 'Core/Table',
  component: Table,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Table<Player>>;

const sampleData: Player[] = [
  { name: 'Alice', role: 'Host', score: 100 },
  { name: 'Bob', role: 'Player', score: 85 },
  { name: 'Charlie', role: 'Player', score: 72 },
  { name: 'Diana', role: 'Audience', score: 0 },
];

export const Default: Story = {
  args: {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'score', label: 'Score' },
    ],
    data: sampleData,
  },
};

export const WithCustomCell: Story = {
  args: {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      {
        key: 'score',
        label: 'Score',
        Cell: (row: Player) => (
          <span style={{ color: row.score > 80 ? 'var(--phosphor)' : 'inherit' }}>{row.score}</span>
        ),
      },
    ],
    data: sampleData,
  },
};

export const Empty: Story = {
  args: {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
    ],
    data: [],
    emptyState: <p>No participants yet</p>,
  },
};
