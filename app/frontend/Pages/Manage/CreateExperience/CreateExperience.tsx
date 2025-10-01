import { Button, TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';
import {
  AnnouncementData,
  BlockKind,
  MadLibData,
  MultistepFormData,
  ParticipantSummary,
  PollData,
  QuestionData,
} from '@cctv/types';

import CreateAnnouncement from './CreateAnnouncement/CreateAnnouncement';
import { CreateBlockProvider, useCreateBlockContext } from './CreateBlockContext';
import CreateMadLib from './CreateMadLib/CreateMadLib';
import CreateMultistepForm from './CreateMultistepForm/CreateMultistepForm';
import CreatePoll from './CreatePoll/CreatePoll';
import CreateQuestion from './CreateQuestion/CreateQuestion';

import styles from './CreateExperience.module.scss';

interface CreateExperienceProps {
  refetchExperience: () => Promise<void>;
  onClose: () => void;
  participants: ParticipantSummary[];
  onEndCurrentBlock: () => Promise<void>;
}

export default function CreateExperience(props: CreateExperienceProps) {
  return (
    <CreateBlockProvider {...props}>
      <CreateExperienceForm />
    </CreateBlockProvider>
  );
}

function CreateExperienceForm() {
  const {
    kind,
    setKind,
    submit,
    isSubmitting,
    error,
    viewAdditionalDetails,
    setViewAdditionalDetails,
  } = useCreateBlockContext();

  return (
    <div className={styles.root}>
      {error && <div className={styles.error}>{error}</div>}

      <Dropdown
        label="Kind"
        options={[
          { label: 'Poll', value: BlockKind.POLL },
          { label: 'Question', value: BlockKind.QUESTION },
          { label: 'Multistep Form', value: BlockKind.MULTISTEP_FORM },
          { label: 'Announcement', value: BlockKind.ANNOUNCEMENT },
          { label: 'Mad Lib', value: BlockKind.MAD_LIB },
        ]}
        value={kind}
        onChange={setKind}
        required
      />

      <BlockEditor />
      {viewAdditionalDetails && <AdditionalDetails />}

      <div className={styles.actions}>
        <Button onClick={() => window.history.back()}>Back</Button>
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
  const { kind, data, setData, participants } = useCreateBlockContext();

  const onChange = (updates: any) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  switch (kind) {
    case BlockKind.POLL:
      return <CreatePoll data={data as PollData} onChange={onChange} />;

    case BlockKind.QUESTION:
      return <CreateQuestion data={data as QuestionData} onChange={onChange} />;

    case BlockKind.MULTISTEP_FORM:
      return (
        <CreateMultistepForm
          className={styles.details}
          multistepQuestions={(data as MultistepFormData).questions}
          setMultistepQuestions={(questions) => onChange({ questions })}
        />
      );

    case BlockKind.ANNOUNCEMENT:
      return <CreateAnnouncement data={data as AnnouncementData} onChange={onChange} />;

    case BlockKind.MAD_LIB:
      return (
        <CreateMadLib data={data as MadLibData} onChange={onChange} participants={participants} />
      );
    default:
      const exhaustiveCheck: never = kind;
      return <div className={styles.details}>Unknown block type: {exhaustiveCheck}</div>;
  }
}

function AdditionalDetails() {
  const {
    participants,
    visibleRoles,
    setVisibleRoles,
    visibleSegmentsText,
    setVisibleSegmentsText,
    targetUserIdsText,
    setTargetUserIdsText,
  } = useCreateBlockContext();
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
        onChange={(value) => setVisibleRoles([value])}
      />
      <TextInput
        label="Visible to segments (comma-separated)"
        placeholder="segment-a, segment-b"
        value={visibleSegmentsText}
        onChange={(e) => setVisibleSegmentsText(e.target.value)}
      />
      <Dropdown
        label="Target user IDs"
        options={participants.map((p) => ({ label: p.name, value: p.id }))}
        value={targetUserIdsText}
        onChange={setTargetUserIdsText}
      />
    </div>
  );
}
