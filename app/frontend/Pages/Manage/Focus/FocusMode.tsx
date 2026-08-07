import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import classNames from 'classnames';
import { BookOpen, Bug, LayoutGrid, MonitorPlay, MoreHorizontal, Users } from 'lucide-react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Pill,
} from '@cctv/core';
import { useBlockPresentation } from '@cctv/hooks/useBlockPresentation';
import { BLOCK_KIND_LABELS, Block, BlockKind, ParticipantSummary } from '@cctv/types';

import ExperienceActionButton from '../ExperienceActionButton';
import { ActivityTile, blockSummary } from './ActivityTile';
import FocusEditor, { EditorIntent } from './FocusEditor';
import FocusHistory from './FocusHistory';
import FocusReview from './FocusReview';
import FocusStage from './FocusStage';
import { setManageMode } from './useManageMode';

import styles from './FocusMode.module.scss';

type Stage =
  | { name: 'select' }
  | { name: 'editor'; kind: BlockKind; block?: Block }
  | { name: 'live' }
  | { name: 'review'; blockId: string };

type SelectTab = 'activities' | 'history';

export default function FocusMode() {
  const navigate = useNavigate();
  const { experience, code, isLoading, wsReady } = useExperience();
  const { handlePresent, handleStopPresenting, closeBlock, statusError } = useBlockPresentation();

  const [stage, setStage] = useState<Stage>({ name: 'select' });
  const [selectTab, setSelectTab] = useState<SelectTab>('activities');
  const [isFinishing, setIsFinishing] = useState(false);
  const initializedRef = useRef(false);

  const participants: ParticipantSummary[] = useMemo(
    () => [...(experience?.hosts || []), ...(experience?.participants || [])],
    [experience],
  );

  const openBlock = useMemo(
    () => experience?.blocks?.find((block) => block.status === 'open'),
    [experience],
  );

  const drafts = useMemo(
    () =>
      (experience?.blocks || []).filter(
        (block) => block.status === 'hidden' && !block.parent_block_id,
      ),
    [experience],
  );

  const history = useMemo(
    () =>
      (experience?.blocks || [])
        .filter((block) => block.status === 'closed' && !block.parent_block_id)
        .sort((a, b) => b.position - a.position),
    [experience],
  );

  const reviewBlock = useMemo(
    () =>
      stage.name === 'review'
        ? experience?.blocks?.find((block) => block.id === stage.blockId)
        : undefined,
    [experience, stage],
  );

  useEffect(() => {
    setManageMode('focus');
  }, []);

  useEffect(() => {
    if (initializedRef.current || !experience) return;
    initializedRef.current = true;
    if (openBlock) setStage({ name: 'live' });
  }, [experience, openBlock]);

  const endCurrentBlock = useCallback(async () => {
    if (!openBlock) return;
    await closeBlock(openBlock);
  }, [openBlock, closeBlock]);

  const handleEditorDone = useCallback(
    async (intent: EditorIntent, draft?: Block) => {
      if (intent === 'draft') {
        setStage({ name: 'select' });
        return;
      }

      if (draft) await handlePresent(draft);
      setStage({ name: 'live' });
    },
    [handlePresent],
  );

  const handleFinish = useCallback(async () => {
    if (!openBlock) {
      setStage({ name: 'select' });
      return;
    }

    setIsFinishing(true);
    await handleStopPresenting(openBlock);
    setIsFinishing(false);
    setStage({ name: 'select' });
  }, [openBlock, handleStopPresenting]);

  const exitFocusMode = useCallback(() => {
    setManageMode('manage');
    navigate(`/experiences/${code}/manage`);
  }, [navigate, code]);

  if (isLoading || !wsReady) {
    return <section className="page flex-centered">Loading...</section>;
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.name}>{experience?.name || 'Experience'}</span>
        {experience?.status && (
          <Pill label={experience.status.charAt(0).toUpperCase() + experience.status.slice(1)} />
        )}
        <div className={styles.spacer} />
        <ExperienceActionButton />
        <Button
          to={`/experiences/${code}/monitor`}
          target="_blank"
          rel="noreferrer"
          variant="secondary"
          title="Open monitor in a new tab"
        >
          <MonitorPlay size={16} />
          <span>Monitor</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" title="More">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/experiences/${code}/manage/participants`)}>
              <Users size={16} />
              Participants
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/experiences/${code}/manage/playbill`)}>
              <BookOpen size={16} />
              Playbill
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/experiences/${code}/manage/debug`)}>
              <Bug size={16} />
              Debug
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exitFocusMode}>
              <LayoutGrid size={16} />
              Full manage view
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {statusError && <div className={styles.error}>{statusError}</div>}

      <div className={styles.body}>
        {stage.name === 'select' && (
          <div className={styles.select}>
            <div className={styles.tabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={selectTab === 'activities'}
                className={classNames(styles.tab, selectTab === 'activities' && styles.tabActive)}
                onClick={() => setSelectTab('activities')}
              >
                Activities
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={selectTab === 'history'}
                className={classNames(styles.tab, selectTab === 'history' && styles.tabActive)}
                onClick={() => setSelectTab('history')}
              >
                History
                {history.length > 0 && <span className={styles.tabCount}>{history.length}</span>}
              </button>
            </div>

            {selectTab === 'history' ? (
              <FocusHistory
                blocks={history}
                onSelect={(block) => setStage({ name: 'review', blockId: block.id })}
              />
            ) : (
              <>
                {drafts.length > 0 && (
                  <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Drafts</h2>
                    <p className={styles.sectionHint}>
                      Prepared earlier — pick one up and play it.
                    </p>
                    <div className={styles.grid}>
                      {drafts.map((draft) => (
                        <ActivityTile
                          key={draft.id}
                          kind={draft.kind}
                          label={blockSummary(draft) || BLOCK_KIND_LABELS[draft.kind]}
                          isDraft
                          onClick={() =>
                            setStage({ name: 'editor', kind: draft.kind, block: draft })
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Choose an activity</h2>
                  <div className={styles.grid}>
                    {Object.values(BlockKind).map((kind) => (
                      <ActivityTile
                        key={kind}
                        kind={kind}
                        label={BLOCK_KIND_LABELS[kind]}
                        onClick={() => setStage({ name: 'editor', kind })}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {stage.name === 'editor' && (
          <FocusEditor
            key={stage.block?.id ?? stage.kind}
            kind={stage.kind}
            block={stage.block}
            participants={participants}
            onBack={() => setStage({ name: 'select' })}
            onDone={(intent) => handleEditorDone(intent, stage.block)}
            onEndCurrentBlock={endCurrentBlock}
          />
        )}

        {stage.name === 'live' &&
          (openBlock ? (
            <FocusStage block={openBlock} isFinishing={isFinishing} onFinish={handleFinish} />
          ) : (
            <div className={styles.placeholder}>
              <p>Putting it on the monitor…</p>
              <Button variant="secondary" onClick={() => setStage({ name: 'select' })}>
                Back to activities
              </Button>
            </div>
          ))}

        {stage.name === 'review' && reviewBlock && (
          <FocusReview
            block={reviewBlock}
            participants={participants}
            onBack={() => setStage({ name: 'select' })}
          />
        )}
      </div>
    </section>
  );
}
