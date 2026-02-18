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
import { ChevronDown, ChevronRight, Loader2, Play, Plus, Trash2 } from 'lucide-react';

import { Button } from '@cctv/components/ui/button';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useFamilyFeudBuckets } from '@cctv/hooks/useFamilyFeudBuckets';
import { useScrollFade } from '@cctv/hooks/useScrollFade';
import { Block, BlockKind, BlockResponse, FamilyFeudPayload } from '@cctv/types';

import FamilyFeudPlayingControls from './FamilyFeudPlayingControls';
import {
  FamilyFeudAction,
  FamilyFeudActionType,
  QuestionWithBuckets,
  familyFeudReducer,
} from './familyFeudReducer';

import styles from './FamilyFeudManager.module.scss';

interface FamilyFeudChildPayload {
  question?: string;
  buckets?: Array<{ id: string; name: string; answer_ids?: string[] }>;
}

interface FamilyFeudManagerProps {
  block: Block;
  onBucketOperation?: (action: FamilyFeudAction) => void;
}

export default function FamilyFeudManager({ block, onBucketOperation }: FamilyFeudManagerProps) {
  const { code } = useExperience();
  const [questionsState, dispatch] = useReducer(familyFeudReducer, []);
  const { addBucket, renameBucket, deleteBucket, assignAnswer } = useFamilyFeudBuckets(
    block.id,
    dispatch,
  );
  const childQuestions = block.children ?? [];
  const [editingBucketNames, setEditingBucketNames] = useState<Record<string, string>>({});
  const renameTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [addingBucketForQuestion, setAddingBucketForQuestion] = useState<string | null>(null);
  const [deletingBucketId, setDeletingBucketId] = useState<string | null>(null);
  const [startingPlaying, setStartingPlaying] = useState(false);

  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<string>>(new Set());
  const [collapsedBuckets, setCollapsedBuckets] = useState<Set<string>>(new Set());

  const payload = block.kind === BlockKind.FAMILY_FEUD ? block.payload : undefined;
  const gameState = payload?.game_state;
  const isPlaying = gameState?.phase === 'playing';

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
          userId: response.user_id,
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

      return {
        questionId: childBlock.id,
        questionText: childPayload?.question ?? 'Question',
        buckets: savedBuckets,
        unassignedAnswers,
      };
    });

    dispatch({ type: FamilyFeudActionType.INIT, payload: newQuestionsState });

    // Initialize collapsed state: collapse all questions and all buckets by default
    const allQuestionIds = new Set(childQuestions.map((q: Block) => q.id));
    const allBucketIds = new Set(newQuestionsState.flatMap((q) => q.buckets.map((b) => b.id)));
    setCollapsedQuestions(allQuestionIds);
    setCollapsedBuckets(allBucketIds);
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
        <h2 className={styles.title}>{payload?.title || 'Family Feud'}</h2>
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
        <Button variant="default" size="lg" onClick={handleStartPlaying} disabled={startingPlaying}>
          <Play size={20} />
          {startingPlaying ? 'Starting...' : 'Start Playing'}
        </Button>
      </div>
      {questionsState.map((question) => {
        const isQuestionCollapsed = collapsedQuestions.has(question.questionId);
        return (
          <div key={question.questionId} className={styles.questionContainer}>
            <button
              className={styles.questionHeader}
              onClick={() => toggleQuestion(question.questionId)}
              aria-expanded={!isQuestionCollapsed}
            >
              {isQuestionCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
              <h3 className={styles.questionTitle}>{question.questionText}</h3>
              <span className={styles.questionCount}>
                ({question.unassignedAnswers.length} unassigned, {question.buckets.length} buckets)
              </span>
            </button>

            {!isQuestionCollapsed && (
              <div className={styles.questionContent}>
                <DragDropContext onDragEnd={(result) => handleDragEnd(result, question.questionId)}>
                  <div className={styles.layout}>
                    <BucketsColumn
                      question={question}
                      addingBucketForQuestion={addingBucketForQuestion}
                      editingBucketNames={editingBucketNames}
                      deletingBucketId={deletingBucketId}
                      collapsedBuckets={collapsedBuckets}
                      onAddBucket={handleAddBucket}
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

const BucketsColumn = ({
  question,
  addingBucketForQuestion,
  editingBucketNames,
  deletingBucketId,
  collapsedBuckets,
  onAddBucket,
  onRenameBucket,
  onDeleteBucket,
  onToggleBucket,
}: {
  question: QuestionWithBuckets;
  addingBucketForQuestion: string | null;
  editingBucketNames: Record<string, string>;
  deletingBucketId: string | null;
  collapsedBuckets: Set<string>;
  onAddBucket: (questionId: string) => void;
  onRenameBucket: (questionId: string, bucketId: string, name: string) => void;
  onDeleteBucket: (questionId: string, bucketId: string) => void;
  onToggleBucket: (bucketId: string) => void;
}) => (
  <div className={styles.bucketsColumn}>
    <div className={styles.columnHeader}>
      <span>Buckets</span>
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
            <button className={styles.collapseButton} onClick={onToggleBucket}>
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
            <input
              type="text"
              value={editingBucketNames[bucket.id] ?? bucket.name}
              onChange={(e) => onRenameBucket(questionId, bucket.id, e.target.value)}
              className={styles.bucketNameInput}
            />
            <span className={styles.bucketCount}>({bucket.answers.length})</span>
            <button
              className={styles.deleteButton}
              onClick={() => onDeleteBucket(questionId, bucket.id)}
              disabled={deletingBucketId === bucket.id}
            >
              {deletingBucketId === bucket.id ? (
                <Loader2 size={14} className={styles.spinner} />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
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
