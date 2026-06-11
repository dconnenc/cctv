/**
 * Family Feud Manager - Organizes survey responses into categorized buckets
 *
 * Architecture decisions:
 *
 * 1. Reducer Pattern with Optimistic Updates
 *    - Multiple users may edit simultaneously via websockets
 *    - Reducer centralizes state updates from both local actions and remote broadcasts
 *    - UI updates immediately on user action, API call fires in background
 *    - If API fails, websocket broadcast won't arrive and state stays inconsistent (acceptable trade-off)
 *
 * 2. Selective Loading Indicators
 *    - Slow operations (add/delete bucket): Show loading to prevent duplicate clicks during API round-trip
 *    - Fast operations (drag-drop, rename): No loading state, instant UI feedback feels more responsive
 *    - Rename uses debouncing (500ms) to batch rapid typing into single API call
 *
 * 3. Append-Only Bucket Answers
 *    - No position/order tracking for answers within buckets
 *    - Avoids complex CRDT or operational transform logic for concurrent reordering
 *    - Simpler conflict resolution: last write wins for bucket assignment only
 *    - Trade-off: dragging answer to specific position appends to end instead
 *
 * Real-time answer/question updates:
 *   The reducer handles ANSWER_RECEIVED, QUESTION_ADDED, and QUESTION_DELETED actions from
 *   `family_feud_updated` websocket broadcasts. Backend detects when answers are submitted to
 *   Family Feud child questions or when child questions are added/deleted, and broadcasts
 *   granular actions to the admin stream. This keeps answer lists and questions in sync across
 *   multiple admins while preserving local UI state.
 *
 * State Architecture:
 *   - Domain state (questions, buckets, answers): Managed by reducer, synced via websockets
 *   - UI state (collapsed questions/buckets): Local useState, resets on page reload
 *   This separation keeps sync logic simple - only domain changes propagate across clients.
 *
 *   Note: Two sources of truth exist temporarily - global experience.blocks (updated by
 *   experience_updated) and local reducer state (updated by family_feud_updated). The component
 *   initializes from props on mount, then only updates via reducer actions. This isolation
 *   prevents other block updates from resetting Family Feud state.
 */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Music,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button } from '@cctv/core';
import { TextInput } from '@cctv/core/TextInput/TextInput';
import { useFamilyFeudBuckets } from '@cctv/hooks/useFamilyFeudBuckets';
import { useScrollFade } from '@cctv/hooks/useScrollFade';
import { Block, BlockKind, BlockResponse } from '@cctv/types';

import FamilyFeudPlayingControls from './FamilyFeudPlayingControls';
import {
  FamilyFeudAction,
  FamilyFeudActionType,
  QuestionWithBuckets,
  familyFeudReducer,
} from './familyFeudReducer';
import {
  DEFAULT_SYNTHETIC_COUNT,
  MAX_SYNTHETIC_COUNT,
  MIN_SYNTHETIC_COUNT,
  clampSyntheticCount,
} from './synthetic';

import styles from './FamilyFeudManager.module.scss';

interface FamilyFeudChildPayload {
  question?: string;
  ai_context?: string;
  synthetic?: boolean;
  generate_count?: number;
  buckets?: Array<{ id: string; name: string; answer_ids?: string[] }>;
}

interface FamilyFeudManagerProps {
  block: Block;
  onBucketOperation?: (action: FamilyFeudAction) => void;
  // When set, that question starts expanded (others collapsed) — used when the
  // manager is opened by selecting a specific (e.g. synthetic) child question.
  focusQuestionId?: string;
}

