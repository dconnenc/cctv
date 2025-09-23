import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button } from '@cctv/core';
import { useCreateExperienceBlock } from '@cctv/hooks/useCreateExperienceBlock';
import { useExperienceStart } from '@cctv/hooks/useExperienceStart';
import { Block, BlockStatus, Experience, ParticipantRole, ParticipantSummary } from '@cctv/types';

import styles from './Manage.module.scss';

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

function KVPill({ label }: { label: string }) {
  return <span className={styles.pill}>{label}</span>;
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className={styles.headerRow}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div className={styles.headerActions}>{children}</div>
    </div>
  );
}

function ParticipantsTable({ rows }: { rows: ParticipantSummary[] }) {
  if (!rows?.length) return <div className={styles.emptyState}>No participants yet.</div>;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={`${p.role}:${p.id}`}>
              <td className={styles.mono}>{p.id}</td>
              <td>{p.name || '—'}</td>
              <td>{p.email || '—'}</td>
              <td>
                <KVPill label={p.role} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlockRowMenu({
  block,
  onChange,
  busy,
}: {
  block: Block;
  onChange: (next: BlockStatus) => void;
  busy?: boolean;
}) {
  const choose = (status: BlockStatus) => () => onChange(status);
  return (
    <details className={styles.menu}>
      <summary className={styles.menuButton} aria-label="Open row actions" />
      <div className={styles.menuList} role="menu">
        <button
          className={styles.menuItem}
          onClick={choose('open')}
          disabled={busy || block.status === 'open'}
        >
          Set “open”
        </button>
        <button
          className={styles.menuItem}
          onClick={choose('closed')}
          disabled={busy || block.status === 'closed'}
        >
          Set “closed”
        </button>
        <button
          className={styles.menuItem}
          onClick={choose('hidden')}
          disabled={busy || block.status === 'hidden'}
        >
          Set “hidden”
        </button>
      </div>
    </details>
  );
}

function BlocksTable({
  blocks,
  onChange,
  busyId,
  participants,
}: {
  blocks: Block[];
  onChange: (b: Block, s: BlockStatus) => void;
  busyId?: string | null;
  participants?: ParticipantSummary[];
}) {
  if (!blocks?.length) return <div className={styles.emptyState}>No blocks yet.</div>;

  const totalParticipants = participants?.length || 0;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Block ID</th>
            <th>Kind</th>
            <th>Status</th>
            <th>Responses</th>
            <th>Visible roles</th>
            <th>Segments</th>
            <th>Targets</th>
            <th>Created</th>
            <th aria-label="Row actions" />
          </tr>
        </thead>
        <tbody>
          {blocks.map((b) => (
            <tr key={b.id}>
              <td className={styles.mono}>{b.id}</td>
              <td>{b.kind}</td>
              <td>
                <KVPill label={b.status} />
                {busyId === b.id && <span className={styles.subtle}> • updating…</span>}
              </td>
              <td>
                {b.responses ? (
                  <div>
                    <div>
                      {b.responses.total} / {totalParticipants}
                    </div>
                    {b.kind === 'poll' &&
                      b.responses.aggregate &&
                      Object.keys(b.responses.aggregate).length > 0 && (
                        <details className={styles.pollDetails}>
                          <summary>View breakdown</summary>
                          <ul className={styles.pollBreakdown}>
                            {Object.entries(b.responses?.aggregate || {}).map(([option, count]) => (
                              <li key={option}>
                                {option}: {count} (
                                {Math.round((count / (b.responses?.total || 1)) * 100)}%)
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    {(b.kind === 'question' || b.kind === 'multistep_form') && (
                      <div className={styles.responseCount}>
                        {b.responses.total} response{b.responses.total !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  '—'
                )}
              </td>
              <td>
                {b.visible_to_roles?.length
                  ? b.visible_to_roles.map((r) => <KVPill key={r} label={r} />)
                  : '—'}
              </td>
              <td>
                {b.visible_to_segments?.length
                  ? b.visible_to_segments.map((s) => <KVPill key={s} label={s} />)
                  : '—'}
              </td>
              <td>{b.target_user_ids?.length ?? 0}</td>
              <td>{fmtDate(b.created_at)}</td>
              <td className={styles.rowMenuCell}>
                <BlockRowMenu block={b} onChange={(s) => onChange(b, s)} busy={busyId === b.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useChangeBlockStatus() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = useCallback(
    async (
      block: Block,
      status: BlockStatus,
    ): Promise<{ success: boolean; error?: string } | null> => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }
      setIsLoading(true);
      setError(null);

      const baseUrl = `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(block.id)}/`;

      try {
        let path = '';
        const method = 'POST';
        let body: any = undefined;

        if (status === 'open') {
          path = `${baseUrl}open`;
        } else if (status === 'closed') {
          path = `${baseUrl}close`;
        }

        body = JSON.stringify({ experience: { status: 'hidden' } });

        const res = await experienceFetch(path, { method, body });
        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const msg = data?.error || `Failed to set status to ${status}`;
          setError(msg);

          return { success: false, error: msg };
        }
        return { success: true };
      } catch (e: any) {
        const msg =
          e?.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch],
  );

  return { change, isLoading, error, setError };
}

export default function Manage() {
  const {
    experience,
    participant,
    code,
    isLoading,
    isPolling,
    experienceStatus,
    error: experienceError,
    experienceFetch,
  } = useExperience();

  const {
    createExperienceBlock,
    isLoading: creating,
    error: createError,
    setError: setCreateError,
  } = useCreateExperienceBlock();

  const { startExperience, isLoading: starting, error: startError } = useExperienceStart();

  const [model, setModel] = useState(experience);

  useEffect(() => {
    setModel(experience as any);
  }, [experience]);

  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [busyBlockId, setBusyBlockId] = useState<string | null>(null);

  const [kind, setKind] = useState<string>('poll');
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

  const topError = useMemo(() => createError || experienceError, [createError, experienceError]);

  const participantsCombined: ParticipantSummary[] = [
    ...(model?.hosts || []),
    ...(model?.participants || []),
  ];

  const blocks: Block[] = Array.isArray((model as any)?.blocks)
    ? ((model as any)?.blocks as Block[])
    : [];

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      status: 'hidden' as BlockStatus,
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
      setShowCreate(false);

      // Reset form state
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
    }
  };

  const {
    change: changeStatus,
    isLoading: changingStatus,
    error: statusError,
    setError: setStatusError,
  } = useChangeBlockStatus();

  const onChangeBlockStatus = useCallback(
    async (block: Block, next: BlockStatus) => {
      if (!code) return;
      setBusyBlockId(block.id);
      setStatusError(null);

      const result = await changeStatus(block, next);

      // No optimistic updates: re-fetch experience when done
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

      if (!result?.success && result?.error) {
        alert(result.error);
      }

      setBusyBlockId(null);
    },
    [code, experienceFetch, changeStatus, setStatusError],
  );

  if (isLoading) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || 'Experience'}</h1>
        <p className={styles.subtitle}>Preparing experience…</p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{code}</h1>
        {experience?.status === 'lobby' && (
          <Button onClick={() => startExperience()} loading={starting} loadingText="Starting...">
            Start!
          </Button>
        )}
        {experience?.status === 'live' && <div>Back to Lobby!</div>}
        <div className={styles.meta}>
          <div>
            Status: <KVPill label={experienceStatus || '—'} />
            {isPolling ? <span className={styles.subtle}> • polling</span> : null}
            {changingStatus && <span className={styles.subtle}> • updating block…</span>}
          </div>
          {participant?.email && <span> • You: {participant.email}</span>}
        </div>
      </div>

      {(topError || statusError || startError) && (
        <div className={styles.errorBanner} role="alert">
          {topError || statusError || startError}
        </div>
      )}

      {/* Participants */}
      <div className={styles.card}>
        <SectionHeader title="Experience Participants" />
        <ParticipantsTable rows={participantsCombined} />
      </div>

      {/* Blocks */}
      <div className={styles.card}>
        <SectionHeader title="Experience Blocks">
          <Button onClick={() => setShowCreate(!showCreate)} aria-expanded={showCreate}>
            {showCreate ? 'Close form' : 'Add new'}
          </Button>
        </SectionHeader>

        <BlocksTable
          blocks={blocks}
          onChange={onChangeBlockStatus}
          busyId={busyBlockId}
          participants={participantsCombined}
        />
      </div>

      {/* Create Block (collapsible) */}
      {showCreate && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Create Block</div>
          <form onSubmit={onSubmit} className={styles.form}>
            <div>
              <label className={styles.label}>
                Kind:
                <select
                  className={styles.input}
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  required
                >
                  <option value="poll">Poll</option>
                  <option value="question">Question</option>
                  <option value="multistep_form">Multistep Form</option>
                  <option value="announcement">Announcement</option>
                </select>
              </label>
            </div>

            {/* Dynamic form content based on kind */}
            {kind === 'poll' && (
              <>
                <div>
                  <label className={styles.label}>
                    Poll Question:
                    <input
                      className={styles.input}
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="What is your question?"
                      required
                    />
                  </label>
                </div>

                <div>
                  <label className={styles.label}>
                    Poll Type:
                    <select
                      className={styles.input}
                      value={pollType}
                      onChange={(e) => setPollType(e.target.value as 'single' | 'multiple')}
                    >
                      <option value="single">Single Choice</option>
                      <option value="multiple">Multiple Choice</option>
                    </select>
                  </label>
                </div>

                <div>
                  <label className={styles.label}>Options:</label>
                  {pollOptions.map((option, index) => (
                    <div key={index} className={styles.optionRow}>
                      <input
                        className={styles.input}
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[index] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        placeholder={`Option ${index + 1}`}
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
                  <Button type="button" onClick={() => setPollOptions([...pollOptions, ''])}>
                    Add Option
                  </Button>
                </div>
              </>
            )}

            {kind === 'announcement' && (
              <div>
                <label className={styles.label}>
                  Announcement Message:
                  <textarea
                    className={styles.textarea}
                    rows={4}
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    placeholder="Enter your announcement here. Use {{participant_name}} to include the participant's name."
                    required
                  />
                </label>
                <div className={styles.helpText}>
                  Tip: Use <code>{'{{participant_name}}'}</code> to personalize the message
                </div>
              </div>
            )}

            {kind === 'question' && (
              <>
                <div>
                  <label className={styles.label}>
                    Question:
                    <input
                      className={styles.input}
                      type="text"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="What would you like to ask?"
                      required
                    />
                  </label>
                </div>

                <div>
                  <label className={styles.label}>
                    Form Key:
                    <input
                      className={styles.input}
                      type="text"
                      value={questionFormKey}
                      onChange={(e) => setQuestionFormKey(e.target.value)}
                      placeholder="unique_field_name"
                      required
                    />
                  </label>
                  <div className={styles.helpText}>
                    Unique identifier for this question's response
                  </div>
                </div>

                <div>
                  <label className={styles.label}>
                    Input Type:
                    <select
                      className={styles.input}
                      value={questionInputType}
                      onChange={(e) =>
                        setQuestionInputType(
                          e.target.value as 'text' | 'number' | 'email' | 'password' | 'tel',
                        )
                      }
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="email">Email</option>
                      <option value="password">Password</option>
                      <option value="tel">Phone</option>
                    </select>
                  </label>
                </div>
              </>
            )}

            {kind === 'multistep_form' && (
              <div>
                <label className={styles.label}>
                  Form Questions:
                  <div className={styles.helpText}>
                    Create multiple questions that participants will answer step-by-step
                  </div>
                </label>

                <div className={styles.exampleBox}>
                  <h5>Example:</h5>
                  <ul>
                    <li>
                      <strong>Question Text:</strong> "What is your name?" (what users see)
                    </li>
                    <li>
                      <strong>Form Key:</strong> "user_name" (how data is stored)
                    </li>
                    <li>
                      <strong>Input Type:</strong> "Text" (text input field)
                    </li>
                  </ul>
                </div>

                {multistepQuestions.map((question, index) => (
                  <div key={index} className={styles.questionGroup}>
                    <div className={styles.questionHeader}>
                      <h4>Question {index + 1}</h4>
                      {multistepQuestions.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => {
                            const newQuestions = multistepQuestions.filter((_, i) => i !== index);
                            setMultistepQuestions(newQuestions);
                          }}
                          className={styles.removeButton}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className={styles.questionFields}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Question Text:
                          <input
                            className={styles.input}
                            type="text"
                            value={question.question}
                            onChange={(e) => {
                              const newQuestions = [...multistepQuestions];
                              newQuestions[index].question = e.target.value;
                              setMultistepQuestions(newQuestions);
                            }}
                            placeholder="What question do you want to ask?"
                          />
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Form Key (unique identifier):
                          <input
                            className={styles.input}
                            type="text"
                            value={question.formKey}
                            onChange={(e) => {
                              const newQuestions = [...multistepQuestions];
                              newQuestions[index].formKey = e.target.value;
                              setMultistepQuestions(newQuestions);
                            }}
                            placeholder="unique_field_name"
                          />
                          <div className={styles.fieldHelpText}>
                            Used to store and identify this question's response data
                          </div>
                        </label>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Input Type:
                          <select
                            className={styles.input}
                            value={question.inputType}
                            onChange={(e) => {
                              const newQuestions = [...multistepQuestions];
                              newQuestions[index].inputType = e.target.value;
                              setMultistepQuestions(newQuestions);
                            }}
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="email">Email</option>
                            <option value="password">Password</option>
                            <option value="tel">Phone</option>
                          </select>
                          <div className={styles.fieldHelpText}>
                            What type of input field to show participants
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={() =>
                    setMultistepQuestions([
                      ...multistepQuestions,
                      { question: '', formKey: '', inputType: 'text' },
                    ])
                  }
                  className={styles.addButton}
                >
                  + Add Another Question
                </Button>
              </div>
            )}

            <div className={styles.grid2}>
              <label className={styles.label}>
                Visible to roles:
                <select
                  className={styles.input}
                  multiple
                  value={visibleRoles}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value,
                    ) as ParticipantRole[];
                    setVisibleRoles(selected);
                  }}
                >
                  <option value="audience">Audience</option>
                  <option value="player">Player</option>
                  <option value="moderator">Moderator</option>
                  <option value="host">Host</option>
                </select>
                <div className={styles.helpText}>Hold Ctrl/Cmd to select multiple</div>
              </label>

              <label className={styles.label}>
                Visible to segments (comma-separated):
                <input
                  className={styles.input}
                  type="text"
                  value={visibleSegmentsText}
                  onChange={(e) => setVisibleSegmentsText(e.target.value)}
                  placeholder="segment-a, segment-b"
                />
              </label>
            </div>

            <div>
              <label className={styles.label}>
                Target user IDs (comma-separated UUIDs):
                <input
                  className={styles.input}
                  type="text"
                  value={targetUserIdsText}
                  onChange={(e) => setTargetUserIdsText(e.target.value)}
                  placeholder="uuid-1, uuid-2"
                />
              </label>
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={openImmediately}
                onChange={(e) => setOpenImmediately(e.target.checked)}
              />
              Open immediately
            </label>

            <div className={styles.actions}>
              <Button type="submit" loading={creating} loadingText="Creating...">
                Create Block
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
