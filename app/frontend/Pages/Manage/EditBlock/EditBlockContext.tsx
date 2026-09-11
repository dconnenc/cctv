import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useUpdateExperienceBlock } from '@cctv/hooks/useUpdateExperienceBlock';
import {
  ApiPayload,
  Block,
  BlockKind,
  EditBlockContextValue,
  FormBlockData,
  ParticipantSummary,
} from '@cctv/types';

import {
  announcementPayloadToFormData,
  buildAnnouncementPayload,
  validateAnnouncement,
} from '../CreateBlock/CreateAnnouncement/CreateAnnouncement';
import {
  buildBuzzerPayload,
  buzzerPayloadToFormData,
  validateBuzzer,
} from '../CreateBlock/CreateBuzzer/CreateBuzzer';
import {
  buildCollaborativeDrawingPayload,
  collaborativeDrawingPayloadToFormData,
  validateCollaborativeDrawing,
} from '../CreateBlock/CreateCollaborativeDrawing/CreateCollaborativeDrawing';
import {
  buildFamilyFeudPayload,
  familyFeudPayloadToFormData,
  validateFamilyFeud,
} from '../CreateBlock/CreateFamilyFeud/CreateFamilyFeud';
import {
  buildGuessWhoPayload,
  guessWhoPayloadToFormData,
  validateGuessWho,
} from '../CreateBlock/CreateGuessWho/CreateGuessWho';
import {
  buildMinigameArithmeticPayload,
  minigameArithmeticPayloadToFormData,
  validateMinigameArithmetic,
} from '../CreateBlock/CreateMinigameArithmetic/CreateMinigameArithmetic';
import {
  buildMinigameBalloonPumpPayload,
  minigameBalloonPumpPayloadToFormData,
  validateMinigameBalloonPump,
} from '../CreateBlock/CreateMinigameBalloonPump/CreateMinigameBalloonPump';
import {
  buildPhotoUploadPayload,
  photoUploadPayloadToFormData,
  validatePhotoUpload,
} from '../CreateBlock/CreatePhotoUpload/CreatePhotoUpload';
import {
  buildPollPayload,
  pollPayloadToFormData,
  validatePoll,
} from '../CreateBlock/CreatePoll/CreatePoll';
import {
  buildQuestionPayload,
  questionPayloadToFormData,
  validateQuestion,
} from '../CreateBlock/CreateQuestion/CreateQuestion';
import {
  buildTheScenePayload,
  theScenePayloadToFormData,
  validateTheScene,
} from '../CreateBlock/CreateTheScene/CreateTheScene';

const EditBlockContext = createContext<EditBlockContextValue | null>(null);

export function useEditBlockContext() {
  const context = useContext(EditBlockContext);
  if (!context) {
    throw new Error('useEditBlockContext must be used within an EditBlockProvider');
  }
  return context;
}

interface EditBlockProviderProps {
  children: ReactNode;
  block: Block;
  participants: ParticipantSummary[];
  onClose: () => void;
}

interface BlockUpdateFields {
  payload: ApiPayload;
  questions?: Array<{ id: string; question: string }>;
}

function payloadShowsOnMonitor(payload: Block['payload']): boolean {
  return !('show_on_monitor' in payload) || payload.show_on_monitor !== false;
}

