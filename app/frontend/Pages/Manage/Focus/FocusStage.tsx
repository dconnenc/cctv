import classNames from 'classnames';
import { Square } from 'lucide-react';

import { Button } from '@cctv/core';
import FamilyFeudManager from '@cctv/pages/Block/FamilyFeudManager/FamilyFeudManager';
import GuessWhoManager from '@cctv/pages/Block/GuessWhoManager/GuessWhoManager';
import { BLOCK_KIND_LABELS, Block, BlockKind } from '@cctv/types';

import BlockPreview from '../BlockPreview/BlockPreview';

import styles from './FocusStage.module.scss';

interface FocusStageProps {
  block: Block;
  isFinishing: boolean;
  onFinish: () => void;
}

export default function FocusStage({ block, isFinishing, onFinish }: FocusStageProps) {
  const controls = renderControls(block);
  const responseCount = block.responses?.total ?? 0;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>{BLOCK_KIND_LABELS[block.kind]}</h1>
        <span className={styles.live}>
          <span className={styles.dot} />
          Live
        </span>
        <div className={styles.spacer} />
        <Button onClick={onFinish} loading={isFinishing} loadingText="Finishing...">
          <Square size={16} />
          <span>Finish</span>
        </Button>
      </div>

      <div className={classNames(styles.columns, controls && styles.withControls)}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>On the monitor</span>
            <span className={styles.count}>
              {responseCount} {responseCount === 1 ? 'response' : 'responses'}
            </span>
          </div>
          <div className={styles.panelBody}>
            <BlockPreview block={block} viewContext="monitor" />
          </div>
        </div>

        {controls && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span>Reveal</span>
            </div>
            <div className={styles.panelBody}>{controls}</div>
          </div>
        )}
      </div>

      {!controls && (
        <p className={styles.hint}>
          Responses are coming in. Hit Finish when you&rsquo;re ready to move on.
        </p>
      )}
    </div>
  );
}

function renderControls(block: Block) {
  if (block.kind === BlockKind.FAMILY_FEUD) {
    return <FamilyFeudManager block={block} />;
  }

  if (block.kind === BlockKind.GUESS_WHO) {
    return <GuessWhoManager block={block} />;
  }

  return null;
}
