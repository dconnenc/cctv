import { useId } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { DialogDescription, DialogTitle } from '@cctv/core';
import { Button } from '@cctv/core/Button/Button';
import { SegmentBadge } from '@cctv/core/SegmentBadge/SegmentBadge';
import { BLOCK_KIND_LABELS, Block, BlockKind, ParticipantSummary } from '@cctv/types';

import CreateAnnouncement from '../CreateBlock/CreateAnnouncement/CreateAnnouncement';
import CreateBuzzer from '../CreateBlock/CreateBuzzer/CreateBuzzer';
import CreateCollaborativeDrawing from '../CreateBlock/CreateCollaborativeDrawing/CreateCollaborativeDrawing';
import CreateFamilyFeud from '../CreateBlock/CreateFamilyFeud/CreateFamilyFeud';
import CreateGuessWho from '../CreateBlock/CreateGuessWho/CreateGuessWho';
import CreateMinigameArithmetic from '../CreateBlock/CreateMinigameArithmetic/CreateMinigameArithmetic';
import CreateMinigameBalloonPump from '../CreateBlock/CreateMinigameBalloonPump/CreateMinigameBalloonPump';
import CreatePhotoUpload from '../CreateBlock/CreatePhotoUpload/CreatePhotoUpload';
import CreatePoll from '../CreateBlock/CreatePoll/CreatePoll';
import CreateQuestion from '../CreateBlock/CreateQuestion/CreateQuestion';
import CreateTheScene from '../CreateBlock/CreateTheScene/CreateTheScene';
import { EditBlockProvider, useEditBlockContext } from './EditBlockContext';

import styles from './EditBlock.module.scss';

interface EditBlockProps {
  block: Block;
  onClose: () => void;
  participants: ParticipantSummary[];
}

export default function EditBlock(props: EditBlockProps) {
  return (
    <EditBlockProvider
      block={props.block}
      participants={props.participants}
      onClose={props.onClose}
    >
      <EditBlockForm onClose={props.onClose} block={props.block} />
    </EditBlockProvider>
  );
}

interface EditBlockFormProps {
  onClose: () => void;
  block: Block;
}

function EditBlockForm({ onClose, block }: EditBlockFormProps) {
  const {
    submit,
    isSubmitting,
    error,
    viewAdditionalDetails,
    setViewAdditionalDetails,
    pendingWarning,
    confirmWarning,
    cancelWarning,
  } = useEditBlockContext();

  return (
    <div className={styles.root}>
      <DialogTitle className={styles.title}>
        Edit Block — {BLOCK_KIND_LABELS[block.kind]}
      </DialogTitle>
      <DialogDescription className="sr-only">
        Edit this {BLOCK_KIND_LABELS[block.kind]} block
      </DialogDescription>
      {error && <div className={styles.error}>{error}</div>}

      {pendingWarning && (
        <div className={styles.warning}>
          <span>{pendingWarning}</span>
          <div className={styles.warningActions}>
            <Button variant="secondary" onClick={cancelWarning}>
              Cancel
            </Button>
            <Button onClick={confirmWarning} loading={isSubmitting} loadingText="Saving...">
              Save Anyway
            </Button>
          </div>
        </div>
      )}

      <EditBlockFields />

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={() => setViewAdditionalDetails(!viewAdditionalDetails)}
        >
          {viewAdditionalDetails ? 'Hide Additional Details' : 'View Additional Details'}
        </Button>
        <Button onClick={submit} loading={isSubmitting} loadingText="Saving...">
          Save
        </Button>
      </div>
    </div>
  );
}

export function EditBlockFields() {
  const { viewAdditionalDetails } = useEditBlockContext();

  return (
    <>
      <BlockEditor />
      {viewAdditionalDetails && <AdditionalDetails />}
    </>
  );
}

