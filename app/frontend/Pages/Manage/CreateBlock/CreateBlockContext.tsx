import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useCreateExperienceBlock } from '@cctv/hooks/useCreateExperienceBlock';
import {
  ApiPayload,
  BlockKind,
  BlockStatus,
  CreateBlockContextValue,
  FormBlockData,
  ParticipantSummary,
} from '@cctv/types';

import {
  buildAnnouncementPayload,
  canAnnouncementOpenImmediately,
  getDefaultAnnouncementState,
  processAnnouncementBeforeSubmit,
  validateAnnouncement,
} from './CreateAnnouncement/CreateAnnouncement';
import {
  buildBuzzerPayload,
  canBuzzerOpenImmediately,
  getDefaultBuzzerState,
  processBuzzerBeforeSubmit,
  validateBuzzer,
} from './CreateBuzzer/CreateBuzzer';
import {
  buildCollaborativeDrawingPayload,
  canCollaborativeDrawingOpenImmediately,
  getDefaultCollaborativeDrawingState,
  processCollaborativeDrawingBeforeSubmit,
  validateCollaborativeDrawing,
} from './CreateCollaborativeDrawing/CreateCollaborativeDrawing';
import {
  buildFamilyFeudPayload,
  buildFamilyFeudQuestions,
  canFamilyFeudOpenImmediately,
  getDefaultFamilyFeudState,
  processFamilyFeudBeforeSubmit,
  validateFamilyFeud,
} from './CreateFamilyFeud/CreateFamilyFeud';
import {
  buildGuessWhoPayload,
  canGuessWhoOpenImmediately,
  getDefaultGuessWhoState,
  processGuessWhoBeforeSubmit,
  validateGuessWho,
} from './CreateGuessWho/CreateGuessWho';
import {
  buildMinigameArithmeticPayload,
  canMinigameArithmeticOpenImmediately,
  getDefaultMinigameArithmeticState,
  processMinigameArithmeticBeforeSubmit,
  validateMinigameArithmetic,
} from './CreateMinigameArithmetic/CreateMinigameArithmetic';
import {
  buildMinigameBalloonPumpPayload,
  canMinigameBalloonPumpOpenImmediately,
  getDefaultMinigameBalloonPumpState,
  processMinigameBalloonPumpBeforeSubmit,
  validateMinigameBalloonPump,
} from './CreateMinigameBalloonPump/CreateMinigameBalloonPump';
import {
  buildPhotoUploadPayload,
  canPhotoUploadOpenImmediately,
  getDefaultPhotoUploadState,
  processPhotoUploadBeforeSubmit,
  validatePhotoUpload,
} from './CreatePhotoUpload/CreatePhotoUpload';
import {
  buildPollPayload,
  canPollOpenImmediately,
  getDefaultPollState,
  processPollBeforeSubmit,
  validatePoll,
} from './CreatePoll/CreatePoll';
import {
  buildQuestionPayload,
  canQuestionOpenImmediately,
  getDefaultQuestionState,
  processQuestionBeforeSubmit,
  validateQuestion,
} from './CreateQuestion/CreateQuestion';
import {
  buildTheScenePayload,
  canTheSceneOpenImmediately,
  getDefaultTheSceneState,
  processTheSceneBeforeSubmit,
  validateTheScene,
} from './CreateTheScene/CreateTheScene';

const CreateBlockContext = createContext<CreateBlockContextValue | null>(null);

const unknownBlockKindMessage = (formData: FormBlockData) => `Unknown block kind: ${formData.kind}`;

export function useCreateBlockContext() {
  const context = useContext(CreateBlockContext);
  if (!context) {
    throw new Error('useCreateBlockContext must be used within a CreateBlockProvider');
  }
  return context;
}

interface CreateBlockProviderProps {
  children: ReactNode;
  participants: ParticipantSummary[];
  onClose: () => void;
  onEndCurrentBlock: () => Promise<void>;
  initialKind?: BlockKind;
}

