import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Block, BlockKind } from '@cctv/types';

import { SourcesPanel } from './SourcesPanel';

const meta: Meta<typeof SourcesPanel> = {
  title: 'Core/SourcesPanel',
  component: SourcesPanel,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof SourcesPanel>;

const makeQuestion = (id: string, question: string, status: Block['status'] = 'hidden'): Block =>
  ({
    id,
    kind: BlockKind.QUESTION,
    status,
    position: 0,
    payload: { question, formKey: `f_${id}`, inputType: 'text' },
  }) as Block;

const makePoll = (id: string, question: string, status: Block['status'] = 'hidden'): Block =>
  ({
    id,
    kind: BlockKind.POLL,
    status,
    position: 0,
    payload: { question, options: ['A', 'B'], pollType: 'single' },
  }) as Block;

export const Empty: Story = {
  args: {
    sources: [],
    candidates: [
      makeQuestion('q-1', 'Name a fruit'),
      makeQuestion('q-2', 'Name a movie'),
      makePoll('p-1', 'Favorite color?'),
    ],
    onAttach: () => undefined,
    onDetach: () => undefined,
    onReorder: () => undefined,
  },
};

export const Populated: Story = {
  args: {
    sources: [
      makeQuestion('q-1', 'Name a fruit', 'closed'),
      makeQuestion('q-2', 'Name a movie', 'open'),
      makePoll('p-1', 'Favorite color?', 'hidden'),
    ],
    candidates: [makeQuestion('q-3', 'Name a country')],
    onAttach: () => undefined,
    onDetach: () => undefined,
    onReorder: () => undefined,
  },
};

export const NoCandidates: Story = {
  args: {
    sources: [makeQuestion('q-1', 'Already attached', 'closed')],
    candidates: [],
    onAttach: () => undefined,
    onDetach: () => undefined,
    onReorder: () => undefined,
  },
};

export const Busy: Story = {
  args: {
    sources: [makeQuestion('q-1', 'Saving in progress', 'hidden')],
    candidates: [makeQuestion('q-2', 'Another option')],
    busy: true,
    onAttach: () => undefined,
    onDetach: () => undefined,
    onReorder: () => undefined,
  },
};

export const Interactive: Story = {
  render: () => {
    const [sources, setSources] = useState<Block[]>([
      makeQuestion('q-1', 'Name a fruit', 'closed'),
      makeQuestion('q-2', 'Name a movie', 'open'),
    ]);
    const [pool, setPool] = useState<Block[]>([
      makeQuestion('q-3', 'Name a country'),
      makePoll('p-1', 'Favorite color?'),
    ]);

    return (
      <SourcesPanel
        sources={sources}
        candidates={pool}
        onAttach={(id) => {
          const moved = pool.find((b) => b.id === id);
          if (!moved) return;
          setSources([...sources, moved]);
          setPool(pool.filter((b) => b.id !== id));
        }}
        onDetach={(id) => {
          const moved = sources.find((b) => b.id === id);
          if (!moved) return;
          setSources(sources.filter((b) => b.id !== id));
          setPool([...pool, moved]);
        }}
        onReorder={(orderedIds) => {
          const byId = new Map(sources.map((s) => [s.id, s]));
          setSources(orderedIds.map((id) => byId.get(id)!).filter(Boolean));
        }}
      />
    );
  },
};
