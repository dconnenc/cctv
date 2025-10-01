import { ReactNode, createContext, useCallback, useContext, useState } from 'react';

import { useCreateExperienceBlock } from '@cctv/hooks';
import { Block, BlockKind, BlockStatus, ParticipantSummary } from '@cctv/types';
import {
  AnnouncementData,
  BlockData,
  CreateBlockContextValue,
  MadLibData,
  MultistepFormData,
  PollData,
  QuestionData,
} from '@cctv/types';

import {
  buildAnnouncementPayload,
  canAnnouncementOpenImmediately,
  getDefaultAnnouncementState,
  processAnnouncementBeforeSubmit,
  validateAnnouncement,
} from './CreateAnnouncement/CreateAnnouncement';
import {
  buildMadLibPayload,
  canMadLibOpenImmediately,
  getDefaultMadLibState,
  processMadLibBeforeSubmit,
  validateMadLib,
} from './CreateMadLib/CreateMadLib';
import {
  buildMultistepFormPayload,
  canMultistepFormOpenImmediately,
  getDefaultMultistepFormState,
  processMultistepFormBeforeSubmit,
  validateMultistepForm,
} from './CreateMultistepForm/CreateMultistepForm';
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

const CreateBlockContext = createContext<CreateBlockContextValue | null>(null);

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
  refetchExperience: () => Promise<void>;
}