// NOTE: There are N number of branches for each block type. This is a good
// candidate for a factory style pattern, but for now it is all centralized here
// so we can keep adding to it without the conditional expansion leaking
export function CreateBlockProvider({
  children,
  participants,
  onClose,
  onEndCurrentBlock,
  initialKind = BlockKind.POLL,
}: CreateBlockProviderProps) {
  const getDefaultFormData = useCallback((blockKind: BlockKind): FormBlockData => {
    switch (blockKind) {
      case BlockKind.POLL:
        return { kind: BlockKind.POLL, data: getDefaultPollState() };
      case BlockKind.QUESTION:
        return { kind: BlockKind.QUESTION, data: getDefaultQuestionState() };
      case BlockKind.ANNOUNCEMENT:
        return { kind: BlockKind.ANNOUNCEMENT, data: getDefaultAnnouncementState() };
      case BlockKind.FAMILY_FEUD:
        return { kind: BlockKind.FAMILY_FEUD, data: getDefaultFamilyFeudState() };
      case BlockKind.PHOTO_UPLOAD:
        return { kind: BlockKind.PHOTO_UPLOAD, data: getDefaultPhotoUploadState() };
      case BlockKind.BUZZER:
        return { kind: BlockKind.BUZZER, data: getDefaultBuzzerState() };
      case BlockKind.GUESS_WHO:
        return { kind: BlockKind.GUESS_WHO, data: getDefaultGuessWhoState() };
      case BlockKind.MINIGAME_ARITHMETIC:
        return { kind: BlockKind.MINIGAME_ARITHMETIC, data: getDefaultMinigameArithmeticState() };
      case BlockKind.MINIGAME_BALLOON_PUMP:
        return {
          kind: BlockKind.MINIGAME_BALLOON_PUMP,
          data: getDefaultMinigameBalloonPumpState(),
        };
      case BlockKind.COLLABORATIVE_DRAWING:
        return {
          kind: BlockKind.COLLABORATIVE_DRAWING,
          data: getDefaultCollaborativeDrawingState(),
        };
      case BlockKind.THE_SCENE:
        return { kind: BlockKind.THE_SCENE, data: getDefaultTheSceneState() };
      default: {
        const exhaustiveCheck: never = blockKind;
        throw new Error(`Unknown block kind: ${exhaustiveCheck}`);
      }
    }
  }, []);

  const [blockData, setBlockData] = useState<FormBlockData>(() => getDefaultFormData(initialKind));

  const { experience } = useExperience();

  const [visibleSegments, setVisibleSegments] = useState<string[]>([]);
  const [viewAdditionalDetails, setViewAdditionalDetails] = useState<boolean>(false);
  const [addToPlaybill, setAddToPlaybill] = useState<boolean>(true);
  const [playbillMysterious, setPlaybillMysterious] = useState<boolean>(false);

  const {
    createExperienceBlock,
    isLoading: isSubmitting,
    error: createError,
    setError: setCreateError,
  } = useCreateExperienceBlock();

  const setKind = useCallback(
    (newKind: BlockKind) => {
      setBlockData(getDefaultFormData(newKind));
    },
    [getDefaultFormData],
  );

  const submit = useCallback(
    async (status: BlockStatus) => {
      setCreateError(null);

      let validationError: string | null = null;

      switch (blockData.kind) {
        case BlockKind.POLL:
          validationError = validatePoll(blockData.data);
          break;
        case BlockKind.QUESTION:
          validationError = validateQuestion(blockData.data);
          break;
        case BlockKind.ANNOUNCEMENT:
          validationError = validateAnnouncement(blockData.data);
          break;
        case BlockKind.FAMILY_FEUD:
          validationError = validateFamilyFeud(blockData.data);
          break;
        case BlockKind.PHOTO_UPLOAD:
          validationError = validatePhotoUpload(blockData.data);
          break;
        case BlockKind.BUZZER:
          validationError = validateBuzzer(blockData.data);
          break;
        case BlockKind.GUESS_WHO:
          validationError = validateGuessWho(blockData.data);
          break;
        case BlockKind.MINIGAME_ARITHMETIC:
          validationError = validateMinigameArithmetic(blockData.data);
          break;
        case BlockKind.MINIGAME_BALLOON_PUMP:
          validationError = validateMinigameBalloonPump(blockData.data);
          break;
        case BlockKind.COLLABORATIVE_DRAWING:
          validationError = validateCollaborativeDrawing(blockData.data);
          break;
        case BlockKind.THE_SCENE:
          validationError = validateTheScene(blockData.data);
          break;
        default: {
          const exhaustiveCheck: never = blockData;
          validationError = unknownBlockKindMessage(exhaustiveCheck);
        }
      }

      if (validationError) {
        setCreateError(validationError);
        return;
      }

      let canOpenImmediately = true;
      switch (blockData.kind) {
        case BlockKind.POLL:
          canOpenImmediately = canPollOpenImmediately(blockData.data, participants);
          break;
        case BlockKind.QUESTION:
          canOpenImmediately = canQuestionOpenImmediately(blockData.data, participants);
          break;
        case BlockKind.ANNOUNCEMENT:
          canOpenImmediately = canAnnouncementOpenImmediately(blockData.data, participants);
          break;
        case BlockKind.FAMILY_FEUD:
          canOpenImmediately = canFamilyFeudOpenImmediately();
          break;
        case BlockKind.PHOTO_UPLOAD:
          canOpenImmediately = canPhotoUploadOpenImmediately(blockData.data, participants);
          break;
        case BlockKind.BUZZER:
          canOpenImmediately = canBuzzerOpenImmediately(blockData.data, participants);
          break;
        case BlockKind.GUESS_WHO:
          canOpenImmediately = canGuessWhoOpenImmediately(blockData.data, participants);
          break;
        case BlockKind.MINIGAME_ARITHMETIC:
          canOpenImmediately = canMinigameArithmeticOpenImmediately(blockData.data, participants);
          break;
        case BlockKind.MINIGAME_BALLOON_PUMP:
          canOpenImmediately = canMinigameBalloonPumpOpenImmediately(blockData.data, participants);
          break;
        case BlockKind.COLLABORATIVE_DRAWING:
          canOpenImmediately = canCollaborativeDrawingOpenImmediately(blockData.data, participants);
          break;
        case BlockKind.THE_SCENE:
          canOpenImmediately = canTheSceneOpenImmediately(blockData.data, participants);
          break;
        default: {
          const exhaustiveCheck: never = blockData;
          canOpenImmediately = false;
          console.error(unknownBlockKindMessage(exhaustiveCheck));
        }
      }

      if (status === 'open' && !canOpenImmediately) {
        setCreateError('Cannot open this block immediately');
        return;
      }

      // Process data before submit
      // For example, if a block needs to randomize assignments, this step can
      // be used. We may be able to push this all server side with an actual
      // implementation in the future
      let processedFormData: FormBlockData;
      switch (blockData.kind) {
        case BlockKind.POLL:
          processedFormData = {
            kind: BlockKind.POLL,
            data: processPollBeforeSubmit(blockData.data, status, participants),
          };
          break;
        case BlockKind.QUESTION:
          processedFormData = {
            kind: BlockKind.QUESTION,
            data: processQuestionBeforeSubmit(blockData.data, status, participants),
          };
          break;
        case BlockKind.ANNOUNCEMENT:
          processedFormData = {
            kind: BlockKind.ANNOUNCEMENT,
            data: processAnnouncementBeforeSubmit(blockData.data, status, participants),
          };
          break;
        case BlockKind.FAMILY_FEUD:
          processedFormData = {
            kind: BlockKind.FAMILY_FEUD,
            data: processFamilyFeudBeforeSubmit(blockData.data),
          };
          break;
        case BlockKind.PHOTO_UPLOAD:
          processedFormData = {
            kind: BlockKind.PHOTO_UPLOAD,
            data: processPhotoUploadBeforeSubmit(blockData.data, status, participants),
          };
          break;
        case BlockKind.BUZZER:
          processedFormData = {
            kind: BlockKind.BUZZER,
            data: processBuzzerBeforeSubmit(blockData.data, status, participants),
          };
          break;
        case BlockKind.GUESS_WHO:
          processedFormData = {
            kind: BlockKind.GUESS_WHO,
            data: processGuessWhoBeforeSubmit(blockData.data, status, participants),
          };
          break;
        case BlockKind.MINIGAME_ARITHMETIC:
          processedFormData = {
            kind: BlockKind.MINIGAME_ARITHMETIC,
            data: processMinigameArithmeticBeforeSubmit(blockData.data, status, participants),
          };
          break;
        case BlockKind.MINIGAME_BALLOON_PUMP:
          processedFormData = {
            kind: BlockKind.MINIGAME_BALLOON_PUMP,
            data: processMinigameBalloonPumpBeforeSubmit(blockData.data, status, participants),
          };
          break;
        case BlockKind.COLLABORATIVE_DRAWING:
          processedFormData = {
            kind: BlockKind.COLLABORATIVE_DRAWING,
            data: processCollaborativeDrawingBeforeSubmit(blockData.data, status, participants),
          };
          break;
        case BlockKind.THE_SCENE:
          processedFormData = {
            kind: BlockKind.THE_SCENE,
            data: processTheSceneBeforeSubmit(blockData.data, status, participants),
          };
          break;
        default: {
          const exhaustiveCheck: never = blockData;
          processedFormData = exhaustiveCheck;
          console.error(unknownBlockKindMessage(exhaustiveCheck));
        }
      }

      let payload: ApiPayload;
      switch (processedFormData.kind) {
        case BlockKind.POLL:
          payload = buildPollPayload(processedFormData.data);
          break;
        case BlockKind.QUESTION:
          payload = buildQuestionPayload(processedFormData.data);
          break;
        case BlockKind.ANNOUNCEMENT:
          payload = buildAnnouncementPayload(processedFormData.data);
          break;
        case BlockKind.FAMILY_FEUD:
          payload = buildFamilyFeudPayload(processedFormData.data);
          break;
        case BlockKind.PHOTO_UPLOAD:
          payload = buildPhotoUploadPayload(processedFormData.data);
          break;
        case BlockKind.BUZZER:
          payload = buildBuzzerPayload(processedFormData.data);
          break;
        case BlockKind.GUESS_WHO:
          payload = buildGuessWhoPayload(processedFormData.data);
          break;
        case BlockKind.MINIGAME_ARITHMETIC:
          payload = buildMinigameArithmeticPayload(processedFormData.data);
          break;
        case BlockKind.MINIGAME_BALLOON_PUMP:
          payload = buildMinigameBalloonPumpPayload(processedFormData.data);
          break;
        case BlockKind.COLLABORATIVE_DRAWING:
          payload = buildCollaborativeDrawingPayload(processedFormData.data);
          break;
        case BlockKind.THE_SCENE:
          payload = buildTheScenePayload(processedFormData.data);
          break;
        default: {
          const exhaustiveCheck: never = processedFormData;
          throw new Error(unknownBlockKindMessage(exhaustiveCheck));
        }
      }

      const definedSegments = experience?.segments || [];
      const visible_to_segment_ids = visibleSegments
        .map((name) => definedSegments.find((s) => s.name === name)?.id)
        .filter((id): id is string => id !== undefined);

      const questions =
        processedFormData.kind === BlockKind.FAMILY_FEUD
          ? buildFamilyFeudQuestions(processedFormData.data)
          : undefined;

      await createExperienceBlock({
        kind: blockData.kind,
        payload,
        visible_to_segment_ids,
        status,
        open_immediately: status === 'open',
        add_to_playbill: addToPlaybill,
        playbill_mysterious: addToPlaybill && playbillMysterious,
        questions,
      });

      onClose();

      if (status === 'open') {
        await onEndCurrentBlock();
      }

      // Reset all form state
      setBlockData(getDefaultFormData(blockData.kind));
      setViewAdditionalDetails(false);
      setAddToPlaybill(true);
      setPlaybillMysterious(false);
    },
    [
      blockData,
      participants,
      visibleSegments,
      createExperienceBlock,
      onClose,
      onEndCurrentBlock,
      setCreateError,
      getDefaultFormData,
      experience,
      addToPlaybill,
      playbillMysterious,
    ],
  );

  const toggleAddToPlaybill = useCallback((value: boolean) => {
    setAddToPlaybill(value);
    if (!value) {
      setPlaybillMysterious(false);
    }
  }, []);

  const contextValue = useMemo<CreateBlockContextValue>(
    () => ({
      blockData,
      setBlockData,
      setKind,
      participants,
      submit,
      isSubmitting,
      error: createError,
      visibleSegments,
      setVisibleSegments,
      viewAdditionalDetails,
      setViewAdditionalDetails,
      addToPlaybill,
      setAddToPlaybill: toggleAddToPlaybill,
      playbillMysterious,
      setPlaybillMysterious,
    }),
    [
      blockData,
      setKind,
      participants,
      submit,
      isSubmitting,
      createError,
      visibleSegments,
      viewAdditionalDetails,
      addToPlaybill,
      toggleAddToPlaybill,
      playbillMysterious,
    ],
  );

  return <CreateBlockContext.Provider value={contextValue}>{children}</CreateBlockContext.Provider>;
}
