import { Button, TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';
import { Block, ParticipantSummary } from '@cctv/types';

import CreateAnnouncement from './CreateAnnouncement/CreateAnnouncement';
import { CreateBlockProvider, useCreateBlockContext } from './CreateBlockContext';
import CreateMadLib from './CreateMadLib/CreateMadLib';
import CreateMultistepForm from './CreateMultistepForm/CreateMultistepForm';
import CreatePoll from './CreatePoll/CreatePoll';
import CreateQuestion from './CreateQuestion/CreateQuestion';
import {
  isAnnouncementHandler,
  isMadLibHandler,
  isMultistepFormHandler,
  isPollHandler,
  isQuestionHandler,
} from './handlers/blockHandlerFactory';

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
    handler,
    participants,
    submit,
    isSubmitting,
    error,
    visibleRoles,
    setVisibleRoles,
    visibleSegmentsText,
    setVisibleSegmentsText,
    targetUserIdsText,
    setTargetUserIdsText,
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

      <BlockEditor kind={kind} handler={handler} participants={participants} />

      {viewAdditionalDetails && (
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
      )}

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

interface BlockEditorProps {
  kind: Block['kind'];
  handler: any;
  participants: ParticipantSummary[];
}

function BlockEditor({ kind, handler, participants }: BlockEditorProps) {
  const data = handler.getData();
  const onChange = (updates: any) => handler.updateData(updates);

  switch (kind) {
    case 'poll':
      if (isPollHandler(handler)) {
        return <CreatePoll data={data} onChange={onChange} />;
      }
      break;

    case 'question':
      if (isQuestionHandler(handler)) {
        return <CreateQuestion data={data} onChange={onChange} />;
      }
      break;

    case 'multistep_form':
      if (isMultistepFormHandler(handler)) {
        return (
          <CreateMultistepForm
            className={styles.details}
            multistepQuestions={data.questions}
            setMultistepQuestions={(questions) => onChange({ questions })}
          />
        );
      }
      break;

    case 'announcement':
      if (isAnnouncementHandler(handler)) {
        return <CreateAnnouncement data={data} onChange={onChange} />;
      }
      break;

    case 'mad_lib':
      if (isMadLibHandler(handler)) {
        return <CreateMadLib data={data} onChange={onChange} participants={participants} />;
      }
      break;

    default:
      return <div className={styles.details}>Unknown block type: {kind}</div>;
  }

  return <div className={styles.details}>Handler mismatch for {kind}</div>;
}
