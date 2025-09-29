import { useState } from 'react';

import { Button, TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';
import { useCreateExperienceBlock } from '@cctv/hooks';
import { Block, BlockStatus, Experience, ParticipantRole, ParticipantSummary } from '@cctv/types';

import CreateMultistepForm from './CreateMultistepForm/CreateMultistepForm';

import styles from './CreateExperience.module.scss';

export default function CreateExperience({
  refetchExperience,
  onClose,
  participants,
  onEndCurrentBlock,
}: {
  refetchExperience: () => Promise<void>;
  onClose: () => void;
  participants: ParticipantSummary[];
  onEndCurrentBlock: () => Promise<void>;
}) {
  const {
    createExperienceBlock,
    isLoading: creating,
    error: createError,
    setError: setCreateError,
  } = useCreateExperienceBlock({ refetchExperience });

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

  // Mad Lib-specific state
  const [madLibTemplate, setMadLibTemplate] = useState<string>('');
  const [madLibVariables, setMadLibVariables] = useState<
    Array<{ id: string; name: string; assigned_user_id?: string }>
  >([{ id: '1', name: 'adjective', assigned_user_id: '' }]);

  const resetForm = () => {
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollType('single');
    setAnnouncementMessage('');
    setQuestionText('');
    setQuestionFormKey('');
    setQuestionInputType('text');
    setMultistepQuestions([{ question: '', formKey: '', inputType: 'text' }]);
    setMadLibTemplate('');
    setMadLibVariables([{ id: '1', name: 'adjective', assigned_user_id: '' }]);
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
    } else if (kind === 'mad_lib') {
      if (!madLibTemplate.trim()) {
        setCreateError('Mad lib template is required');
        return;
      }
      const validVariables = madLibVariables.filter((v) => v.name.trim() && v.id.trim());
      if (validVariables.length === 0) {
        setCreateError('At least one variable is required for mad lib');
        return;
      }
      payload = {
        type: 'mad_lib',
        template: madLibTemplate.trim(),
        variables: validVariables,
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

    await createExperienceBlock(submitPayload);

    onClose();

    if (status === 'open') {
      await onEndCurrentBlock();
    }

    // Reset form state
    resetForm();
  };

  return (
    <div className={styles.root}>
      {createError && <div className={styles.error}>{createError}</div>}
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
        madLibTemplate={madLibTemplate}
        setMadLibTemplate={setMadLibTemplate}
        madLibVariables={madLibVariables}
        setMadLibVariables={setMadLibVariables}
        participants={participants}
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

function ExperienceKindDetails(props: {
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
  madLibTemplate: string;
  setMadLibTemplate: (template: string) => void;
  madLibVariables: Array<{ id: string; name: string; assigned_user_id?: string }>;
  setMadLibVariables: (
    variables: Array<{ id: string; name: string; assigned_user_id?: string }>,
  ) => void;
  participants: ParticipantSummary[];
}) {
  switch (props.kind) {
    case 'poll':
      return (
        <div className={styles.details}>
          <div className={styles.left}>
            <TextInput
              label="Poll Question"
              placeholder="What is your question?"
              required
              value={props.pollQuestion}
              onChange={(e) => {
                console.log('onChange', e.target.value);
                props.setPollQuestion(e.target.value);
              }}
            />
            <Dropdown
              label="Poll Type"
              options={[
                { label: 'Single Choice', value: 'single' },
                { label: 'Multiple Choice', value: 'multiple' },
              ]}
              required
              value={props.pollType}
              onChange={props.setPollType}
            />
          </div>
          <div className={styles.right}>
            <div className={styles.list}>
              {props.pollOptions.map((option, index) => (
                <div className={styles.item} key={index}>
                  <TextInput
                    key={index}
                    label={`Option ${index + 1}`}
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...props.pollOptions];
                      newOptions[index] = e.target.value;
                      props.setPollOptions(newOptions);
                    }}
                  />
                  {props.pollOptions.length > 2 && (
                    <Button
                      type="button"
                      onClick={() => {
                        const newOptions = props.pollOptions.filter((_, i) => i !== index);
                        props.setPollOptions(newOptions);
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
                const newOptions = [...props.pollOptions, ''];
                props.setPollOptions(newOptions);
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
              value={props.questionText}
              onChange={(e) => {
                const newQuestionText = e.target.value;
                props.setQuestionText(newQuestionText);

                // Automatically set the form key to the question text
                props.setQuestionFormKey(newQuestionText.split(' ').join('_').toLowerCase());
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
              value={props.questionInputType}
              onChange={props.setQuestionInputType}
            />
          </div>
        </div>
      );
    case 'multistep_form':
      return (
        <CreateMultistepForm
          className={styles.details}
          multistepQuestions={props.multistepQuestions}
          setMultistepQuestions={props.setMultistepQuestions}
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
              value={props.announcementMessage}
              onChange={(e) => props.setAnnouncementMessage(e.target.value)}
            />
            <span className={styles.helpText}>
              {`Include the participant's name with {{ participant_name }}`}
            </span>
          </div>
        </div>
      );
    case 'mad_lib':
      return (
        <div className={styles.details}>
          <div className={styles.left}>
            <TextInput
              label="Mad Lib Template"
              placeholder="The {{adjective}} {{noun}} jumped over the {{verb}}!"
              required
              value={props.madLibTemplate}
              onChange={(e) => props.setMadLibTemplate(e.target.value)}
            />
            <span className={styles.helpText}>
              Use {`{{variable_name}}`} to mark variables in your template
            </span>
          </div>
          <div className={styles.right}>
            <div className={styles.list}>
              {props.madLibVariables.map(
                (
                  variable: { id: string; name: string; assigned_user_id?: string },
                  index: number,
                ) => (
                  <div className={styles.item} key={index}>
                    <TextInput
                      label={`Variable ${index + 1} Name`}
                      placeholder="adjective"
                      value={variable.name}
                      onChange={(e) => {
                        const newVariables = [...props.madLibVariables];
                        newVariables[index].name = e.target.value;
                        props.setMadLibVariables(newVariables);
                      }}
                    />
                    <Dropdown
                      label="Assign to participant"
                      options={[
                        { label: 'Unassigned', value: '' },
                        ...props.participants.map((p: { name: string; user_id: string }) => ({
                          label: p.name,
                          value: p.user_id,
                        })),
                      ]}
                      value={variable.assigned_user_id || ''}
                      onChange={(value) => {
                        const newVariables = [...props.madLibVariables];
                        newVariables[index].assigned_user_id = value || undefined;
                        props.setMadLibVariables(newVariables);
                      }}
                    />
                    {props.madLibVariables.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => {
                          const newVariables = props.madLibVariables.filter(
                            (_: any, i: number) => i !== index,
                          );
                          props.setMadLibVariables(newVariables);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ),
              )}
            </div>
            <Button
              type="button"
              onClick={() => {
                const newId = (props.madLibVariables.length + 1).toString();
                props.setMadLibVariables([
                  ...props.madLibVariables,
                  { id: newId, name: '', assigned_user_id: '' },
                ]);
              }}
            >
              Add Variable
            </Button>
          </div>
        </div>
      );
    default:
      return <div className={styles.details}>Unknown: {props.kind}</div>;
  }
}
