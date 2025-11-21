import { useEffect, useState } from 'react';

import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';

import { Button } from '@cctv/core';
import { Block } from '@cctv/types';

import styles from './FamilyFeudManager.module.scss';

interface Answer {
  id: string;
  text: string;
  userId: string;
  userName: string;
  questionId: string;
}

interface Bucket {
  id: string;
  name: string;
  answers: Answer[];
  isCollapsed: boolean;
}

interface QuestionWithBuckets {
  questionId: string;
  questionText: string;
  buckets: Bucket[];
  unassignedAnswers: Answer[];
}

interface FamilyFeudManagerProps {
  block: Block;
}

export default function FamilyFeudManager({ block }: FamilyFeudManagerProps) {
  // Get child question blocks
  const childQuestions = (block as any).children || [];

  // Initialize state for each question with buckets
  const [questionsState, setQuestionsState] = useState<QuestionWithBuckets[]>([]);

  // Update questionsState when block data changes (websocket updates)
  useEffect(() => {
    const newQuestionsState = childQuestions.map((childBlock: Block) => {
      // Get responses for this question
      const responses = (childBlock.responses as any)?.all_responses || [];

      const unassignedAnswers: Answer[] = responses.map((response: any) => {
        // Handle answer being either a string or an object with a value property
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

      return {
        questionId: childBlock.id,
        questionText: (childBlock as any).payload?.question || 'Question',
        buckets: [],
        unassignedAnswers,
      };
    });

    setQuestionsState(newQuestionsState);
  }, [childQuestions.length, block]);

  const addBucket = (questionId: string) => {
    setQuestionsState((prev) =>
      prev.map((q) => {
        if (q.questionId === questionId) {
          const newBucket: Bucket = {
            id: `bucket-${Date.now()}`,
            name: `Bucket ${q.buckets.length + 1}`,
            answers: [],
            isCollapsed: false,
          };
          return { ...q, buckets: [...q.buckets, newBucket] };
        }
        return q;
      }),
    );
  };

  const deleteBucket = (questionId: string, bucketId: string) => {
    setQuestionsState((prev) =>
      prev.map((q) => {
        if (q.questionId === questionId) {
          const bucketToDelete = q.buckets.find((b) => b.id === bucketId);
          if (!bucketToDelete) return q;

          const newUnassigned = [...q.unassignedAnswers, ...bucketToDelete.answers];
          const newBuckets = q.buckets.filter((b) => b.id !== bucketId);

          return {
            ...q,
            buckets: newBuckets,
            unassignedAnswers: newUnassigned,
          };
        }
        return q;
      }),
    );
  };

  const toggleBucketCollapse = (questionId: string, bucketId: string) => {
    setQuestionsState((prev) =>
      prev.map((q) => {
        if (q.questionId === questionId) {
          return {
            ...q,
            buckets: q.buckets.map((b) =>
              b.id === bucketId ? { ...b, isCollapsed: !b.isCollapsed } : b,
            ),
          };
        }
        return q;
      }),
    );
  };

  const renameBucket = (questionId: string, bucketId: string, newName: string) => {
    setQuestionsState((prev) =>
      prev.map((q) => {
        if (q.questionId === questionId) {
          return {
            ...q,
            buckets: q.buckets.map((b) => (b.id === bucketId ? { ...b, name: newName } : b)),
          };
        }
        return q;
      }),
    );
  };

  const handleDragEnd = (result: any, questionId: string) => {
    const { source, destination } = result;

    // Dropped outside a valid droppable
    if (!destination) {
      return;
    }

    // Didn't move
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    setQuestionsState((prev) =>
      prev.map((q) => {
        if (q.questionId !== questionId) return q;

        let newQ = { ...q };
        let movedAnswer: Answer | null = null;

        // Remove from source
        if (source.droppableId === 'unassigned') {
          movedAnswer = newQ.unassignedAnswers[source.index];
          newQ.unassignedAnswers = newQ.unassignedAnswers.filter((_, idx) => idx !== source.index);
        } else {
          const sourceBucket = newQ.buckets.find((b) => b.id === source.droppableId);
          if (sourceBucket) {
            movedAnswer = sourceBucket.answers[source.index];
            newQ.buckets = newQ.buckets.map((b) =>
              b.id === source.droppableId
                ? { ...b, answers: b.answers.filter((_, idx) => idx !== source.index) }
                : b,
            );
          }
        }

        if (!movedAnswer) return q;

        // Add to destination
        if (destination.droppableId === 'unassigned') {
          newQ.unassignedAnswers.splice(destination.index, 0, movedAnswer);
        } else {
          newQ.buckets = newQ.buckets.map((b) =>
            b.id === destination.droppableId
              ? {
                  ...b,
                  answers: [
                    ...b.answers.slice(0, destination.index),
                    movedAnswer!,
                    ...b.answers.slice(destination.index),
                  ],
                }
              : b,
          );
        }

        return newQ;
      }),
    );
  };

  if (childQuestions.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No questions found for this Family Feud block.</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{(block as any).payload?.title || 'Family Feud'}</h2>

      {questionsState.map((question) => (
        <div key={question.questionId} className={styles.question}>
          <h3 className={styles.questionTitle}>{question.questionText}</h3>

          <DragDropContext onDragEnd={(result) => handleDragEnd(result, question.questionId)}>
            <div className={styles.layout}>
              {/* Left side: Buckets */}
              <div className={styles.bucketsColumn}>
                <div className={styles.columnHeader}>
                  <span>Buckets</span>
                  <Button
                    onClick={() => addBucket(question.questionId)}
                    className={styles.addButton}
                  >
                    <Plus size={16} />
                    Add Bucket
                  </Button>
                </div>

                <div className={styles.bucketsList}>
                  {question.buckets.map((bucket) => (
                    <div key={bucket.id} className={styles.bucket}>
                      <div className={styles.bucketHeader}>
                        <button
                          className={styles.collapseButton}
                          onClick={() => toggleBucketCollapse(question.questionId, bucket.id)}
                        >
                          {bucket.isCollapsed ? (
                            <ChevronRight size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                        <input
                          type="text"
                          value={bucket.name}
                          onChange={(e) =>
                            renameBucket(question.questionId, bucket.id, e.target.value)
                          }
                          className={styles.bucketNameInput}
                        />
                        <span className={styles.bucketCount}>({bucket.answers.length})</span>
                        <button
                          className={styles.deleteButton}
                          onClick={() => deleteBucket(question.questionId, bucket.id)}
                        >
                          <Trash2 size={14} />
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

              {/* Right side: Unassigned Answers */}
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
        </div>
      ))}
    </div>
  );
}
