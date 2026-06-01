import { GlassCaseButton } from '@cctv/core/GlassCaseButton/GlassCaseButton';
import { useTheScene } from '@cctv/hooks/useTheScene';

import styles from './BuzzerPanel.module.scss';

interface Props {
  blockId: string;
  activeSuggestionCount: number;
}

export function BuzzerPanel({ blockId, activeSuggestionCount }: Props) {
  const { pressBuzzer } = useTheScene();
  const locked = activeSuggestionCount < 2;

  return (
    <div className={styles.root}>
      <p className={styles.title}>You hold the buzzer</p>
      <p className={styles.subtitle}>
        {locked
          ? `Waiting on ${2 - activeSuggestionCount} more suggestion${
              2 - activeSuggestionCount === 1 ? '' : 's'
            }…`
          : 'Break the glass when the scene needs to end.'}
      </p>
      <GlassCaseButton
        locked={locked}
        label="BREAK GLASS"
        lockedLabel="LOCKED"
        onPress={() => {
          void pressBuzzer(blockId);
        }}
      />
    </div>
  );
}

export default BuzzerPanel;