function BlockEditor() {
  const { blockData, setBlockData } = useEditBlockContext();
  const { kind, data } = blockData;

  switch (kind) {
    case BlockKind.POLL:
      return (
        <CreatePoll
          data={data}
          onChange={(updates) =>
            setBlockData((prev) =>
              prev.kind === BlockKind.POLL ? { ...prev, data: { ...prev.data, ...updates } } : prev,
            )
          }
        />
      );
    case BlockKind.QUESTION:
      return (
        <CreateQuestion
          data={data}
          onChange={(updates) =>
            setBlockData((prev) =>
              prev.kind === BlockKind.QUESTION
                ? { ...prev, data: { ...prev.data, ...updates } }
                : prev,
            )
          }
        />
      );
    case BlockKind.ANNOUNCEMENT:
      return (
        <CreateAnnouncement
          data={data}
          onChange={(updates) =>
            setBlockData((prev) =>
              prev.kind === BlockKind.ANNOUNCEMENT
                ? { ...prev, data: { ...prev.data, ...updates } }
                : prev,
            )
          }
        />
      );
    case BlockKind.FAMILY_FEUD:
      return (
        <CreateFamilyFeud
          data={data}
          onChange={(updates) =>
            setBlockData((prev) =>
              prev.kind === BlockKind.FAMILY_FEUD
                ? { ...prev, data: { ...prev.data, ...updates } }
                : prev,
            )
          }
        />
      );
    case BlockKind.PHOTO_UPLOAD:
      return (
        <CreatePhotoUpload
          data={data}
          onChange={(updates) =>
            setBlockData((prev) =>
              prev.kind === BlockKind.PHOTO_UPLOAD
                ? { ...prev, data: { ...prev.data, ...updates } }
                : prev,
            )
          }
        />
      );
    case BlockKind.BUZZER:
      return (
        <CreateBuzzer
          data={data}
          onChange={(updates) =>
            setBlockData((prev) =>
              prev.kind === BlockKind.BUZZER
                ? { ...prev, data: { ...prev.data, ...updates } }
                : prev,
            )
          }
        />
      );
    case BlockKind.GUESS_WHO:
      return (
        <CreateGuessWho
          data={data}
          onChange={(updates) =>
            setBlockData((prev) =>
              prev.kind === BlockKind.GUESS_WHO
                ? { ...prev, data: { ...prev.data, ...updates } }
                : prev,
            )
          }
        />
      );
    case BlockKind.MINIGAME_ARITHMETIC:
      return (
        <CreateMinigameArithmetic
          data={data}
          onChange={(updates) =>
            setBlockData((prev) =>
              prev.kind === BlockKind.MINIGAME_ARITHMETIC
                ? { ...prev, data: { ...prev.data, ...updates } }
                : prev,
            )
          }
        />
      );
    case BlockKind.MINIGAME_BALLOON_PUMP:
      return (
        <CreateMinigameBalloonPump
          data={data}
          onChange={(updates) =>
            setBlockData((prev) =>
              prev.kind === BlockKind.MINIGAME_BALLOON_PUMP
                ? { ...prev, data: { ...prev.data, ...updates } }
                : prev,
            )
          }
        />
      );
    case BlockKind.COLLABORATIVE_DRAWING:
      return (
        <CreateCollaborativeDrawing
          data={data}
          onChange={(updates) =>
            setBlockData((prev) =>
              prev.kind === BlockKind.COLLABORATIVE_DRAWING
                ? { ...prev, data: { ...prev.data, ...updates } }
                : prev,
            )
          }
        />
      );
    case BlockKind.THE_SCENE:
      return (
        <CreateTheScene
          data={data}
          onChange={(updates) =>
            setBlockData((prev) =>
              prev.kind === BlockKind.THE_SCENE
                ? { ...prev, data: { ...prev.data, ...updates } }
                : prev,
            )
          }
        />
      );
    default: {
      const exhaustiveCheck: never = kind;
      return <div>Unknown block type: {exhaustiveCheck}</div>;
    }
  }
}

function AdditionalDetails() {
  const { visibleSegments, setVisibleSegments, showOnMonitor, setShowOnMonitor } =
    useEditBlockContext();
  const { experience } = useExperience();
  const definedSegments = experience?.segments || [];
  const segmentSelectId = useId();

  return (
    <div className={styles.additionalDetails}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={showOnMonitor}
          onChange={(e) => setShowOnMonitor(e.target.checked)}
        />
        Show on monitor
      </label>
      <div>
        <label style={{ fontSize: '0.85rem' }} htmlFor={segmentSelectId}>
          Visible to segments
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
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
          {definedSegments.filter((s) => !visibleSegments.includes(s.name)).length > 0 && (
            <select
              id={segmentSelectId}
              style={{ fontSize: '0.75rem', padding: '0.15rem 0.3rem' }}
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setVisibleSegments([...visibleSegments, e.target.value]);
                }
              }}
            >
              <option value="">+ Add segment...</option>
              {definedSegments
                .filter((s) => !visibleSegments.includes(s.name))
                .map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