function blockToFormData(block: Block): FormBlockData {
  const { kind, payload, children } = block;
  switch (kind) {
    case BlockKind.POLL:
      return { kind: BlockKind.POLL, data: pollPayloadToFormData(payload) };
    case BlockKind.QUESTION:
      return { kind: BlockKind.QUESTION, data: questionPayloadToFormData(payload) };
    case BlockKind.ANNOUNCEMENT:
      return { kind: BlockKind.ANNOUNCEMENT, data: announcementPayloadToFormData(payload) };
    case BlockKind.FAMILY_FEUD:
      return {
        kind: BlockKind.FAMILY_FEUD,
        data: familyFeudPayloadToFormData(payload, children),
      };
    case BlockKind.PHOTO_UPLOAD:
      return { kind: BlockKind.PHOTO_UPLOAD, data: photoUploadPayloadToFormData(payload) };
    case BlockKind.BUZZER:
      return { kind: BlockKind.BUZZER, data: buzzerPayloadToFormData(payload) };
    case BlockKind.GUESS_WHO:
      return { kind: BlockKind.GUESS_WHO, data: guessWhoPayloadToFormData(payload) };
    case BlockKind.MINIGAME_ARITHMETIC:
      return {
        kind: BlockKind.MINIGAME_ARITHMETIC,
        data: minigameArithmeticPayloadToFormData(payload),
      };
    case BlockKind.MINIGAME_BALLOON_PUMP:
      return {
        kind: BlockKind.MINIGAME_BALLOON_PUMP,
        data: minigameBalloonPumpPayloadToFormData(payload),
      };
    case BlockKind.COLLABORATIVE_DRAWING:
      return {
        kind: BlockKind.COLLABORATIVE_DRAWING,
        data: collaborativeDrawingPayloadToFormData(block.payload),
      };
    case BlockKind.THE_SCENE:
      return {
        kind: BlockKind.THE_SCENE,
        data: theScenePayloadToFormData(payload),
      };
    default: {
      const exhaustiveCheck: never = kind;
      throw new Error(`Unknown block kind: ${exhaustiveCheck}`);
    }
  }
}

function buildUpdatePayload(blockData: FormBlockData): BlockUpdateFields {
  const { kind, data } = blockData;
  switch (kind) {
    case BlockKind.POLL:
      return { payload: buildPollPayload(data) };
    case BlockKind.QUESTION:
      return { payload: buildQuestionPayload(data) };
    case BlockKind.ANNOUNCEMENT:
      return { payload: buildAnnouncementPayload(data) };
    case BlockKind.FAMILY_FEUD:
      return {
        payload: buildFamilyFeudPayload(data),
        questions: data.questions.map((q) => ({ id: q.id, question: q.question })),
      };
    case BlockKind.PHOTO_UPLOAD:
      return { payload: buildPhotoUploadPayload(data) };
    case BlockKind.BUZZER:
      return { payload: buildBuzzerPayload(data) };
    case BlockKind.GUESS_WHO:
      return { payload: buildGuessWhoPayload(data) };
    case BlockKind.MINIGAME_ARITHMETIC:
      return { payload: buildMinigameArithmeticPayload(data) };
    case BlockKind.MINIGAME_BALLOON_PUMP:
      return { payload: buildMinigameBalloonPumpPayload(data) };
    case BlockKind.COLLABORATIVE_DRAWING:
      return { payload: buildCollaborativeDrawingPayload(data) };
    case BlockKind.THE_SCENE:
      return { payload: buildTheScenePayload(data) };
    default: {
      const exhaustiveCheck: never = kind;
      throw new Error(`Unknown block kind: ${exhaustiveCheck}`);
    }
  }
}

