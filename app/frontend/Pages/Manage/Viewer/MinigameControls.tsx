import { useState } from 'react';

import { Pause, Play, RotateCcw } from 'lucide-react';

import { Button } from '@cctv/core/Button/Button';
import {
  useCollaborativeDrawing,
  useMinigameArithmetic,
  useMinigameBalloonPump,
} from '@cctv/hooks';
import { Block, BlockKind } from '@cctv/types';

type MinigameAction = 'start' | 'end' | 'restart';

interface MinigameActions {
  start: (blockId: string) => Promise<{ success: boolean; error?: string }>;
  end: (blockId: string) => Promise<{ success: boolean; error?: string }>;
  restart: (blockId: string) => Promise<{ success: boolean; error?: string }>;
}

export default function MinigameControls({ block }: { block: Block }) {
  const balloon = useMinigameBalloonPump();
  const arithmetic = useMinigameArithmetic();
  const collaborativeDrawing = useCollaborativeDrawing();
  const [pending, setPending] = useState<MinigameAction | null>(null);

  let game: MinigameActions;
  let status: 'queued' | 'running' | 'ended';
  let startLabel = 'Start minigame';
  let endLabel = 'End minigame';
  let startDisabled = false;

  if (block.kind === BlockKind.COLLABORATIVE_DRAWING) {
    game = {
      start: collaborativeDrawing.startRound,
      end: collaborativeDrawing.endRound,
      restart: collaborativeDrawing.restart,
    };
    const { phase, ended_at } = block.payload;
    status = phase === 'intake' ? 'queued' : ended_at ? 'ended' : 'running';
    startLabel = 'Start round';
    endLabel = 'End round now';
    startDisabled = (block.responses?.total ?? 0) === 0;
  } else if (
    block.kind === BlockKind.MINIGAME_BALLOON_PUMP ||
    block.kind === BlockKind.MINIGAME_ARITHMETIC
  ) {
    game = block.kind === BlockKind.MINIGAME_BALLOON_PUMP ? balloon : arithmetic;
    const { started_at, ended_at } = block.payload;
    status = !started_at ? 'queued' : ended_at ? 'ended' : 'running';
  } else {
    return null;
  }

  const run = (action: MinigameAction) => async () => {
    setPending(action);
    try {
      await game[action](block.id);
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      {status === 'running' ? (
        <Button
          variant="secondary"
          icon={<Pause size={16} />}
          onClick={run('end')}
          loading={pending === 'end'}
          loadingText="Ending..."
        >
          {endLabel}
        </Button>
      ) : (
        <Button
          icon={<Play size={16} />}
          onClick={run('start')}
          loading={pending === 'start'}
          loadingText="Starting..."
          disabled={startDisabled}
        >
          {startLabel}
        </Button>
      )}
      {status !== 'queued' && (
        <Button
          variant="secondary"
          icon={<RotateCcw size={16} />}
          onClick={run('restart')}
          loading={pending === 'restart'}
          loadingText="Restarting..."
        >
          Restart
        </Button>
      )}
    </>
  );
}
