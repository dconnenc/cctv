import { useState } from 'react';

import { Pause, Play, RotateCcw } from 'lucide-react';

import { Button } from '@cctv/core/Button/Button';
import { useMinigameArithmetic, useMinigameBalloonPump } from '@cctv/hooks';
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
  const [pending, setPending] = useState<MinigameAction | null>(null);

  if (
    block.kind !== BlockKind.MINIGAME_BALLOON_PUMP &&
    block.kind !== BlockKind.MINIGAME_ARITHMETIC
  ) {
    return null;
  }

  const game: MinigameActions =
    block.kind === BlockKind.MINIGAME_BALLOON_PUMP ? balloon : arithmetic;
  const { started_at, ended_at } = block.payload;
  const status = !started_at ? 'queued' : ended_at ? 'ended' : 'running';

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
          End minigame
        </Button>
      ) : (
        <Button
          icon={<Play size={16} />}
          onClick={run('start')}
          loading={pending === 'start'}
          loadingText="Starting..."
        >
          Start minigame
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
