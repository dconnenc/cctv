import { useState } from 'react';

import { Link } from 'react-router-dom';

import { ChevronLeft } from 'lucide-react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button } from '@cctv/core';
import {
  BLOCK_KIND_LABELS,
  BlockKind,
  ParticipantSummary,
  PlaybillRunningOrderEntry,
} from '@cctv/types';
import { renderNameTemplate } from '@cctv/utils';

import styles from './Playbill.module.scss';

type TabKey = 'performers' | 'running_order';

const BLOCK_KIND_DESCRIPTIONS = {
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
} satisfies Record<BlockKind, string>;

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
        <Button
          role="tab"
          aria-selected={activeTab === 'performers'}
          variant={activeTab === 'performers' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('performers')}
        >
          Performers
        </Button>
        <Button
          role="tab"
          aria-selected={activeTab === 'running_order'}
          variant={activeTab === 'running_order' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('running_order')}
        >
          Running Order
        </Button>
      </div>

      {activeTab === 'performers' && <PerformersTab />}
      {activeTab === 'running_order' && <RunningOrderTab />}
    </section>
  );
}

function PerformersTab() {
  const { experience, participant } = useExperience();
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
                alt={renderNameTemplate(section.title, participant) || `Performer ${index + 1}`}
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
          <div className={styles.textWrap}>
            <h3 className={styles.itemTitle}>{renderNameTemplate(section.title, participant)}</h3>
            <p className={styles.itemBody}>{renderNameTemplate(section.body, participant)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RunningOrderTab() {
  const { experience, participant } = useExperience();
  const entries = experience?.playbill_running_order || [];

  if (entries.length === 0) {
    return (
      <div className={styles.sections}>
        <p className={styles.subtitle}>No blocks have been added to the running order yet.</p>
      </div>
    );
  }

  return (
    <ol className={styles.runningOrder}>
      {entries.map((entry, index) => (
        <RunningOrderItem key={entry.id} entry={entry} index={index} participant={participant} />
      ))}
    </ol>
  );
}

function RunningOrderItem({
  entry,
  index,
  participant,
}: {
  entry: PlaybillRunningOrderEntry;
  index: number;
  participant?: ParticipantSummary | null;
}) {
  if (entry.playbill_mysterious) {
    return (
      <li className={`${styles.runningOrderItem} ${styles.runningOrderItemMysterious}`}>
        <span className={styles.runningOrderIndex}>{index + 1}</span>
        <div className={styles.runningOrderText}>
          <h3 className={styles.runningOrderTitle}>A Surprise Segment</h3>
        </div>
        <div className={styles.mysteryMark} aria-hidden="true">
          ?
        </div>
      </li>
    );
  }

  return (
    <li className={styles.runningOrderItem}>
      <span className={styles.runningOrderIndex}>{index + 1}</span>
      <div className={styles.runningOrderText}>
        <h3 className={styles.runningOrderTitle}>
          {renderNameTemplate(entry.title, participant) || BLOCK_KIND_LABELS[entry.kind]}
        </h3>
        <p className={styles.runningOrderDescription}>{BLOCK_KIND_DESCRIPTIONS[entry.kind]}</p>
      </div>
    </li>
  );
}
