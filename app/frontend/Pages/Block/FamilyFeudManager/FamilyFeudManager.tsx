import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@cctv/components/ui/button';
import { useFamilyFeudBuckets } from '@cctv/hooks';
import { Block } from '@cctv/types';

import { FamilyFeudAction, QuestionWithBuckets, familyFeudReducer } from './familyFeudReducer';

import styles from './FamilyFeudManager.module.scss';

interface FamilyFeudManagerProps {
  block: Block;
  onBucketOperation?: (action: FamilyFeudAction) => void;
}

export default function FamilyFeudManager({ block, onBucketOperation }: FamilyFeudManagerProps) {
  const { addBucket, renameBucket, deleteBucket, assignAnswer } = useFamilyFeudBuckets();
  const childQuestions = (block as any).children || [];

  const [questionsState, dispatch] = useReducer(familyFeudReducer, []);
  const [editingBucketNames, setEditingBucketNames] = useState<Record<string, string>>({});
  const renameTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [addingBucketForQuestion, setAddingBucketForQuestion] = useState<string | null>(null);
  const [deletingBucketId, setDeletingBucketId] = useState<string | null>(null);

  // Initialize state from block data on mount and when block changes
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
        isCollapsed: false,
      };
    });

    dispatch({ type: 'INIT', payload: newQuestionsState });
  }, [childQuestions.length, block]);

  // Expose dispatch for websocket updates
  useEffect(() => {
    if (onBucketOperation) {
      (window as any).__familyFeudDispatch = dispatch;
    }
    return () => {
      delete (window as any).__familyFeudDispatch;
    };
  }, [onBucketOperation]);

  const handleAddBucket = async (questionId: string) => {
    setAddingBucketForQuestion(questionId);
    try {
      const question = questionsState.find((q) => q.questionId === questionId);
      const bucketCount = question?.buckets.length || 0;
      const bucket = await addBucket(block.id, `Bucket ${bucketCount + 1}`);
      if (bucket) {
        dispatch({ type: 'BUCKET_ADDED', payload: { questionId, bucket } });
      }
    } finally {
      setAddingBucketForQuestion(null);
    }
  };

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
          dispatch({ type: 'BUCKET_RENAMED', payload: { bucketId, name } });
        }
      }, 500);
    },
    [block.id, renameBucket],
  );

  const handleDeleteBucket = async (bucketId: string) => {
    setDeletingBucketId(bucketId);
    try {
      const success = await deleteBucket(block.id, bucketId);
      if (success) {
        dispatch({ type: 'BUCKET_DELETED', payload: { bucketId } });
      }
    } finally {
      setDeletingBucketId(null);
    }
  };

  const handleDragEnd = async (result: any, questionId: string) => {
    const { source, destination, draggableId: answerId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const bucketId = destination.droppableId === 'unassigned' ? null : destination.droppableId;

    // Optimistic update - instant UI feedback
    dispatch({ type: 'ANSWER_ASSIGNED', payload: { answerId, bucketId } });

    // API call in background - don't await, fire and forget
    assignAnswer(block.id, answerId, bucketId);
  };

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
      <h2 className={styles.title}>{(block as any).payload?.title || 'Family Feud'}</h2>
      {questionsState.map((question) => (
        <div key={question.questionId} className={styles.question}>
          <button
            className={styles.questionHeader}
            onClick={() =>
              dispatch({ type: 'TOGGLE_QUESTION', payload: { questionId: question.questionId } })
            }
          >
            {question.isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
            <h3 className={styles.questionTitle}>{question.questionText}</h3>
            <span className={styles.questionCount}>
              ({question.unassignedAnswers.length} unassigned, {question.buckets.length} buckets)
            </span>
          </button>

          {!question.isCollapsed && (
            <DragDropContext onDragEnd={(result) => handleDragEnd(result, question.questionId)}>
              <div className={styles.layout}>
                <div className={styles.bucketsColumn}>
                  <div className={styles.columnHeader}>
                    <span>Buckets</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddBucket(question.questionId)}
                      disabled={addingBucketForQuestion === question.questionId}
                    >
                      <Plus size={16} />
                      {addingBucketForQuestion === question.questionId ? 'Adding...' : 'Add Bucket'}
                    </Button>
                  </div>

                  <div className={styles.bucketsList}>
                    {question.buckets.map((bucket) => (
                      <div key={bucket.id} className={styles.bucket}>
                        <div className={styles.bucketHeader}>
                          <button
                            className={styles.collapseButton}
                            onClick={() =>
                              dispatch({
                                type: 'TOGGLE_BUCKET',
                                payload: { questionId: question.questionId, bucketId: bucket.id },
                              })
                            }
                          >
                            {bucket.isCollapsed ? (
                              <ChevronRight size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                          <input
                            type="text"
                            value={editingBucketNames[bucket.id] ?? bucket.name}
                            onChange={(e) => handleRenameBucket(bucket.id, e.target.value)}
                            className={styles.bucketNameInput}
                          />
                          <span className={styles.bucketCount}>({bucket.answers.length})</span>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteBucket(bucket.id)}
                            disabled={deletingBucketId === bucket.id}
                          >
                            {deletingBucketId === bucket.id ? (
                              <Loader2 size={14} className={styles.spinner} />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>

                        {!bucket.isCollapsed && (
                          <Droppable droppableId={bucket.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`${styles.bucketDropZone} ${
                                  snapshot.isDraggingOver ? styles.isDraggingOver : ''
                                }`}
                              >
                                {bucket.answers.length === 0 ? (
                                  <div className={styles.emptyBucket}>Drop answers here</div>
                                ) : (
                                  bucket.answers.map((answer, index) => (
                                    <Draggable
                                      key={answer.id}
                                      draggableId={answer.id}
                                      index={index}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`${styles.answer} ${
                                            snapshot.isDragging ? styles.isDragging : ''
                                          }`}
                                        >
                                          {answer.text}
                                        </div>
                                      )}
                                    </Draggable>
                                  ))
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        )}
                      </div>
                    ))}

                    {question.buckets.length === 0 && (
                      <div className={styles.noBuckets}>
                        <p>No buckets yet. Click "Add Bucket" to get started.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.answersColumn}>
                  <div className={styles.columnHeader}>
                    <span>Answers ({question.unassignedAnswers.length})</span>
                  </div>

                  <Droppable droppableId="unassigned">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`${styles.answersList} ${
                          snapshot.isDraggingOver ? styles.isDraggingOver : ''
                        }`}
                      >
                        {question.unassignedAnswers.length === 0 ? (
                          <div className={styles.noAnswers}>
                            <p>All answers have been assigned to buckets.</p>
                          </div>
                        ) : (
                          question.unassignedAnswers.map((answer, index) => (
                            <Draggable key={answer.id} draggableId={answer.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`${styles.answer} ${
                                    snapshot.isDragging ? styles.isDragging : ''
                                  }`}
                                >
                                  {answer.text}
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </DragDropContext>
          )}
        </div>
      ))}
    </div>
  );
}
