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

export interface QuestionWithBuckets {
  questionId: string;
  questionText: string;
  buckets: Bucket[];
  unassignedAnswers: Answer[];
  isCollapsed: boolean;
}

export enum FamilyFeudActionType {
  INIT = 'INIT',
  BUCKET_ADDED = 'BUCKET_ADDED',
  BUCKET_RENAMED = 'BUCKET_RENAMED',
  BUCKET_DELETED = 'BUCKET_DELETED',
  ANSWER_ASSIGNED = 'ANSWER_ASSIGNED',
  TOGGLE_QUESTION = 'TOGGLE_QUESTION',
  TOGGLE_BUCKET = 'TOGGLE_BUCKET',
}

export type FamilyFeudAction =
  | { type: FamilyFeudActionType.INIT; payload: QuestionWithBuckets[] }
  | {
      type: FamilyFeudActionType.BUCKET_ADDED;
      payload: { questionId?: string; bucket: { id: string; name: string } };
    }
  | { type: FamilyFeudActionType.BUCKET_RENAMED; payload: { bucketId: string; name: string } }
  | { type: FamilyFeudActionType.BUCKET_DELETED; payload: { bucketId: string } }
  | {
      type: FamilyFeudActionType.ANSWER_ASSIGNED;
      payload: { answerId: string; bucketId: string | null };
    }
  | { type: FamilyFeudActionType.TOGGLE_QUESTION; payload: { questionId: string } }
  | {
      type: FamilyFeudActionType.TOGGLE_BUCKET;
      payload: { questionId: string; bucketId: string };
    };

export function familyFeudReducer(
  state: QuestionWithBuckets[],
  action: FamilyFeudAction,
): QuestionWithBuckets[] {
  switch (action.type) {
    case FamilyFeudActionType.INIT:
      return action.payload;

    case FamilyFeudActionType.BUCKET_ADDED: {
      const { bucket, questionId } = action.payload;
      return state.map((q) =>
        q.questionId === questionId
          ? {
              ...q,
              buckets: [...q.buckets, { ...bucket, answers: [], isCollapsed: false }],
            }
          : q,
      );
    }

    case FamilyFeudActionType.BUCKET_RENAMED: {
      const { bucketId, name } = action.payload;
      return state.map((q) => ({
        ...q,
        buckets: q.buckets.map((b) => (b.id === bucketId ? { ...b, name } : b)),
      }));
    }

    case FamilyFeudActionType.BUCKET_DELETED: {
      const { bucketId } = action.payload;
      return state.map((q) => {
        const bucketToDelete = q.buckets.find((b) => b.id === bucketId);
        if (!bucketToDelete) return q;

        return {
          ...q,
          buckets: q.buckets.filter((b) => b.id !== bucketId),
          unassignedAnswers: [...q.unassignedAnswers, ...bucketToDelete.answers],
        };
      });
    }

    case FamilyFeudActionType.ANSWER_ASSIGNED: {
      const { answerId, bucketId } = action.payload;
      return state.map((q) => {
        // Find the answer across all buckets and unassigned
        let answer: Answer | undefined;
        const newBuckets = q.buckets.map((bucket) => {
          const answerIndex = bucket.answers.findIndex((a) => a.id === answerId);
          if (answerIndex >= 0) {
            answer = bucket.answers[answerIndex];
            return {
              ...bucket,
              answers: bucket.answers.filter((a) => a.id !== answerId),
            };
          }
          return bucket;
        });

        const unassignedIndex = q.unassignedAnswers.findIndex((a) => a.id === answerId);
        if (unassignedIndex >= 0) {
          answer = q.unassignedAnswers[unassignedIndex];
        }

        if (!answer) return q;

        // Remove from unassigned
        const newUnassigned = q.unassignedAnswers.filter((a) => a.id !== answerId);

        // Add to target bucket or leave unassigned
        if (bucketId) {
          return {
            ...q,
            buckets: newBuckets.map((b) =>
              b.id === bucketId ? { ...b, answers: [...b.answers, answer!] } : b,
            ),
            unassignedAnswers: newUnassigned,
          };
        } else {
          return {
            ...q,
            buckets: newBuckets,
            unassignedAnswers: [...newUnassigned, answer],
          };
        }
      });
    }

    case FamilyFeudActionType.TOGGLE_QUESTION: {
      const { questionId } = action.payload;
      return state.map((q) =>
        q.questionId === questionId ? { ...q, isCollapsed: !q.isCollapsed } : q,
      );
    }

    case FamilyFeudActionType.TOGGLE_BUCKET: {
      const { questionId, bucketId } = action.payload;
      return state.map((q) =>
        q.questionId === questionId
          ? {
              ...q,
              buckets: q.buckets.map((b) =>
                b.id === bucketId ? { ...b, isCollapsed: !b.isCollapsed } : b,
              ),
            }
          : q,
      );
    }

    default:
      return state;
  }
}
