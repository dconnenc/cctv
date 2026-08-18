import { useState } from 'react';

import { Cosmetic, CosmeticCategory } from '@cctv/types';

import { cosmeticAssetUrl } from './cosmeticAssets';
import { setCosmeticDragData } from './cosmeticDrag';

import styles from './CosmeticInventory.module.scss';

// '' is the default, closed "Inventory" state (no category chosen).
type Selection = '' | CosmeticCategory;

export interface CosmeticInventoryProps {
  cosmetics: Cosmetic[];
  isLoading?: boolean;
  error?: string | null;
  // Fired on click/tap so cosmetics can be applied without a drag (touch).
  onApply?: (cosmetic: Cosmetic) => void;
  // Removes the currently applied frame (frames are one-at-a-time).
  onClearFrame?: () => void;
}

export default function CosmeticInventory({
  cosmetics,
  isLoading = false,
  error = null,
  onApply,
  onClearFrame,
}: CosmeticInventoryProps) {
  const [category, setCategory] = useState<Selection>('');
  const items = category ? cosmetics.filter((c) => c.category === category) : [];

  return (
    <div className={styles.root}>
      <select
        className={styles.barSelect}
        aria-label="Inventory"
        value={category}
        onChange={(e) => {
          // SAFETY: the options are exactly '' | 'clothing' | 'frame'.
          const next = e.target.value as Selection;
          setCategory(next);
        }}
      >
        <option value="">Inventory</option>
        <option value="clothing">Clothing</option>
        <option value="frame">Frames</option>
      </select>

      {category ? (
        <div className={styles.body}>
          {error ? (
            <div className={styles.empty}>{error}</div>
          ) : isLoading ? (
            <div className={styles.empty}>Loading…</div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>None yet</div>
          ) : (
            <div className={styles.row}>
              {category === 'frame' && onClearFrame ? (
                <button
                  type="button"
                  className={`${styles.item} ${styles.noneItem}`}
                  onClick={() => onClearFrame()}
                  title="No frame"
                  aria-label="No frame"
                >
                  <span className={styles.noneThumb} aria-hidden />
                  <span className={styles.label}>None</span>
                </button>
              ) : null}
              {items.map((cosmetic) => {
                const url = cosmeticAssetUrl(cosmetic.asset_key);
                return (
                  <button
                    key={cosmetic.id}
                    type="button"
                    className={styles.item}
                    draggable
                    onDragStart={(e) => setCosmeticDragData(e.dataTransfer, cosmetic)}
                    onClick={() => onApply?.(cosmetic)}
                    title={cosmetic.name}
                    aria-label={`Apply ${cosmetic.name}`}
                  >
                    {url ? (
                      <img src={url} alt="" className={styles.thumb} draggable={false} />
                    ) : null}
                    <span className={styles.label}>{cosmetic.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