// NOTE: There are N number of branches for each block type. This is a good
// candidate for a factory style pattern, but for now it is all centralized here
// so we can keep adding to it without the conditional expansion leaking
export function CreateBlockProvider({
  children,
  participants,
  onClose,
  onEndCurrentBlock,
  refetchExperience,
}: CreateBlockProviderProps) {
  const [kind, setKind] = useState<Block['kind']>(BlockKind.POLL);

  const getDefaultState = useCallback((blockKind: Block['kind']): BlockData => {
    switch (blockKind) {
      case BlockKind.POLL:
        return getDefaultPollState();
      case BlockKind.QUESTION:
        return getDefaultQuestionState();
      case BlockKind.MULTISTEP_FORM:
        return getDefaultMultistepFormState();
      case BlockKind.ANNOUNCEMENT:
        return getDefaultAnnouncementState();
      case BlockKind.MAD_LIB:
        return getDefaultMadLibState();
      default:
        const exhaustiveCheck: never = blockKind;
        throw new Error(`Unknown block kind: ${exhaustiveCheck}`);
    }
  }, []);

  const [data, setData] = useState<BlockData>(() => getDefaultState(kind));

  const [visibleRoles, setVisibleRoles] = useState<string[]>([]);
  const [visibleSegmentsText, setVisibleSegmentsText] = useState<string>('');
  const [targetUserIdsText, setTargetUserIdsText] = useState<string>('');
  const [viewAdditionalDetails, setViewAdditionalDetails] = useState<boolean>(false);

  const {
    createExperienceBlock,
    isLoading: isSubmitting,
    error: createError,
    setError: setCreateError,
  } = useCreateExperienceBlock({ refetchExperience });

  const handleKindChange = useCallback(
    (newKind: Block['kind']) => {
      setKind(newKind);
      setData(getDefaultState(newKind));
    },
    [getDefaultState],
  );

  const submit = useCallback(
    async (status: BlockStatus) => {
      setCreateError(null);

      let validationError: string | null = null;

      switch (kind) {
        case BlockKind.POLL:
          validationError = validatePoll(data as PollData);
          break;
        case BlockKind.QUESTION:
          validationError = validateQuestion(data as QuestionData);
          break;
        case BlockKind.MULTISTEP_FORM:
          validationError = validateMultistepForm(data as MultistepFormData);
          break;
        case BlockKind.ANNOUNCEMENT:
          validationError = validateAnnouncement(data as AnnouncementData);
          break;
        case BlockKind.MAD_LIB:
          validationError = validateMadLib(data as MadLibData);
          break;
        default:
          const exhaustiveCheck: never = kind;
          validationError = `Unknown block kind: ${exhaustiveCheck}`;
      }

      if (validationError) {
        setCreateError(validationError);
        return;
      }

      let canOpenImmediately = true;
      switch (kind) {
        case BlockKind.POLL:
          canOpenImmediately = canPollOpenImmediately(data as PollData, participants);
          break;
        case BlockKind.QUESTION:
          canOpenImmediately = canQuestionOpenImmediately(data as QuestionData, participants);
          break;
        case BlockKind.MULTISTEP_FORM:
          canOpenImmediately = canMultistepFormOpenImmediately(
            data as MultistepFormData,
            participants,
          );
          break;
        case BlockKind.ANNOUNCEMENT:
          canOpenImmediately = canAnnouncementOpenImmediately(
            data as AnnouncementData,
            participants,
          );
          break;
        case BlockKind.MAD_LIB:
          canOpenImmediately = canMadLibOpenImmediately(data as MadLibData, participants);
          break;
        default:
          const exhaustiveCheck: never = kind;
          canOpenImmediately = false;
          console.error(`Unknown block kind: ${exhaustiveCheck}`);
      }

      if (status === 'open' && !canOpenImmediately) {
        setCreateError('Cannot open this block immediately');
        return;
      }

      // Process data before submit
      // For example, if a block needs to randomize assignments, this step can
      // be used. We may be able to push this all server side with an actual
      // implementation in the future
      let processedData: BlockData;
      switch (kind) {
        case BlockKind.POLL:
          processedData = processPollBeforeSubmit(data as PollData, status, participants);
          break;
        case BlockKind.QUESTION:
          processedData = processQuestionBeforeSubmit(data as QuestionData, status, participants);
          break;
        case BlockKind.MULTISTEP_FORM:
          processedData = processMultistepFormBeforeSubmit(
            data as MultistepFormData,
            status,
            participants,
          );
          break;
        case BlockKind.ANNOUNCEMENT:
          processedData = processAnnouncementBeforeSubmit(
            data as AnnouncementData,
            status,
            participants,
          );
          break;
        case BlockKind.MAD_LIB:
          processedData = processMadLibBeforeSubmit(data as MadLibData, status, participants);
          break;
        default:
          const exhaustiveCheck: never = kind;
          processedData = data;
          console.error(`Unknown block kind: ${exhaustiveCheck}`);
      }

      let payload: Record<string, any>;
      switch (kind) {
        case BlockKind.POLL:
          payload = buildPollPayload(processedData as PollData);
          break;
        case BlockKind.QUESTION:
          payload = buildQuestionPayload(processedData as QuestionData);
          break;
        case BlockKind.MULTISTEP_FORM:
          payload = buildMultistepFormPayload(processedData as MultistepFormData);
          break;
        case BlockKind.ANNOUNCEMENT:
          payload = buildAnnouncementPayload(processedData as AnnouncementData);
          break;
        case BlockKind.MAD_LIB:
          payload = buildMadLibPayload(processedData as MadLibData);
          break;
        default:
          const exhaustiveCheck: never = kind;
          throw new Error(`Unknown block kind: ${exhaustiveCheck}`);
      }

      const visible_to_segments = visibleSegmentsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const target_user_ids = targetUserIdsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const submitPayload = {
        kind,
        payload,
        visible_to_roles: visibleRoles,
        visible_to_segments,
        target_user_ids,
        status: status,
        open_immediately: status === 'open',
      };

      await createExperienceBlock(submitPayload);

      onClose();

      if (status === 'open') {
        await onEndCurrentBlock();
      }

      // Reset all form state
      setData(getDefaultState(kind));
      setVisibleRoles([]);
      setVisibleSegmentsText('');
      setTargetUserIdsText('');
      setViewAdditionalDetails(false);
    },
    [
      data,
      participants,
      kind,
      visibleRoles,
      visibleSegmentsText,
      targetUserIdsText,
      createExperienceBlock,
      onClose,
      onEndCurrentBlock,
      setCreateError,
    ],
  );

  const contextValue: CreateBlockContextValue = {
    kind,
    setKind: handleKindChange,
    data,
    setData,
    participants,
    submit,
    isSubmitting,
    error: createError,
    visibleRoles,
    setVisibleRoles,
    visibleSegmentsText,
    setVisibleSegmentsText,
    targetUserIdsText,
    setTargetUserIdsText,
    viewAdditionalDetails,
    setViewAdditionalDetails,
  };

  return <CreateBlockContext.Provider value={contextValue}>{children}</CreateBlockContext.Provider>;
}
