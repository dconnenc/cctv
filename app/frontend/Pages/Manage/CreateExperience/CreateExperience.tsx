import { useState } from 'react';

import { Button, TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';
import { useCreateExperienceBlock } from '@cctv/hooks';
import { Block, BlockStatus, Experience, ParticipantRole, ParticipantSummary } from '@cctv/types';

import styles from './CreateExperience.module.scss';
import CreateMultistepForm from './CreateMultistepForm/CreateMultistepForm';

export default function CreateExperience({
  code,
  experienceFetch,
  setModel,
  onClose,
  participants,
  onEndCurrentBlock,
}: {
  code: string;
  experienceFetch: (url: string, options: RequestInit) => Promise<Response>;
  setModel: (model: Experience) => void;
  onClose: () => void;
  participants: ParticipantSummary[];
  onEndCurrentBlock: () => Promise<void>;
}) {
  const {
    createExperienceBlock,
    isLoading: creating,
    error: createError,
    setError: setCreateError,
  } = useCreateExperienceBlock();

  const [viewAdditionalDetails, setViewAdditionalDetails] = useState<boolean>(false);
  const [kind, setKind] = useState<Block['kind']>('poll');
  const [openImmediately, setOpenImmediately] = useState<boolean>(false);
  const [visibleRoles, setVisibleRoles] = useState<ParticipantRole[]>([]);
  const [visibleSegmentsText, setVisibleSegmentsText] = useState<string>('');
  const [targetUserIdsText, setTargetUserIdsText] = useState<string>('');

  // Poll-specific state
  const [pollQuestion, setPollQuestion] = useState<string>('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollType, setPollType] = useState<'single' | 'multiple'>('single');

  // Announcement-specific state
  const [announcementMessage, setAnnouncementMessage] = useState<string>('');

  // Question-specific state
  const [questionText, setQuestionText] = useState<string>('');
  const [questionFormKey, setQuestionFormKey] = useState<string>('');
  const [questionInputType, setQuestionInputType] = useState<
    'text' | 'number' | 'email' | 'password' | 'tel'
  >('text');

  // Multistep Form-specific state
  const [multistepQuestions, setMultistepQuestions] = useState<
    Array<{ question: string; formKey: string; inputType: string }>
  >([{ question: '', formKey: '', inputType: 'text' }]);

  const resetForm = () => {
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollType('single');
    setAnnouncementMessage('');
    setQuestionText('');
    setQuestionFormKey('');
    setQuestionInputType('text');
    setMultistepQuestions([{ question: '', formKey: '', inputType: 'text' }]);
    setVisibleRoles([]);
    setVisibleSegmentsText('');
    setTargetUserIdsText('');
  };

  const onSubmit = async (status: BlockStatus) => {
    console.log('onSubmit');
    setCreateError(null);

    let payload: Record<string, any> = {};

    // Build payload based on kind
    if (kind === 'poll') {
      const validOptions = pollOptions.filter((opt) => opt.trim() !== '');
      if (!pollQuestion.trim()) {
        setCreateError('Poll question is required');
        return;
      }
      if (validOptions.length < 2) {
        setCreateError('Poll must have at least 2 options');
        return;
      }
      payload = {
        type: 'poll',
        question: pollQuestion.trim(),
        options: validOptions,
        pollType: pollType,
      };
    } else if (kind === 'announcement') {
      if (!announcementMessage.trim()) {
        setCreateError('Announcement message is required');
        return;
      }
      payload = {
        type: 'announcement',
        message: announcementMessage.trim(),
      };
    } else if (kind === 'question') {
      if (!questionText.trim()) {
        setCreateError('Question text is required');
        return;
      }
      if (!questionFormKey.trim()) {
        setCreateError('Question form key is required');
        return;
      }
      payload = {
        type: 'question',
        question: questionText.trim(),
        formKey: questionFormKey.trim(),
        inputType: questionInputType,
      };
    } else if (kind === 'multistep_form') {
      const validQuestions = multistepQuestions.filter(
        (q) => q.question.trim() && q.formKey.trim(),
      );
      if (validQuestions.length === 0) {
        setCreateError('At least one question is required for multistep form');
        return;
      }
      payload = {
        type: 'multistep_form',
        questions: validQuestions.map((q) => ({
          type: 'question' as const,
          question: q.question.trim(),
          formKey: q.formKey.trim(),
          inputType: q.inputType as 'text' | 'number' | 'email' | 'password' | 'tel',
        })),
      };
    }

    const visible_to_segments = visibleSegmentsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const target_user_ids = targetUserIdsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const submitPayload = {
      kind,
      payload,
      visible_to_roles: visibleRoles,
      visible_to_segments,
      target_user_ids,
      status: status,
      open_immediately: openImmediately,
    };

    const resp = await createExperienceBlock(submitPayload);
    if (resp?.success) {
      // Re-fetch the experience to show the newly created block
      // TODO: This should be wired up with query caching
      if (code) {
        try {
          const res = await experienceFetch(`/api/experiences/${encodeURIComponent(code)}`, {
            method: 'GET',
          });
          const data = (await res.json()) as {
            success?: boolean;
            experience?: Experience;
          };
          if ((res.ok && data?.experience) || data?.success)
            setModel((data as any).experience || (data as any));
        } catch {}
      }
      onClose();

      if (status === 'open') {
        await onEndCurrentBlock();
      }

      // Reset form state
      resetForm();
    }
  };

  return (
    <div className={styles.root}>
      <Dropdown
        label="Kind"
        options={[
          { label: 'Poll', value: 'poll' },
          { label: 'Question', value: 'question' },
          { label: 'Multistep Form', value: 'multistep_form' },
          { label: 'Announcement', value: 'announcement' },
        ]}
        value={kind}
        onChange={(value) => {
          setKind(value);
          resetForm();
        }}
        required
      />

      <ExperienceKindDetails
        kind={kind}
        pollQuestion={pollQuestion}
        setPollQuestion={setPollQuestion}
        pollType={pollType}
        setPollType={setPollType}
        pollOptions={pollOptions}
        setPollOptions={setPollOptions}
        questionText={questionText}
        setQuestionText={setQuestionText}
        setQuestionFormKey={setQuestionFormKey}
        questionInputType={questionInputType}
        setQuestionInputType={setQuestionInputType}
        multistepQuestions={multistepQuestions}
        setMultistepQuestions={setMultistepQuestions}
        announcementMessage={announcementMessage}
        setAnnouncementMessage={setAnnouncementMessage}
      />

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
        <Button onClick={onClose}>Back</Button>
        <Button onClick={() => setViewAdditionalDetails(!viewAdditionalDetails)}>
          {viewAdditionalDetails ? 'Hide Additional Details' : 'View Additional Details'}
        </Button>
        <Button
          onClick={() => {
            setOpenImmediately(false);
            onSubmit('hidden');
          }}
          loading={creating}
          loadingText="Creating..."
        >
          Queue block
        </Button>
        <Button
          onClick={() => {
            setOpenImmediately(true);
            onSubmit('open');
          }}
          loading={creating}
          loadingText="Creating..."
        >
          Play now
        </Button>
      </div>
    </div>
  );
}

function ExperienceKindDetails({
  kind,
  pollQuestion,
  setPollQuestion,
  pollType,
  setPollType,
  pollOptions,
  setPollOptions,
  questionText,
  setQuestionText,
  setQuestionFormKey,
  questionInputType,
  setQuestionInputType,
  multistepQuestions,
  setMultistepQuestions,
  announcementMessage,
  setAnnouncementMessage,
}: {
  kind: Block['kind'];
  pollQuestion: string;
  setPollQuestion: (question: string) => void;
  pollType: 'single' | 'multiple';
  setPollType: (type: 'single' | 'multiple') => void;
  pollOptions: string[];
  setPollOptions: (options: string[]) => void;
  questionText: string;
  setQuestionText: (text: string) => void;
  setQuestionFormKey: (key: string) => void;
  questionInputType: 'text' | 'number' | 'email' | 'password' | 'tel';
  setQuestionInputType: (type: 'text' | 'number' | 'email' | 'password' | 'tel') => void;
  multistepQuestions: Array<{ question: string; formKey: string; inputType: string }>;
  setMultistepQuestions: (
    questions: Array<{ question: string; formKey: string; inputType: string }>,
  ) => void;
  announcementMessage: string;
  setAnnouncementMessage: (message: string) => void;
}) {
  switch (kind) {
    case 'poll':
      return (
        <div className={styles.details}>
          <div className={styles.left}>
            <TextInput
              label="Poll Question"
              placeholder="What is your question?"
              required
              value={pollQuestion}
              onChange={(e) => {
                console.log('onChange', e.target.value);
                setPollQuestion(e.target.value);
              }}
            />
            <Dropdown
              label="Poll Type"
              options={[
                { label: 'Single Choice', value: 'single' },
                { label: 'Multiple Choice', value: 'multiple' },
              ]}
              required
              value={pollType}
              onChange={setPollType}
            />
          </div>
          <div className={styles.right}>
            <div className={styles.list}>
              {pollOptions.map((option, index) => (
                <div className={styles.item} key={index}>
                  <TextInput
                    key={index}
                    label={`Option ${index + 1}`}
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...pollOptions];
                      newOptions[index] = e.target.value;
                      setPollOptions(newOptions);
                    }}
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      type="button"
                      onClick={() => {
                        const newOptions = pollOptions.filter((_, i) => i !== index);
                        setPollOptions(newOptions);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              onClick={() => {
                const newOptions = [...pollOptions, ''];
                setPollOptions(newOptions);
              }}
            >
              Add Option
            </Button>
          </div>
        </div>
      );
    case 'question':
      return (
        <div className={styles.details}>
          <div className={styles.left}>
            <TextInput
              label="Question"
              placeholder="What is your question?"
              required
              value={questionText}
              onChange={(e) => {
                const newQuestionText = e.target.value;
                setQuestionText(newQuestionText);

                // Automatically set the form key to the question text
                setQuestionFormKey(newQuestionText.split(' ').join('_').toLowerCase());
              }}
            />
            <Dropdown
              label="Input Type"
              options={[
                { label: 'Text', value: 'text' },
                { label: 'Number', value: 'number' },
                { label: 'Email', value: 'email' },
                { label: 'Password', value: 'password' },
                { label: 'Phone', value: 'tel' },
              ]}
              required
              value={questionInputType}
              onChange={setQuestionInputType}
            />
          </div>
        </div>
      );
    case 'multistep_form':
      return (
        <CreateMultistepForm
          className={styles.details}
          multistepQuestions={multistepQuestions}
          setMultistepQuestions={setMultistepQuestions}
        />
      );
    case 'announcement':
      return (
        <div className={styles.details}>
          <div className={styles.center}>
            <TextInput
              label="Announcement Message"
              placeholder="Dearest {{ participant_name }}, this is your announcement."
              required
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
            />
            <span className={styles.helpText}>
              {`Include the participant's name with {{ participant_name }}`}
            </span>
          </div>
        </div>
      );
    default:
      return <div className={styles.details}>Unknown: {kind}</div>;
  }
}