export default function FamilyFeudManager({ block, focusQuestionId }: FamilyFeudManagerProps) {
  const { code } = useExperience();
  const [questionsState, dispatch] = useReducer(familyFeudReducer, []);
  const {
    addBucket,
    renameBucket,
    deleteBucket,
    assignAnswer,
    autoCategorize,
    generateSyntheticAnswers,
    updateAiContext,
    updateQuestionAiContext,
  } = useFamilyFeudBuckets(block.id, dispatch);
  const childQuestions = block.children ?? [];
  const [editingBucketNames, setEditingBucketNames] = useState<Record<string, string>>({});
  const renameTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [addingBucketForQuestion, setAddingBucketForQuestion] = useState<string | null>(null);
  const [deletingBucketId, setDeletingBucketId] = useState<string | null>(null);
  const [startingPlaying, setStartingPlaying] = useState(false);
  const [togglingTheme, setTogglingTheme] = useState(false);
  const [autoCategorizing, setAutoCategorizing] = useState<string | null>(null);
  const [generatingQuestion, setGeneratingQuestion] = useState<string | null>(null);
  const [syntheticQuestionTexts, setSyntheticQuestionTexts] = useState<Record<string, string>>({});
  // Held as raw strings so the input can be cleared/edited freely; clamped to a
  // valid count only when answers are generated.
  const [syntheticCounts, setSyntheticCounts] = useState<Record<string, string>>({});

  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<string>>(new Set());
  const [collapsedBuckets, setCollapsedBuckets] = useState<Set<string>>(new Set());

  const payload = block.kind === BlockKind.FAMILY_FEUD ? block.payload : undefined;

  const [gameAiContext, setGameAiContext] = useState(payload?.ai_context ?? '');
  const [aiSettingsExpanded, setAiSettingsExpanded] = useState(!!payload?.ai_context);
  const gameContextTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [questionAiContexts, setQuestionAiContexts] = useState<Record<string, string>>({});
  const questionContextTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const gameState = payload?.game_state;
  const isPlaying = gameState?.phase === 'playing';
  const isThemePlaying = payload?.theme_music_playing ?? false;

  // Initialize state from block data on mount only
  // Subsequent updates come via websocket broadcasts -> reducer actions
  // This preserves UI state (collapsed states, optimistic updates)
  useEffect(() => {
    const newQuestionsState: QuestionWithBuckets[] = childQuestions.map((childBlock: Block) => {
      const responses =
        (childBlock.responses as { all_responses?: BlockResponse[] }).all_responses ?? [];
      const childPayload = childBlock.payload as FamilyFeudChildPayload | undefined;
      const questionBuckets = childPayload?.buckets ?? [];

      const allAnswers = responses.map((response) => {
        const answerText =
          typeof response.answer === 'string'
            ? response.answer
            : (response.answer?.value ?? JSON.stringify(response.answer));

        return {
          id: response.id,
          text: answerText,
          participantId: response.experience_participant_id,
          userName: 'User',
          questionId: childBlock.id,
        };
      });

      const savedBuckets = questionBuckets.map((b) => ({
        id: b.id,
        name: b.name,
        answers: allAnswers.filter((a) => b.answer_ids?.includes(a.id)),
        isCollapsed: false,
      }));

      const assignedAnswerIds = new Set(
        savedBuckets.flatMap((bucket) => bucket.answers.map((a) => a.id)),
      );
      const unassignedAnswers = allAnswers.filter((a) => !assignedAnswerIds.has(a.id));

      const isSynthetic = childPayload?.synthetic ?? false;

      return {
        questionId: childBlock.id,
        questionText: childPayload?.question ?? (isSynthetic ? '' : 'Question'),
        buckets: savedBuckets,
        unassignedAnswers,
        synthetic: isSynthetic,
        generateCount: childPayload?.generate_count ?? DEFAULT_SYNTHETIC_COUNT,
      };
    });

    dispatch({ type: FamilyFeudActionType.INIT, payload: newQuestionsState });

    // Initialize collapsed state: collapse all questions and all buckets by default
    // (except a focused question, which starts expanded).
    const allQuestionIds = new Set(childQuestions.map((q: Block) => q.id));
    if (focusQuestionId) allQuestionIds.delete(focusQuestionId);
    const allBucketIds = new Set(newQuestionsState.flatMap((q) => q.buckets.map((b) => b.id)));
    setCollapsedQuestions(allQuestionIds);
    setCollapsedBuckets(allBucketIds);

    const contextMap: Record<string, string> = {};
    const syntheticTextMap: Record<string, string> = {};
    const syntheticCountMap: Record<string, string> = {};
    childQuestions.forEach((childBlock: Block) => {
      const childPayload = childBlock.payload as FamilyFeudChildPayload | undefined;
      contextMap[childBlock.id] = childPayload?.ai_context ?? '';
      if (childPayload?.synthetic) {
        syntheticTextMap[childBlock.id] = childPayload.question ?? '';
        syntheticCountMap[childBlock.id] = String(
          childPayload.generate_count ?? DEFAULT_SYNTHETIC_COUNT,
        );
      }
    });
    setQuestionAiContexts(contextMap);
    setSyntheticQuestionTexts(syntheticTextMap);
    setSyntheticCounts(syntheticCountMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddBucket = useCallback(
    async (questionId: string) => {
      setAddingBucketForQuestion(questionId);
      try {
        const question = questionsState.find((q) => q.questionId === questionId);
        const bucketCount = question?.buckets.length || 0;
        await addBucket(block.id, questionId, `Bucket ${bucketCount + 1}`);
        // Websocket broadcast will update the state
      } finally {
        setAddingBucketForQuestion(null);
      }
    },
    [addBucket, block.id, questionsState],
  );

  const handleRenameBucket = useCallback(
    (questionId: string, bucketId: string, name: string) => {
      // Update local editing state immediately
      setEditingBucketNames((prev) => ({ ...prev, [bucketId]: name }));

      // Debounce the API call
      if (renameTimeoutRef.current[bucketId]) {
        clearTimeout(renameTimeoutRef.current[bucketId]);
      }

      renameTimeoutRef.current[bucketId] = setTimeout(async () => {
        await renameBucket(block.id, questionId, bucketId, name);
        // Websocket broadcast will update the state
      }, 500);
    },
    [block.id, renameBucket],
  );

  const handleDeleteBucket = useCallback(
    async (questionId: string, bucketId: string) => {
      setDeletingBucketId(bucketId);
      try {
        await deleteBucket(block.id, questionId, bucketId);
        // Websocket broadcast will update the state
      } finally {
        setDeletingBucketId(null);
      }
    },
    [deleteBucket, block.id],
  );

  const handleGameAiContextChange = useCallback(
    (value: string) => {
      setGameAiContext(value);
      if (gameContextTimeoutRef.current) clearTimeout(gameContextTimeoutRef.current);
      gameContextTimeoutRef.current = setTimeout(() => {
        updateAiContext(block.id, value);
      }, 500);
    },
    [block.id, updateAiContext],
  );

  const handleQuestionAiContextChange = useCallback(
    (questionId: string, value: string) => {
      setQuestionAiContexts((prev) => ({ ...prev, [questionId]: value }));
      if (questionContextTimeoutRefs.current[questionId]) {
        clearTimeout(questionContextTimeoutRefs.current[questionId]);
      }
      questionContextTimeoutRefs.current[questionId] = setTimeout(() => {
        updateQuestionAiContext(block.id, questionId, value);
      }, 500);
    },
    [block.id, updateQuestionAiContext],
  );

  const handleAutoCategorize = useCallback(
    async (questionId: string) => {
      setAutoCategorizing(questionId);
      try {
        const result = await autoCategorize(block.id, questionId);
        if (!result?.buckets) return;

        const question = questionsState.find((q) => q.questionId === questionId);
        if (!question) return;

        const allAnswers = [
          ...question.unassignedAnswers,
          ...question.buckets.flatMap((b) => b.answers),
        ];
        const newBuckets = result.buckets.map((b) => ({
          id: b.id,
          name: b.name,
          answers: allAnswers.filter((a) => b.answer_ids?.includes(a.id)),
        }));

        const assignedIds = new Set(newBuckets.flatMap((b) => b.answers.map((a) => a.id)));
        const newUnassigned = allAnswers.filter((a) => !assignedIds.has(a.id));

        const updatedQuestions = questionsState.map((q) =>
          q.questionId === questionId
            ? { ...q, buckets: newBuckets, unassignedAnswers: newUnassigned }
            : q,
        );

        dispatch({ type: FamilyFeudActionType.INIT, payload: updatedQuestions });
      } finally {
        setAutoCategorizing(null);
      }
    },
    [autoCategorize, block.id, questionsState],
  );

  const handleGenerateSyntheticAnswers = useCallback(
    async (questionId: string) => {
      const questionText = (syntheticQuestionTexts[questionId] ?? '').trim();
      if (!questionText) return;
      const count = clampSyntheticCount(Number(syntheticCounts[questionId]));

      setGeneratingQuestion(questionId);
      try {
        const result = await generateSyntheticAnswers(block.id, questionId, questionText, count);
        if (!result?.answers) return;

        const generatedAnswers = result.answers.map((a) => ({
          id: a.id,
          text: a.text,
          participantId: '',
          userName: 'AI',
          questionId,
        }));

        // Regenerating replaces prior answers and clears this question's buckets.
        const updatedQuestions = questionsState.map((q) =>
          q.questionId === questionId
            ? { ...q, questionText, buckets: [], unassignedAnswers: generatedAnswers }
            : q,
        );

        dispatch({ type: FamilyFeudActionType.INIT, payload: updatedQuestions });
      } finally {
        setGeneratingQuestion(null);
      }
    },
    [block.id, generateSyntheticAnswers, questionsState, syntheticQuestionTexts, syntheticCounts],
  );

  const handleDragEnd = useCallback(
    async (result: any, questionId: string) => {
      const { source, destination, draggableId: answerId } = result;

      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
      }

      const bucketId = destination.droppableId === 'unassigned' ? null : destination.droppableId;

      // Optimistic update - instant UI feedback
      dispatch({ type: FamilyFeudActionType.ANSWER_ASSIGNED, payload: { answerId, bucketId } });

      // API call in background - don't await, fire and forget
      assignAnswer(block.id, questionId, answerId, bucketId);
    },
    [assignAnswer, block.id],
  );

  const toggleQuestion = useCallback((questionId: string) => {
    setCollapsedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  const toggleBucket = useCallback((bucketId: string) => {
    setCollapsedBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(bucketId)) {
        next.delete(bucketId);
      } else {
        next.add(bucketId);
      }
      return next;
    });
  }, []);

  const handleStartPlaying = useCallback(async () => {
    if (!code) return;
    setStartingPlaying(true);
    try {
      const response = await fetch(
        `/api/experiences/${code}/blocks/${block.id}/family_feud/start_playing`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (!response.ok) throw new Error('Failed to start playing');
    } catch (error) {
      console.error('Error starting playing:', error);
    } finally {
      setStartingPlaying(false);
    }
  }, [code, block.id]);

  const handleToggleThemeMusic = useCallback(async () => {
    if (!code) return;
    setTogglingTheme(true);
    try {
      const response = await fetch(
        `/api/experiences/${code}/blocks/${block.id}/family_feud/theme_music`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playing: !isThemePlaying }),
        },
      );
      if (!response.ok) throw new Error('Failed to toggle theme music');
    } catch (error) {
      console.error('Error toggling theme music:', error);
    } finally {
      setTogglingTheme(false);
    }
  }, [code, block.id, isThemePlaying]);

  const handleRestartThemeMusic = useCallback(async () => {
    if (!code) return;
    setTogglingTheme(true);
    try {
      const response = await fetch(
        `/api/experiences/${code}/blocks/${block.id}/family_feud/theme_music/restart`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (!response.ok) throw new Error('Failed to restart theme music');
    } catch (error) {
      console.error('Error restarting theme music:', error);
    } finally {
      setTogglingTheme(false);
    }
  }, [code, block.id]);

  const handleRevealBucket = useCallback(
    async (questionIndex: number, bucketIndex: number) => {
      if (!code) return;
      try {
        const response = await fetch(
          `/api/experiences/${code}/blocks/${block.id}/family_feud/reveal_bucket`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question_index: questionIndex, bucket_index: bucketIndex }),
          },
        );
        if (!response.ok) throw new Error('Failed to reveal bucket');
      } catch (error) {
        console.error('Error revealing bucket:', error);
      }
    },
    [code, block.id],
  );

  const handleShowX = useCallback(async () => {
    if (!code) return;
    try {
      const response = await fetch(
        `/api/experiences/${code}/blocks/${block.id}/family_feud/show_x`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (!response.ok) throw new Error('Failed to show X');
    } catch (error) {
      console.error('Error showing X:', error);
    }
  }, [code, block.id]);

  const handleNextQuestion = useCallback(async () => {
    if (!code) return;
    try {
      const response = await fetch(
        `/api/experiences/${code}/blocks/${block.id}/family_feud/next_question`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (!response.ok) throw new Error('Failed to advance question');
    } catch (error) {
      console.error('Error advancing question:', error);
    }
  }, [code, block.id]);

  const handleRestartPlaying = useCallback(async () => {
    if (!code) return;
    try {
      const response = await fetch(
        `/api/experiences/${code}/blocks/${block.id}/family_feud/restart_playing`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (!response.ok) throw new Error('Failed to restart playing');
    } catch (error) {
      console.error('Error restarting playing:', error);
    }
  }, [code, block.id]);

  const handleRestartCategorizing = useCallback(async () => {
    if (!code) return;
    try {
      const response = await fetch(
        `/api/experiences/${code}/blocks/${block.id}/family_feud/restart_categorizing`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (!response.ok) throw new Error('Failed to restart categorizing');
    } catch (error) {
      console.error('Error restarting categorizing:', error);
    }
  }, [code, block.id]);

  const handleRestartEverything = useCallback(async () => {
    if (!code) return;
    try {
      const response = await fetch(
        `/api/experiences/${code}/blocks/${block.id}/family_feud/restart_everything`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (!response.ok) throw new Error('Failed to reset everything');
    } catch (error) {
      console.error('Error resetting everything:', error);
    }
  }, [code, block.id]);

  const themeMusicButton = (
    <div className={styles.themeMusicControls}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleThemeMusic}
        disabled={togglingTheme}
        icon={isThemePlaying ? <Pause size={16} /> : <Music size={16} />}
      >
        {isThemePlaying ? 'Pause Theme' : 'Play Theme'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestartThemeMusic}
        disabled={togglingTheme}
        icon={<RotateCcw size={16} />}
        hideLabel
      >
        Restart Theme
      </Button>
    </div>
  );

  if (childQuestions.length === 0) {
    return (
      <div className={styles.root}>
        <div className={styles.empty}>
          <p>No questions found for this Family Feud block.</p>
        </div>
      </div>
    );
  }

  if (isPlaying && gameState) {
    return (
      <div className={styles.root}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>{payload?.title || 'Family Feud'}</h2>
          {themeMusicButton}
        </div>
        <FamilyFeudPlayingControls
          block={block}
          gameState={gameState}
          onRevealBucket={handleRevealBucket}
          onShowX={handleShowX}
          onNextQuestion={handleNextQuestion}
          onRestartPlaying={handleRestartPlaying}
          onRestartCategorizing={handleRestartCategorizing}
          onRestartEverything={handleRestartEverything}
        />
      </div>
    );
  }
  return (
    <div className={styles.root}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>{payload?.title ?? 'Family Feud'}</h2>
        <div className={styles.headerActions}>
          {themeMusicButton}
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartPlaying}
            disabled={startingPlaying}
          >
            <Play size={20} />
            {startingPlaying ? 'Starting...' : 'Start Playing'}
          </Button>
        </div>
      </div>
      <div className={styles.aiSettings}>
        <button
          className={styles.aiSettingsHeader}
          onClick={() => setAiSettingsExpanded((v) => !v)}
          aria-expanded={aiSettingsExpanded}
        >
          {aiSettingsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>AI Categorization Settings</span>
        </button>
        {aiSettingsExpanded && (
          <div className={styles.aiSettingsContent}>
            <label className={styles.aiContextLabel} htmlFor="game-ai-context">
              Game context
              <span className={styles.aiContextHint}>
                {' '}
                — Describe the event theme or audience. Applies to all questions.
              </span>
            </label>
            <textarea
              id="game-ai-context"
              className={styles.aiContextTextarea}
              value={gameAiContext}
              onChange={(e) => handleGameAiContextChange(e.target.value)}
              placeholder="e.g. Corporate team-building event for a tech company audience"
              rows={3}
            />
          </div>
        )}
      </div>

      {questionsState.map((question) => {
        const isQuestionCollapsed = collapsedQuestions.has(question.questionId);
        const questionLabel =
          question.synthetic && !question.questionText
            ? 'Synthetic Question'
            : question.questionText;
        return (
          <div key={question.questionId} className={styles.questionContainer}>
            <button
              className={styles.questionHeader}
              onClick={() => toggleQuestion(question.questionId)}
              aria-expanded={!isQuestionCollapsed}
              aria-label={
                isQuestionCollapsed ? `Expand ${questionLabel}` : `Collapse ${questionLabel}`
              }
            >
              {isQuestionCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
              {question.synthetic && <Wand2 size={16} className={styles.syntheticIcon} />}
              <h3 className={styles.questionTitle}>{questionLabel}</h3>
              <span className={styles.questionCount}>
                ({question.unassignedAnswers.length} unassigned, {question.buckets.length} buckets)
              </span>
            </button>

            {!isQuestionCollapsed && (
              <div className={styles.questionContent}>
                {question.synthetic && (
                  <SyntheticGenerationPanel
                    question={question}
                    questionText={syntheticQuestionTexts[question.questionId] ?? ''}
                    count={syntheticCounts[question.questionId] ?? String(DEFAULT_SYNTHETIC_COUNT)}
                    isGenerating={generatingQuestion === question.questionId}
                    onQuestionTextChange={(value) =>
                      setSyntheticQuestionTexts((prev) => ({
                        ...prev,
                        [question.questionId]: value,
                      }))
                    }
                    onCountChange={(value) =>
                      setSyntheticCounts((prev) => ({ ...prev, [question.questionId]: value }))
                    }
                    onGenerate={() => handleGenerateSyntheticAnswers(question.questionId)}
                  />
                )}
                <div className={styles.questionAiContext}>
                  <label className={styles.aiContextLabel}>
                    Question context
                    <span className={styles.aiContextHint}>
                      {' '}
                      — Guide the AI for this question only (optional).
                    </span>
                  </label>
                  <textarea
                    className={styles.aiContextTextarea}
                    value={questionAiContexts[question.questionId] ?? ''}
                    onChange={(e) =>
                      handleQuestionAiContextChange(question.questionId, e.target.value)
                    }
                    placeholder="e.g. Focus on food categories, ignore drink mentions"
                    rows={2}
                  />
                </div>
                <DragDropContext onDragEnd={(result) => handleDragEnd(result, question.questionId)}>
                  <div className={styles.layout}>
                    <BucketsColumn
                      question={question}
                      addingBucketForQuestion={addingBucketForQuestion}
                      autoCategorizing={autoCategorizing}
                      editingBucketNames={editingBucketNames}
                      deletingBucketId={deletingBucketId}
                      collapsedBuckets={collapsedBuckets}
                      onAddBucket={handleAddBucket}
                      onAutoCategorize={handleAutoCategorize}
                      onRenameBucket={handleRenameBucket}
                      onDeleteBucket={handleDeleteBucket}
                      onToggleBucket={toggleBucket}
                    />
                    <AnswersColumn answers={question.unassignedAnswers} />
                  </div>
                </DragDropContext>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const SyntheticGenerationPanel = ({
  question,
  questionText,
  count,
  isGenerating,
  onQuestionTextChange,
  onCountChange,
  onGenerate,
}: {
  question: QuestionWithBuckets;
  questionText: string;
  count: string;
  isGenerating: boolean;
  onQuestionTextChange: (value: string) => void;
  onCountChange: (value: string) => void;
  onGenerate: () => void;
}) => {
  const hasAnswers =
    question.unassignedAnswers.length > 0 || question.buckets.some((b) => b.answers.length > 0);
  const canGenerate = questionText.trim().length > 0 && !isGenerating;

  return (
    <div className={styles.syntheticPanel}>
      <div className={styles.syntheticPanelHeader}>
        <Wand2 size={16} />
        <span>AI-generated answers</span>
        <span className={styles.aiContextHint}>
          {' '}
          — Dispatch this question to the agent. Not shown to participants.
        </span>
      </div>
      <div className={styles.syntheticPanelFields}>
        <TextInput
          label="Question"
          placeholder="Enter the question to send to the agent"
          value={questionText}
          onChange={(e) => onQuestionTextChange(e.target.value)}
        />
        <div className={styles.syntheticPanelCount}>
          <TextInput
            type="number"
            label="Answers"
            value={count}
            min={MIN_SYNTHETIC_COUNT}
            max={MAX_SYNTHETIC_COUNT}
            onChange={(e) => onCountChange(e.target.value)}
          />
        </div>
        <Button variant="primary" size="sm" onClick={onGenerate} disabled={!canGenerate}>
          {isGenerating ? (
            <Loader2 size={16} className={styles.spinner} />
          ) : hasAnswers ? (
            <RotateCcw size={16} />
          ) : (
            <Wand2 size={16} />
          )}
          {isGenerating ? 'Generating...' : hasAnswers ? 'Reroll' : 'Generate Answers'}
        </Button>
      </div>
    </div>
  );
};

const BucketsColumn = ({
  question,
  addingBucketForQuestion,
  autoCategorizing,
  editingBucketNames,
  deletingBucketId,
  collapsedBuckets,
  onAddBucket,
  onAutoCategorize,
  onRenameBucket,
  onDeleteBucket,
  onToggleBucket,
}: {
  question: QuestionWithBuckets;
  addingBucketForQuestion: string | null;
  autoCategorizing: string | null;
  editingBucketNames: Record<string, string>;
  deletingBucketId: string | null;
  collapsedBuckets: Set<string>;
  onAddBucket: (questionId: string) => void;
  onAutoCategorize: (questionId: string) => void;
  onRenameBucket: (questionId: string, bucketId: string, name: string) => void;
  onDeleteBucket: (questionId: string, bucketId: string) => void;
  onToggleBucket: (bucketId: string) => void;
}) => {
  const isCategorizing = autoCategorizing === question.questionId;
  const hasUnassigned = question.unassignedAnswers.length > 0;

  return (
    <div className={styles.bucketsColumn}>
      <div className={styles.columnHeader}>
        <span>Buckets</span>
        <div className={styles.columnHeaderActions}>
          {hasUnassigned && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAutoCategorize(question.questionId)}
              disabled={isCategorizing}
            >
              {isCategorizing ? (
                <Loader2 size={16} className={styles.spinner} />
              ) : (
                <Sparkles size={16} />
              )}
              {isCategorizing ? 'Categorizing...' : 'Auto-categorize'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddBucket(question.questionId)}
            disabled={addingBucketForQuestion === question.questionId}
          >
            <Plus size={16} />
            {addingBucketForQuestion === question.questionId ? 'Adding...' : 'Add Bucket'}
          </Button>
        </div>
      </div>

      <div className={styles.bucketsList}>
        {question.buckets.map((bucket) => (
          <BucketItem
            key={bucket.id}
            questionId={question.questionId}
            bucket={bucket}
            isCollapsed={collapsedBuckets.has(bucket.id)}
            editingBucketNames={editingBucketNames}
            deletingBucketId={deletingBucketId}
            onRenameBucket={onRenameBucket}
            onDeleteBucket={onDeleteBucket}
            onToggleBucket={() => onToggleBucket(bucket.id)}
          />
        ))}

        {question.buckets.length === 0 && (
          <div className={styles.noBuckets}>
            <p>Click "Add Bucket" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BucketItem = ({
  questionId,
  bucket,
  isCollapsed,
  editingBucketNames,
  deletingBucketId,
  onRenameBucket,
  onDeleteBucket,
  onToggleBucket,
}: {
  questionId: string;
  bucket: any;
  isCollapsed: boolean;
  editingBucketNames: Record<string, string>;
  deletingBucketId: string | null;
  onRenameBucket: (questionId: string, bucketId: string, name: string) => void;
  onDeleteBucket: (questionId: string, bucketId: string) => void;
  onToggleBucket: () => void;
}) => {
  // renderClone fixes drag positioning when inside a dialog/modal with CSS transforms
  const renderClone = (provided: any, snapshot: any, rubric: any) => {
    const answer = bucket.answers[rubric.source.index];
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`${styles.answer} ${snapshot.isDragging ? styles.isDragging : ''}`}
      >
        {answer.text}
      </div>
    );
  };

  return (
    <Droppable droppableId={bucket.id} renderClone={renderClone}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`${styles.bucket} ${snapshot.isDraggingOver ? styles.isDraggingOver : ''}`}
        >
          <div className={styles.bucketHeader}>
            <Button
              variant="ghost"
              size="sm"
              icon={isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              hideLabel
              onClick={onToggleBucket}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? `Expand ${bucket.name}` : `Collapse ${bucket.name}`}
            </Button>
            <input
              type="text"
              value={editingBucketNames[bucket.id] ?? bucket.name}
              onChange={(e) => onRenameBucket(questionId, bucket.id, e.target.value)}
              className={styles.bucketNameInput}
            />
            <span className={styles.bucketCount}>({bucket.answers.length})</span>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} />}
              hideLabel
              loading={deletingBucketId === bucket.id}
              onClick={() => onDeleteBucket(questionId, bucket.id)}
              disabled={deletingBucketId === bucket.id}
            >
              Delete {bucket.name}
            </Button>
          </div>

          {!isCollapsed && <BucketDropZone bucket={bucket} snapshot={snapshot} />}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

const BucketDropZone = ({ bucket, snapshot }: { bucket: any; snapshot: any }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollFade(scrollRef);

  return (
    <div
      ref={scrollRef}
      className={`${styles.bucketDropZone} ${snapshot.isDraggingOver ? styles.isDraggingOver : ''}`}
    >
      <div className={styles.bucketDropZoneInner}>
        {bucket.answers.length === 0 ? (
          <div className={styles.emptyBucket}>Drop answers here</div>
        ) : (
          bucket.answers.map((answer: any, index: number) => (
            <Draggable key={answer.id} draggableId={answer.id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`${styles.answer} ${snapshot.isDragging ? styles.isDragging : ''}`}
                >
                  {answer.text}
                </div>
              )}
            </Draggable>
          ))
        )}
      </div>
    </div>
  );
};

const AnswersColumn = ({ answers }: { answers: any[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollFade(scrollRef);

  // renderClone fixes drag positioning when inside a dialog/modal with CSS transforms
  const renderClone = (provided: any, snapshot: any, rubric: any) => {
    const answer = answers[rubric.source.index];
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`${styles.answer} ${snapshot.isDragging ? styles.isDragging : ''}`}
      >
        {answer.text}
      </div>
    );
  };

  return (
    <div className={styles.answersColumn}>
      <div className={styles.columnHeader}>
        <span>Answers ({answers.length})</span>
      </div>

      <Droppable droppableId="unassigned" renderClone={renderClone}>
        {(provided, snapshot) => (
          <div
            ref={scrollRef}
            {...provided.droppableProps}
            className={`${styles.answersList} ${snapshot.isDraggingOver ? styles.isDraggingOver : ''}`}
          >
            <div ref={provided.innerRef} className={styles.answersListInner}>
              {answers.length === 0 ? (
                <div className={styles.noAnswers}>
                  <p>All answers have been assigned to buckets.</p>
                </div>
              ) : (
                answers.map((answer, index) => (
                  <Draggable key={answer.id} draggableId={answer.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`${styles.answer} ${snapshot.isDragging ? styles.isDragging : ''}`}
                      >
                        {answer.text}
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
};
