import { useState } from 'react';

import { Button } from '@cctv/core/Button/Button';
import { CompositeCanvas } from '@cctv/experiences';
import { useCollaborativeDrawing } from '@cctv/hooks';
import { CollaborativeDrawingBlock } from '@cctv/types';

import styles from './CollaborativeDrawingManager.module.scss';

interface Props {
  block: CollaborativeDrawingBlock;
}

export default function CollaborativeDrawingManager({ block }: Props) {
  const { phase, round_started_at, composites, composites_revealed, total_drawings } =
    block.payload;
  const photos = block.responses?.photos ?? [];
  const showSelector = phase === 'round' && !round_started_at;
  const hasComposites = !!composites && composites.length > 0;

  if (!showSelector && !hasComposites) return null;

  return (
    <div className={styles.root}>
      {showSelector && (
        <PhotoSelector block={block} totalDrawings={total_drawings} photos={photos} />
      )}
      {hasComposites && (
        <CompositeDispatch block={block} composites={composites} revealed={!!composites_revealed} />
      )}
    </div>
  );
}

function PhotoSelector({
  block,
  totalDrawings,
  photos,
}: {
  block: CollaborativeDrawingBlock;
  totalDrawings: number;
  photos: NonNullable<CollaborativeDrawingBlock['responses']>['photos'];
}) {
  const { selectPhotos } = useCollaborativeDrawing();
  const [selected, setSelected] = useState<string[]>(block.responses?.selected_photo_ids ?? []);
  const items = photos ?? [];

  if (items.length === 0) {
    return <p className={styles.hint}>No photos submitted yet.</p>;
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      void selectPhotos(block.id, next);
      return next;
    });
  };

  return (
    <div className={styles.section}>
      <p className={styles.hint}>
        Choose up to {totalDrawings} photo{totalDrawings === 1 ? '' : 's'} for the round
        {selected.length > 0 ? ` (${selected.length} selected)` : ' — random if none'}
      </p>
      <div className={styles.grid}>
        {items.map((photo) => {
          const isSelected = selected.includes(photo.id);
          const order = selected.indexOf(photo.id);
          return (
            <button
              key={photo.id}
              type="button"
              className={`${styles.item} ${isSelected ? styles.itemActive : ''}`}
              onClick={() => toggle(photo.id)}
              aria-pressed={isSelected}
            >
              {photo.photo_url && <img src={photo.photo_url} alt="" className={styles.thumb} />}
              {isSelected && <span className={styles.badge}>{order + 1}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CompositeDispatch({
  block,
  composites,
  revealed,
}: {
  block: CollaborativeDrawingBlock;
  composites: NonNullable<CollaborativeDrawingBlock['payload']['composites']>;
  revealed: boolean;
}) {
  const { revealComposites } = useCollaborativeDrawing();

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <p className={styles.hint}>Composites</p>
        <Button size="sm" onClick={() => void revealComposites(block.id)} disabled={revealed}>
          {revealed ? 'Showing on monitor' : 'Dispatch to monitor'}
        </Button>
      </div>
      <div className={styles.grid}>
        {composites.map((c) => (
          <div key={c.group_index} className={styles.composite}>
            <CompositeCanvas composite={c} width={140} />
          </div>
        ))}
      </div>
    </div>
  );
}
