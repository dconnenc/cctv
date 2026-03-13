import { DialogDescription, DialogTitle } from '@cctv/components/ui/dialog';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button } from '@cctv/core/Button/Button';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';
import { SegmentBadge } from '@cctv/core/SegmentBadge/SegmentBadge';
import { BlockKind, ParticipantRole, ParticipantSummary } from '@cctv/types';

import CreateAnnouncement from './CreateAnnouncement/CreateAnnouncement';
import { CreateBlockProvider, useCreateBlockContext } from './CreateBlockContext';
import CreateBuzzer from './CreateBuzzer/CreateBuzzer';
import CreateFamilyFeud from './CreateFamilyFeud/CreateFamilyFeud';
import CreateMadLib from './CreateMadLib/CreateMadLib';
import CreateMultistepForm from './CreateMultistepForm/CreateMultistepForm';
import CreatePhotoUpload from './CreatePhotoUpload/CreatePhotoUpload';
import CreatePoll from './CreatePoll/CreatePoll';
import CreateQuestion from './CreateQuestion/CreateQuestion';

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
  const {
    blockData,
    setKind,
    submit,
    isSubmitting,
    error,
    viewAdditionalDetails,
    setViewAdditionalDetails,
  } = useCreateBlockContext();

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
          { label: 'Multistep Form', value: BlockKind.MULTISTEP_FORM },
          { label: 'Announcement', value: BlockKind.ANNOUNCEMENT },
          { label: 'Mad Lib', value: BlockKind.MAD_LIB },
          { label: 'Family Feud', value: BlockKind.FAMILY_FEUD },
          { label: 'Photo Upload', value: BlockKind.PHOTO_UPLOAD },
          { label: 'Buzzer', value: BlockKind.BUZZER },
        ]}
        value={blockData.kind}
        onChange={setKind}
        required
      />

      <BlockEditor />
      {viewAdditionalDetails && <AdditionalDetails />}

      <div className={styles.actions}>
        <Button onClick={onClose}>Back</Button>
        <Button onClick={() => setViewAdditionalDetails(!viewAdditionalDetails)}>
          {viewAdditionalDetails ? 'Hide Additional Details' : 'View Additional Details'}
        </Button>
        <Button onClick={() => submit('hidden')} loading={isSubmitting} loadingText="Creating...">
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
    default:
      const exhaustiveCheck: never = blockData;
      return <div className={styles.details}>Unknown block type: {exhaustiveCheck}</div>;
  }
}

function AdditionalDetails() {
  const {
    participants,
    visibleRoles,
    setVisibleRoles,
    visibleSegments,
    setVisibleSegments,
    targetUserIdsText,
    setTargetUserIdsText,
    showInLobby,
    setShowInLobby,
  } = useCreateBlockContext();
  const { experience } = useExperience();
  const definedSegments = experience?.segments || [];

  return (
    <div className={styles.additionalDetails}>
      <Dropdown
        label="Visible to roles"
        options={[
          { label: 'Audience', value: 'audience' },
          { label: 'Player', value: 'player' },
          { label: 'Moderator', value: 'moderator' },
          { label: 'Host', value: 'host' },
        ]}
        value={visibleRoles}
        onChange={(value) => setVisibleRoles([value as ParticipantRole])}
      />
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
      <Dropdown
        label="Target user IDs"
        options={participants.map((p) => ({ label: p.name, value: p.id }))}
        value={targetUserIdsText}
        onChange={setTargetUserIdsText}
      />
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={showInLobby}
          onChange={(e) => setShowInLobby(e.target.checked)}
        />
        Show in lobby
      </label>
    </div>
  );
}
