import { useState } from 'react';

import { Link } from 'react-router-dom';

import { ChevronLeft } from 'lucide-react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button } from '@cctv/core';
import { Block, BlockKind } from '@cctv/types';

import styles from './Playbill.module.scss';

type TabKey = 'performers' | 'running_order';

const BLOCK_KIND_DESCRIPTIONS: Record<BlockKind, string> = {
  [BlockKind.POLL]: 'Audience-wide poll',
  [BlockKind.QUESTION]: 'Open-response question',
  [BlockKind.ANNOUNCEMENT]: 'Announcement from the host',
  [BlockKind.FAMILY_FEUD]: 'Family-Feud-style game',
  [BlockKind.PHOTO_UPLOAD]: 'Photo submission prompt',
  [BlockKind.BUZZER]: 'First-to-buzz challenge',
  [BlockKind.GUESS_WHO]: 'Guess-who reveal',
  [BlockKind.MINIGAME_ARITHMETIC]: 'Speed-math minigame',
  [BlockKind.MINIGAME_BALLOON_PUMP]: 'Balloon-pump minigame',
  [BlockKind.THE_SCENE]: 'Improv suggestion + voting',
};

function getBlockTitle(block: Block): string {
  switch (block.kind) {
    case BlockKind.POLL:
      return block.payload?.question?.trim() || 'Poll';
    case BlockKind.QUESTION:
      return block.payload?.question?.trim() || 'Question';
    case BlockKind.ANNOUNCEMENT: {
      const msg = block.payload?.message?.trim();
      if (!msg) return 'Announcement';
      return msg.length > 60 ? `${msg.slice(0, 60)}…` : msg;
    }
    case BlockKind.FAMILY_FEUD:
      return block.payload?.title?.trim() || 'Family Feud';
    case BlockKind.PHOTO_UPLOAD:
      return block.payload?.prompt?.trim() || 'Photo Upload';
    case BlockKind.BUZZER:
      return block.payload?.label?.trim() || block.payload?.prompt?.trim() || 'Buzzer';
    case BlockKind.GUESS_WHO:
      return 'Guess Who';
    case BlockKind.MINIGAME_ARITHMETIC:
      return 'Arithmetic Minigame';
    case BlockKind.MINIGAME_BALLOON_PUMP:
      return 'Balloon Pump Minigame';
    case BlockKind.THE_SCENE:
      return 'The Scene';
    default: {
      const _exhaust: never = block;
      return (_exhaust as Block).kind;
    }
  }
}

export default function Playbill() {
  const { experience, code, isLoading, error } = useExperience();
  const [activeTab, setActiveTab] = useState<TabKey>('performers');

  if (isLoading) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || 'Playbill'}</h1>
        <p className={styles.subtitle}>Loading playbill…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <h1 className={styles.title}>{code || 'Playbill'}</h1>
        <p className={styles.subtitle}>{error}</p>
      </section>
    );
  }

  if (experience?.playbill_enabled === false) {
    return (
      <section className={styles.root}>
        <Button to={`/experiences/${code}`} variant="secondary">
          Back to Experience
        </Button>
        <h1 className={styles.title}>{experience?.name || code}</h1>
        <p className={styles.subtitle}>The playbill is not available for this experience.</p>
      </section>
    );
  }

  return (
    <section className={styles.root}>
      <h1 className={styles.title}>{experience?.name || code}</h1>
      <p className={styles.subtitle}>Playbill</p>

      <Link to={`/experiences/${code}`} className={styles.fab} aria-label="Back to Experience">
        <ChevronLeft size={22} />
      </Link>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'performers'}
          className={`${styles.tab} ${activeTab === 'performers' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('performers')}
        >
          Performers
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'running_order'}
          className={`${styles.tab} ${activeTab === 'running_order' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('running_order')}
        >
          Running Order
        </button>
      </div>

      {activeTab === 'performers' && <PerformersTab />}
      {activeTab === 'running_order' && <RunningOrderTab />}
    </section>
  );
}

function PerformersTab() {
  const { experience } = useExperience();
  const sections = experience?.playbill || [];

  if (sections.length === 0) {
    return (
      <div className={styles.sections}>
        <p className={styles.subtitle}>No performers listed yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.sections}>
      {sections.map((section, index) => (
        <div
          key={section.id}
          className={styles.section}
          style={section.image_url ? undefined : { gridTemplateColumns: '1fr' }}
        >
          {section.image_url && (
            <div className={styles.imageWrap}>
              <img
                className={styles.image}
                src={section.image_url}
                alt={section.title || `Performer ${index + 1}`}
                loading="lazy"
                decoding="async"
                width={section.image_width}
                height={section.image_height}
              />
            </div>
          )}
          <div className={styles.textWrap}>
            <h3 className={styles.itemTitle}>{section.title}</h3>
            <p className={styles.itemBody}>{section.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RunningOrderTab() {
  const { experience } = useExperience();

  const blocks = (experience?.blocks || [])
    .filter((block) => block.add_to_playbill && !block.parent_block_id)
    .slice()
    .sort((a, b) => a.position - b.position);

  if (blocks.length === 0) {
    return (
      <div className={styles.sections}>
        <p className={styles.subtitle}>No blocks have been added to the running order yet.</p>
      </div>
    );
  }

  return (
    <ol className={styles.runningOrder}>
      {blocks.map((block, index) => {
        const mysterious = block.playbill_mysterious;
        const title = mysterious ? 'A Surprise Segment' : getBlockTitle(block);
        const description = mysterious
          ? 'Identity revealed live during the show.'
          : BLOCK_KIND_DESCRIPTIONS[block.kind];

        return (
          <li key={block.id} className={styles.runningOrderItem}>
            <span className={styles.runningOrderIndex}>{index + 1}</span>
            <div className={styles.runningOrderText}>
              <h3 className={styles.runningOrderTitle}>{title}</h3>
              <p className={styles.runningOrderDescription}>{description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