export function EditBlockProvider({
  children,
  block,
  participants,
  onClose,
}: EditBlockProviderProps) {
  const [blockData, setBlockData] = useState<FormBlockData>(() => blockToFormData(block));

  const initialVisibleSegments = block.visible_to_segments ?? [];
  const [visibleSegments, setVisibleSegments] = useState<string[]>(initialVisibleSegments);
  const [showOnMonitor, setShowOnMonitor] = useState<boolean>(() =>
    payloadShowsOnMonitor(block.payload),
  );
  const [viewAdditionalDetails, setViewAdditionalDetails] = useState<boolean>(false);
  const [pendingWarning, setPendingWarning] = useState<string | null>(null);
  const pendingVisibleSegmentIds = useRef<string[]>([]);

  const { experience } = useExperience();

  const {
    updateExperienceBlock,
    isLoading: isSubmitting,
    error: updateError,
    setError: setUpdateError,
  } = useUpdateExperienceBlock();

  const performUpdate = useCallback(
    async (visible_to_segment_ids: string[]) => {
      const { payload, questions } = buildUpdatePayload(blockData);
      const payloadWithShowOnMonitor = { ...payload, show_on_monitor: showOnMonitor };

      const result = await updateExperienceBlock(block.id, {
        payload: payloadWithShowOnMonitor,
        visible_to_segment_ids,
        ...(questions && { questions }),
      });

      if (result?.success) {
        onClose();
      }
    },
    [blockData, block.id, onClose, updateExperienceBlock, showOnMonitor],
  );

  const submit = useCallback(async () => {
    setUpdateError(null);

    const { kind, data } = blockData;
    let validationError: string | null = null;
    switch (kind) {
      case BlockKind.POLL:
        validationError = validatePoll(data);
        break;
      case BlockKind.QUESTION:
        validationError = validateQuestion(data);
        break;
      case BlockKind.ANNOUNCEMENT:
        validationError = validateAnnouncement(data);
        break;
      case BlockKind.FAMILY_FEUD:
        validationError = validateFamilyFeud(data);
        break;
      case BlockKind.PHOTO_UPLOAD:
        validationError = validatePhotoUpload(data);
        break;
      case BlockKind.BUZZER:
        validationError = validateBuzzer(data);
        break;
      case BlockKind.GUESS_WHO:
        validationError = validateGuessWho(data);
        break;
      case BlockKind.MINIGAME_ARITHMETIC:
        validationError = validateMinigameArithmetic(data);
        break;
      case BlockKind.MINIGAME_BALLOON_PUMP:
        validationError = validateMinigameBalloonPump(data);
        break;
      case BlockKind.COLLABORATIVE_DRAWING:
        validationError = validateCollaborativeDrawing(blockData.data);
        break;
      case BlockKind.THE_SCENE:
        validationError = validateTheScene(data);
        break;
      default: {
        const exhaustiveCheck: never = kind;
        validationError = `Unknown block kind: ${exhaustiveCheck}`;
      }
    }

    if (validationError) {
      setUpdateError(validationError);
      return;
    }

    const definedSegments = experience?.segments || [];
    const visible_to_segment_ids = visibleSegments
      .map((name) => definedSegments.find((s) => s.name === name)?.id)
      .filter((id): id is string => id !== undefined);

    const isOpen = block.status === 'open';
    const submissionCount = block.responses?.total ?? 0;
    const submissionWarnKinds: BlockKind[] = [
      BlockKind.QUESTION,
      BlockKind.PHOTO_UPLOAD,
      BlockKind.ANNOUNCEMENT,
      BlockKind.POLL,
    ];
    const hasSubmissions = submissionCount > 0 && submissionWarnKinds.includes(blockData.kind);

    if (isOpen || hasSubmissions) {
      const parts: string[] = [];
      if (isOpen)
        parts.push('This block is currently active — participants may be interacting with it.');
      if (hasSubmissions)
        parts.push(
          `${submissionCount} ${submissionCount === 1 ? 'response has' : 'responses have'} already been submitted.`,
        );
      pendingVisibleSegmentIds.current = visible_to_segment_ids;
      setPendingWarning(parts.join(' '));
      return;
    }

    await performUpdate(visible_to_segment_ids);
  }, [
    blockData,
    visibleSegments,
    experience,
    block.status,
    block.responses,
    performUpdate,
    setUpdateError,
  ]);

  const confirmWarning = useCallback(async () => {
    setPendingWarning(null);
    await performUpdate(pendingVisibleSegmentIds.current);
  }, [performUpdate]);

  const cancelWarning = useCallback(() => {
    setPendingWarning(null);
    pendingVisibleSegmentIds.current = [];
  }, []);

  const contextValue = useMemo<EditBlockContextValue>(
    () => ({
      blockData,
      setBlockData,
      participants,
      submit,
      isSubmitting,
      error: updateError,
      visibleSegments,
      setVisibleSegments,
      showOnMonitor,
      setShowOnMonitor,
      viewAdditionalDetails,
      setViewAdditionalDetails,
      pendingWarning,
      confirmWarning,
      cancelWarning,
    }),
    [
      blockData,
      participants,
      submit,
      isSubmitting,
      updateError,
      visibleSegments,
      showOnMonitor,
      viewAdditionalDetails,
      pendingWarning,
      confirmWarning,
      cancelWarning,
    ],
  );

  return <EditBlockContext.Provider value={contextValue}>{children}</EditBlockContext.Provider>;
}
