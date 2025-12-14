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
import { ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@cctv/components/ui/button';
import { DialogDescription, DialogTitle } from '@cctv/components/ui/dialog';
import { useFamilyFeudBuckets, useScrollFade } from '@cctv/hooks';
import { Block } from '@cctv/types';

import {
  FamilyFeudAction,
  FamilyFeudActionType,
  QuestionWithBuckets,
  familyFeudReducer,
} from './familyFeudReducer';

import styles from './FamilyFeudManager.module.scss';

interface FamilyFeudManagerProps {
  block: Block;
  onBucketOperation?: (action: FamilyFeudAction) => void;
}

export default function FamilyFeudManager({ block, onBucketOperation }: FamilyFeudManagerProps) {
  const [questionsState, dispatch] = useReducer(familyFeudReducer, []);
  const { addBucket, renameBucket, deleteBucket, assignAnswer } = useFamilyFeudBuckets(
    block.id,
    dispatch,
  );
  const childQuestions = (block as any).children || [];
  const [editingBucketNames, setEditingBucketNames] = useState<Record<string, string>>({});
  const renameTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [addingBucketForQuestion, setAddingBucketForQuestion] = useState<string | null>(null);
  const [deletingBucketId, setDeletingBucketId] = useState<string | null>(null);

  // UI-only state (not synced, resets on page load)
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<string>>(new Set());
  const [collapsedBuckets, setCollapsedBuckets] = useState<Set<string>>(new Set());

  // Initialize state from block data on mount only
  // Subsequent updates come via websocket broadcasts -> reducer actions
  // This preserves UI state (collapsed states, optimistic updates)
  useEffect(() => {
    const bucketConfig = (block as any).payload?.bucket_configuration?.buckets || [];

    const newQuestionsState: QuestionWithBuckets[] = childQuestions.map((childBlock: Block) => {
      const responses = (childBlock.responses as any)?.all_responses || [];

      const allAnswers = responses.map((response: any) => {
        const answerText =
          typeof response.answer === 'string'
            ? response.answer
            : response.answer?.value || JSON.stringify(response.answer);

        return {
          id: response.id,
          text: answerText,
          userId: response.user_id,
          userName: 'User',
          questionId: childBlock.id,
        };
      });

      const savedBuckets = bucketConfig.map((b: any) => ({
        id: b.id,
        name: b.name,
        answers: allAnswers.filter((a: any) => b.answer_ids?.includes(a.id)),
        isCollapsed: false,
      }));

      const assignedAnswerIds = new Set(
        savedBuckets.flatMap((bucket: any) => bucket.answers.map((a: any) => a.id)),
      );
      const unassignedAnswers = allAnswers.filter((a: any) => !assignedAnswerIds.has(a.id));

      return {
        questionId: childBlock.id,
        questionText: (childBlock as any).payload?.question || 'Question',
        buckets: savedBuckets,
        unassignedAnswers,
      };
    });

    dispatch({ type: FamilyFeudActionType.INIT, payload: newQuestionsState });

    // Initialize collapsed state: collapse all questions and all buckets by default
    const allQuestionIds = new Set(childQuestions.map((q: Block) => q.id));
    const allBucketIds = new Set(bucketConfig.map((b: any) => b.id));
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
        const bucket = await addBucket(block.id, `Bucket ${bucketCount + 1}`);
        if (bucket) {
          dispatch({ type: FamilyFeudActionType.BUCKET_ADDED, payload: { questionId, bucket } });
        }
      } finally {
        setAddingBucketForQuestion(null);
      }
    },
    [addBucket, block.id, questionsState],
  );

  const handleRenameBucket = useCallback(
    (bucketId: string, name: string) => {
      // Update local editing state immediately
      setEditingBucketNames((prev) => ({ ...prev, [bucketId]: name }));

      // Debounce the API call
      if (renameTimeoutRef.current[bucketId]) {
        clearTimeout(renameTimeoutRef.current[bucketId]);
      }

      renameTimeoutRef.current[bucketId] = setTimeout(async () => {
        const success = await renameBucket(block.id, bucketId, name);
        if (success) {
          dispatch({ type: FamilyFeudActionType.BUCKET_RENAMED, payload: { bucketId, name } });
        }
      }, 500);
    },
    [block.id, renameBucket],
  );

  const handleDeleteBucket = useCallback(
    async (bucketId: string) => {
      setDeletingBucketId(bucketId);
      try {
        const success = await deleteBucket(block.id, bucketId);
        if (success) {
          dispatch({ type: FamilyFeudActionType.BUCKET_DELETED, payload: { bucketId } });
        }
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
      assignAnswer(block.id, answerId, bucketId);
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

  if (childQuestions.length === 0) {
    return (
      <div className={styles.root}>
        <div className={styles.empty}>
          <p>No questions found for this Family Feud block.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <DialogTitle className={styles.title}>
        {(block as any).payload?.title || 'Family Feud'}
      </DialogTitle>
      <DialogDescription className="sr-only">
        Organize survey responses into categorized buckets
      </DialogDescription>
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
  onRenameBucket: (bucketId: string, name: string) => void;
  onDeleteBucket: (bucketId: string) => void;
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
  bucket,
  isCollapsed,
  editingBucketNames,
  deletingBucketId,
  onRenameBucket,
  onDeleteBucket,
  onToggleBucket,
}: {
  bucket: any;
  isCollapsed: boolean;
  editingBucketNames: Record<string, string>;
  deletingBucketId: string | null;
  onRenameBucket: (bucketId: string, name: string) => void;
  onDeleteBucket: (bucketId: string) => void;
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
              onChange={(e) => onRenameBucket(bucket.id, e.target.value)}
              className={styles.bucketNameInput}
            />
            <span className={styles.bucketCount}>({bucket.answers.length})</span>
            <button
              className={styles.deleteButton}
              onClick={() => onDeleteBucket(bucket.id)}
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
