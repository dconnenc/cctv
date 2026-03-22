import { useExperience } from '@cctv/contexts/ExperienceContext';
import { DialogDescription, DialogTitle } from '@cctv/core';
import { Button } from '@cctv/core/Button/Button';
import { SegmentBadge } from '@cctv/core/SegmentBadge/SegmentBadge';
import { Block, BlockKind, FormBlockData, ParticipantSummary } from '@cctv/types';

import CreateAnnouncement from '../CreateBlock/CreateAnnouncement/CreateAnnouncement';
import CreateBuzzer from '../CreateBlock/CreateBuzzer/CreateBuzzer';
import CreateFamilyFeud from '../CreateBlock/CreateFamilyFeud/CreateFamilyFeud';
import CreateMadLib from '../CreateBlock/CreateMadLib/CreateMadLib';
import CreateMultistepForm from '../CreateBlock/CreateMultistepForm/CreateMultistepForm';
import CreatePhotoUpload from '../CreateBlock/CreatePhotoUpload/CreatePhotoUpload';
import CreatePoll from '../CreateBlock/CreatePoll/CreatePoll';
import CreateQuestion from '../CreateBlock/CreateQuestion/CreateQuestion';
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

const KIND_LABELS: Record<BlockKind, string> = {
  [BlockKind.POLL]: 'Poll',
  [BlockKind.QUESTION]: 'Question',
  [BlockKind.MULTISTEP_FORM]: 'Multistep Form',
  [BlockKind.ANNOUNCEMENT]: 'Announcement',
  [BlockKind.MAD_LIB]: 'Mad Lib',
  [BlockKind.FAMILY_FEUD]: 'Family Feud',
  [BlockKind.PHOTO_UPLOAD]: 'Photo Upload',
  [BlockKind.BUZZER]: 'Buzzer',
};

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
      <DialogTitle className={styles.title}>Edit Block — {KIND_LABELS[block.kind]}</DialogTitle>
      <DialogDescription className="sr-only">
        Edit this {KIND_LABELS[block.kind]} block
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

      <BlockEditor />
      {viewAdditionalDetails && <AdditionalDetails />}

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

function BlockEditor() {
  const { blockData, setBlockData, participants } = useEditBlockContext();

  const onChange = (updates: Record<string, unknown>) => {
    setBlockData(
      (prev) =>
        ({
          ...prev,
          data: { ...prev.data, ...updates },
        }) as FormBlockData,
    );
  };

  switch (blockData.kind) {
    case BlockKind.POLL:
      return <CreatePoll data={blockData.data} onChange={onChange} />;
    case BlockKind.QUESTION:
      return <CreateQuestion data={blockData.data} onChange={onChange} />;
    case BlockKind.MULTISTEP_FORM:
      return (
        <CreateMultistepForm
          multistepQuestions={blockData.data.questions}
          setMultistepQuestions={(questions) => onChange({ questions })}
        />
      );
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
    default: {
      const _exhaust: never = blockData;
      return <div>Unknown block type: {(_exhaust as { kind: string }).kind}</div>;
    }
  }
}

function AdditionalDetails() {
  const { visibleSegments, setVisibleSegments, showOnMonitor, setShowOnMonitor } =
    useEditBlockContext();
  const { experience } = useExperience();
  const definedSegments = experience?.segments || [];

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
        <label style={{ fontSize: '0.85rem' }}>Visible to segments</label>
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
