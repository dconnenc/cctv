import { useId } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { DialogDescription, DialogTitle, SegmentMultiSelect, Switch } from '@cctv/core';
import { Button } from '@cctv/core/Button/Button';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';
import { BLOCK_KIND_LABELS, BlockKind, ParticipantSummary } from '@cctv/types';

import CreateAnnouncement from './CreateAnnouncement/CreateAnnouncement';
import { CreateBlockProvider, useCreateBlockContext } from './CreateBlockContext';
import CreateBuzzer from './CreateBuzzer/CreateBuzzer';
import CreateCollaborativeDrawing from './CreateCollaborativeDrawing/CreateCollaborativeDrawing';
import CreateFamilyFeud from './CreateFamilyFeud/CreateFamilyFeud';
import CreateGuessWho from './CreateGuessWho/CreateGuessWho';
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
  const { blockData, setKind, submit, error, viewAdditionalDetails, setViewAdditionalDetails } =
    useCreateBlockContext();

  return (
    <div className={styles.root}>
      <DialogTitle className={styles.title}>Create Block</DialogTitle>
      <DialogDescription className="sr-only">
        Create a new block for your experience
      </DialogDescription>
      {error && <div className={styles.error}>{error}</div>}

      <Dropdown
        label="Kind"
        options={Object.values(BlockKind).map((kind) => ({
          label: BLOCK_KIND_LABELS[kind],
          value: kind,
        }))}
        value={blockData.kind}
        onChange={setKind}
        required
      />

      <CreateBlockFields />

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose}>
          Back
        </Button>
        <Button
          variant="secondary"
          onClick={() => setViewAdditionalDetails(!viewAdditionalDetails)}
        >
          {viewAdditionalDetails ? 'Hide Additional Details' : 'View Additional Details'}
        </Button>
        <Button variant="secondary" onClick={() => submit('hidden')}>
          Queue block
        </Button>
        <Button onClick={() => submit('open')}>Play now</Button>
      </div>
    </div>
  );
}

export function CreateBlockFields() {
  return (
    <>
      <BlockEditor />
      <SegmentSelector />
      <PlaybillToggles />
    </>
  );
}

function BlockEditor() {
  const { blockData, setBlockData } = useCreateBlockContext();

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
    case BlockKind.COLLABORATIVE_DRAWING:
      return <CreateCollaborativeDrawing data={blockData.data} onChange={onChange} />;
    case BlockKind.THE_SCENE:
      return <CreateTheScene data={blockData.data} onChange={onChange} />;
    default:
      const exhaustiveCheck: never = blockData;
      return <div className={styles.details}>Unknown block type: {exhaustiveCheck}</div>;
  }
}

function PlaybillToggles() {
  const { addToPlaybill, setAddToPlaybill, playbillMysterious, setPlaybillMysterious } =
    useCreateBlockContext();
  const addToPlaybillId = useId();
  const playbillMysteriousId = useId();

  return (
    <div className={styles.playbillToggles}>
      <label className={styles.playbillRow} htmlFor={addToPlaybillId}>
        <span>
          Add to playbill
          <div className={styles.playbillHint}>
            Show this block in the playbill&rsquo;s running order.
          </div>
        </span>
        <Switch id={addToPlaybillId} checked={addToPlaybill} onCheckedChange={setAddToPlaybill} />
      </label>

      {addToPlaybill && (
        <label className={styles.playbillRow} htmlFor={playbillMysteriousId}>
          <span>
            Display block mysteriously
            <div className={styles.playbillHint}>
              Hide the block&rsquo;s identity &mdash; list it as &ldquo;A Surprise Segment&rdquo;.
            </div>
          </span>
          <Switch
            id={playbillMysteriousId}
            checked={playbillMysterious}
            onCheckedChange={setPlaybillMysterious}
          />
        </label>
      )}
    </div>
  );
}

function SegmentSelector() {
  const { visibleSegments, setVisibleSegments } = useCreateBlockContext();
  const { experience } = useExperience();
  const definedSegments = experience?.segments || [];

  return (
    <SegmentMultiSelect
      segments={definedSegments}
      value={visibleSegments}
      onChange={setVisibleSegments}
    />
  );
}
