import { useMemo, useState } from 'react';

import { CosmeticInventory, DRAW_SIZE, applyCosmetic } from '@cctv/components/Cosmetics';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useUser } from '@cctv/contexts/UserContext';
import { Button } from '@cctv/core';
import { useCosmetics } from '@cctv/hooks/useCosmetics';
import { useSaveAvatar } from '@cctv/hooks/useSaveAvatar';
import { Cosmetic, CosmeticPlacement } from '@cctv/types';

import DrawingCanvas, {
  DrawingCanvasMode,
  DrawingCanvasSubmission,
} from '../DrawingCanvas/DrawingCanvas';

import styles from './LobbyAvatarEditor.module.scss';

export default function LobbyAvatarEditor({
  onFinalize,
  onBack,
}: {
  onFinalize?: () => void;
  onBack?: () => void;
}) {
  const { participant, experiencePerform } = useExperience();
  const { user } = useUser();
  const { saveAvatar } = useSaveAvatar();
  const { cosmetics: ownedCosmetics, isLoading, error } = useCosmetics();

  const [mode, setMode] = useState<DrawingCanvasMode>('draw');

  const initialStrokes = useMemo(
    () => participant?.avatar?.strokes ?? user?.most_recent_avatar?.strokes ?? [],
    [participant?.avatar, user?.most_recent_avatar],
  );

  // A finalized avatar is a flattened image; reload it so re-editing keeps the
  // prior drawing and background (strokes are not preserved by design).
  const initialImage = participant?.avatar?.image ?? user?.most_recent_avatar?.image ?? null;

  const [placements, setPlacements] = useState<CosmeticPlacement[]>(
    () => participant?.avatar?.cosmetics ?? user?.most_recent_avatar?.cosmetics ?? [],
  );

  const handleApplyCosmetic = (cosmetic: Cosmetic) => {
    setPlacements((prev) => applyCosmetic(prev, cosmetic, DRAW_SIZE / 2, DRAW_SIZE / 4));
  };

  return (
    <div className={styles.root}>
      <div className={styles.modeToggle}>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={mode === 'draw'}
          onClick={() => setMode('draw')}
        >
          Draw
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={mode === 'decorate'}
          onClick={() => setMode('decorate')}
        >
          Decorate
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={mode === 'background'}
          onClick={() => setMode('background')}
        >
          Background
        </Button>
      </div>

      <DrawingCanvas
        initialStrokes={initialStrokes}
        initialImage={initialImage}
        cosmetics={placements}
        onCosmeticsChange={setPlacements}
        mode={mode}
        onStrokeEvent={(event) => experiencePerform?.('drawing_event', event)}
        onSubmit={async ({ image, cosmetics }: DrawingCanvasSubmission) => {
          await saveAvatar({ image, cosmetics });
          if (!onBack) onFinalize?.();
        }}
        onBack={onBack}
      />

      {mode === 'decorate' ? (
        <CosmeticInventory
          cosmetics={ownedCosmetics}
          isLoading={isLoading}
          error={error}
          onApply={handleApplyCosmetic}
          onClearFrame={() => setPlacements((prev) => prev.filter((p) => p.category !== 'frame'))}
        />
      ) : null}
    </div>
  );
}
