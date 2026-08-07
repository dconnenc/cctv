import { useRef } from 'react';

import { ArrowLeft, Play, Save } from 'lucide-react';

import { Button } from '@cctv/core';
import { BLOCK_KIND_LABELS, Block, BlockKind, ParticipantSummary } from '@cctv/types';

import { CreateBlockFields } from '../CreateBlock/CreateBlock';
import { CreateBlockProvider, useCreateBlockContext } from '../CreateBlock/CreateBlockContext';
import { EditBlockFields } from '../EditBlock/EditBlock';
import { EditBlockProvider, useEditBlockContext } from '../EditBlock/EditBlockContext';

import styles from './FocusEditor.module.scss';

export type EditorIntent = 'draft' | 'play';

interface FocusEditorProps {
  kind: BlockKind;
  block?: Block;
  participants: ParticipantSummary[];
  onBack: () => void;
  onDone: (intent: EditorIntent) => void;
  onEndCurrentBlock: () => Promise<void>;
}

export default function FocusEditor({
  kind,
  block,
  participants,
  onBack,
  onDone,
  onEndCurrentBlock,
}: FocusEditorProps) {
  const intent = useRef<EditorIntent>('draft');

  if (block) {
    return (
      <EditBlockProvider
        block={block}
        participants={participants}
        onClose={() => onDone(intent.current)}
      >
        <EditDraftForm kind={kind} intent={intent} onBack={onBack} />
      </EditBlockProvider>
    );
  }

  return (
    <CreateBlockProvider
      participants={participants}
      initialKind={kind}
      onClose={() => onDone(intent.current)}
      onEndCurrentBlock={onEndCurrentBlock}
    >
      <CreateForm kind={kind} intent={intent} onBack={onBack} />
    </CreateBlockProvider>
  );
}

interface FormProps {
  kind: BlockKind;
  intent: React.MutableRefObject<EditorIntent>;
  onBack: () => void;
}

function CreateForm({ kind, intent, onBack }: FormProps) {
  const { submit, isSubmitting, error } = useCreateBlockContext();

  const run = (next: EditorIntent) => {
    intent.current = next;
    submit(next === 'play' ? 'open' : 'hidden');
  };

  return (
    <Shell
      title={`New ${BLOCK_KIND_LABELS[kind]}`}
      error={error}
      isSubmitting={isSubmitting}
      onBack={onBack}
      onDraft={() => run('draft')}
      onPlay={() => run('play')}
    >
      <CreateBlockFields />
    </Shell>
  );
}

function EditDraftForm({ kind, intent, onBack }: FormProps) {
  const { submit, isSubmitting, error } = useEditBlockContext();

  const run = (next: EditorIntent) => {
    intent.current = next;
    submit();
  };

  return (
    <Shell
      title={BLOCK_KIND_LABELS[kind]}
      error={error}
      isSubmitting={isSubmitting}
      onBack={onBack}
      onDraft={() => run('draft')}
      onPlay={() => run('play')}
    >
      <EditBlockFields />
    </Shell>
  );
}

interface ShellProps {
  title: string;
  error: string | null;
  isSubmitting: boolean;
  children: React.ReactNode;
  onBack: () => void;
  onDraft: () => void;
  onPlay: () => void;
}

function Shell({ title, error, isSubmitting, children, onBack, onDraft, onPlay }: ShellProps) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={onBack} title="Back to activities">
          <ArrowLeft size={18} />
          <span>Back</span>
        </Button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.fields}>{children}</div>

      <div className={styles.actions}>
        <div className={styles.spacer} />
        <Button variant="secondary" onClick={onDraft} disabled={isSubmitting}>
          <Save size={16} />
          <span>Save as draft</span>
        </Button>
        <Button onClick={onPlay} loading={isSubmitting} loadingText="Starting...">
          <Play size={16} />
          <span>Play</span>
        </Button>
      </div>
    </div>
  );
}
