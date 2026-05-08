import { useExperience } from '@cctv/contexts/ExperienceContext';
import { DialogDescription, DialogTitle } from '@cctv/core';
import { Button } from '@cctv/core/Button/Button';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';
import { SegmentBadge } from '@cctv/core/SegmentBadge/SegmentBadge';
import { BlockKind, ParticipantSummary } from '@cctv/types';

import CreateAnnouncement from './CreateAnnouncement/CreateAnnouncement';
import { CreateBlockProvider, useCreateBlockContext } from './CreateBlockContext';
import CreateBuzzer from './CreateBuzzer/CreateBuzzer';
import CreateFamilyFeud from './CreateFamilyFeud/CreateFamilyFeud';
import CreateGuessWho from './CreateGuessWho/CreateGuessWho';
import CreateMadLib from './CreateMadLib/CreateMadLib';
import CreateMinigameArithmetic from './CreateMinigameArithmetic/CreateMinigameArithmetic';
import CreateMinigameBalloonPump from './CreateMinigameBalloonPump/CreateMinigameBalloonPump';
import CreatePhotoUpload from './CreatePhotoUpload/CreatePhotoUpload';
import CreatePoll from './CreatePoll/CreatePoll';
import CreateQuestion from './CreateQuestion/CreateQuestion';
import CreateTheScene from './CreateTheScene/CreateTheScene';

import styles from './CreateBlock.module.scss';

interface CreateBlockProps {
  onClose: () => void;
  participants: ParticipantSummary[];
  onEndCurrentBlock: () => Promise<void>;
}

export default function CreateBlock(props: CreateBlockProps) {
  return (
    <CreateBlockProvider {...props}>
      <CreateBlockForm onClose={props.onClose} />
    </CreateBlockProvider>
  );
}

interface CreateBlockFormProps {
  onClose: () => void;
}

function CreateBlockForm({ onClose }: CreateBlockFormProps) {
  const { blockData, setKind, submit, isSubmitting, error } = useCreateBlockContext();

  return (
    <div className={styles.root}>
      <DialogTitle className={styles.title}>Create Block</DialogTitle>
      <DialogDescription className="sr-only">
        Create a new block for your experience
      </DialogDescription>
      {error && <div className={styles.error}>{error}</div>}

      <Dropdown
        label="Kind"
        options={[
          { label: 'Poll', value: BlockKind.POLL },
          { label: 'Question', value: BlockKind.QUESTION },
          { label: 'Announcement', value: BlockKind.ANNOUNCEMENT },
          { label: 'Mad Lib', value: BlockKind.MAD_LIB },
          { label: 'Family Feud', value: BlockKind.FAMILY_FEUD },
          { label: 'Photo Upload', value: BlockKind.PHOTO_UPLOAD },
          { label: 'Buzzer', value: BlockKind.BUZZER },
          { label: 'Guess Who', value: BlockKind.GUESS_WHO },
          { label: 'Minigame: Arithmetic', value: BlockKind.MINIGAME_ARITHMETIC },
          { label: 'Minigame: Balloon Pump', value: BlockKind.MINIGAME_BALLOON_PUMP },
          { label: 'The Scene', value: BlockKind.THE_SCENE },
        ]}
        value={blockData.kind}
        onChange={setKind}
        required
      />

      <BlockEditor />
      <SegmentSelector />

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose}>
          Back
        </Button>
        <Button
          variant="secondary"
          onClick={() => submit('hidden')}
          loading={isSubmitting}
          loadingText="Creating..."
        >
          Queue block
        </Button>
        <Button onClick={() => submit('open')} loading={isSubmitting} loadingText="Creating...">
          Play now
        </Button>
      </div>
    </div>
  );
}

function BlockEditor() {
  const { blockData, setBlockData, participants } = useCreateBlockContext();

  const onChange = (updates: any) => {
    setBlockData((prev) => ({
      ...prev,
      data: { ...prev.data, ...updates },
    }));
  };

  switch (blockData.kind) {
    case BlockKind.POLL:
      return <CreatePoll data={blockData.data} onChange={onChange} />;
    case BlockKind.QUESTION:
      return <CreateQuestion data={blockData.data} onChange={onChange} />;
    case BlockKind.ANNOUNCEMENT:
      return <CreateAnnouncement data={blockData.data} onChange={onChange} />;
    case BlockKind.MAD_LIB:
      return <CreateMadLib data={blockData.data} onChange={onChange} participants={participants} />;
    case BlockKind.FAMILY_FEUD:
      return <CreateFamilyFeud data={blockData.data} onChange={onChange} />;
    case BlockKind.PHOTO_UPLOAD:
      return <CreatePhotoUpload data={blockData.data} onChange={onChange} />;
    case BlockKind.BUZZER:
      return <CreateBuzzer data={blockData.data} onChange={onChange} />;
    case BlockKind.GUESS_WHO:
      return <CreateGuessWho data={blockData.data} onChange={onChange} />;
    case BlockKind.MINIGAME_ARITHMETIC:
      return <CreateMinigameArithmetic data={blockData.data} onChange={onChange} />;
    case BlockKind.MINIGAME_BALLOON_PUMP:
      return <CreateMinigameBalloonPump data={blockData.data} onChange={onChange} />;
    case BlockKind.THE_SCENE:
      return <CreateTheScene data={blockData.data} onChange={onChange} />;
    default:
      const exhaustiveCheck: never = blockData;
      return <div className={styles.details}>Unknown block type: {exhaustiveCheck}</div>;
  }
}

function SegmentSelector() {
  const { visibleSegments, setVisibleSegments, defaultSegmentName } = useCreateBlockContext();
  const { experience } = useExperience();
  const definedSegments = experience?.segments || [];
  const availableSegments = definedSegments.filter((s) => !visibleSegments.includes(s.name));
  const placeholder = defaultSegmentName
    ? `Defaults to ${defaultSegmentName}`
    : 'Visible to all participants';

  return (
    <div className={styles.segmentSelector}>
      <label className={styles.segmentLabel}>Visible to segments</label>
      <div className={styles.segmentRow}>
        {visibleSegments.length === 0 && (
          <span className={styles.segmentPlaceholder}>{placeholder}</span>
        )}
        {visibleSegments.map((name) => {
          const seg = definedSegments.find((s) => s.name === name);
          return (
            <SegmentBadge
              key={name}
              name={name}
              color={seg?.color || '#6B7280'}
              onRemove={() => setVisibleSegments(visibleSegments.filter((n) => n !== name))}
            />
          );
        })}
        {availableSegments.length > 0 && (
          <select
            aria-label="Add segment"
            className={styles.segmentSelect}
            value=""
            onChange={(e) => {
              if (e.target.value) {
                setVisibleSegments([...visibleSegments, e.target.value]);
              }
            }}
          >
            <option value="">+ Add segment...</option>
            {availableSegments.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
