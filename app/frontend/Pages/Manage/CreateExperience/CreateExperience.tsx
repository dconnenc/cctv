import { Button, TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';
import { Block, ParticipantSummary } from '@cctv/types';

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
          { label: 'Poll', value: 'poll' },
          { label: 'Question', value: 'question' },
          { label: 'Multistep Form', value: 'multistep_form' },
          { label: 'Announcement', value: 'announcement' },
          { label: 'Mad Lib', value: 'mad_lib' },
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
    case 'poll':
      return <CreatePoll data={data as any} onChange={onChange} />;

    case 'question':
      return <CreateQuestion data={data as any} onChange={onChange} />;

    case 'multistep_form':
      return (
        <CreateMultistepForm
          className={styles.details}
          multistepQuestions={(data as any).questions}
          setMultistepQuestions={(questions) => onChange({ questions })}
        />
      );

    case 'announcement':
      return <CreateAnnouncement data={data as any} onChange={onChange} />;

    case 'mad_lib':
      return <CreateMadLib data={data as any} onChange={onChange} participants={participants} />;

    default:
      return <div className={styles.details}>Unknown block type: {kind}</div>;
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
