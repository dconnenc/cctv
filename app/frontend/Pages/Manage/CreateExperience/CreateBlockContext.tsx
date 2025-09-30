import { ReactNode, createContext, useCallback, useContext, useState } from 'react';

import { useCreateExperienceBlock } from '@cctv/hooks';
import { Block, BlockStatus, ParticipantSummary } from '@cctv/types';
import { BlockData, CreateBlockContextValue } from '@cctv/types';

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
// so we can keep adding too it without the conditional expansion leaking
export function CreateBlockProvider({
  children,
  participants,
  onClose,
  onEndCurrentBlock,
  refetchExperience,
}: CreateBlockProviderProps) {
  const [kind, setKind] = useState<Block['kind']>('poll');

  const getDefaultState = useCallback((blockKind: Block['kind']): BlockData => {
    switch (blockKind) {
      case 'poll':
        return getDefaultPollState();
      case 'question':
        return getDefaultQuestionState();
      case 'multistep_form':
        return getDefaultMultistepFormState();
      case 'announcement':
        return getDefaultAnnouncementState();
      case 'mad_lib':
        return getDefaultMadLibState();
      default:
        throw new Error(`Unknown block kind: ${blockKind}`);
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
        case 'poll':
          validationError = validatePoll(data as any);
          break;
        case 'question':
          validationError = validateQuestion(data as any);
          break;
        case 'multistep_form':
          validationError = validateMultistepForm(data as any);
          break;
        case 'announcement':
          validationError = validateAnnouncement(data as any);
          break;
        case 'mad_lib':
          validationError = validateMadLib(data as any);
          break;
        default:
          validationError = `Unknown block kind: ${kind}`;
      }

      if (validationError) {
        setCreateError(validationError);
        return;
      }

      let canOpenImmediately = true;
      switch (kind) {
        case 'poll':
          canOpenImmediately = canPollOpenImmediately(data as any, participants);
          break;
        case 'question':
          canOpenImmediately = canQuestionOpenImmediately(data as any, participants);
          break;
        case 'multistep_form':
          canOpenImmediately = canMultistepFormOpenImmediately(data as any, participants);
          break;
        case 'announcement':
          canOpenImmediately = canAnnouncementOpenImmediately(data as any, participants);
          break;
        case 'mad_lib':
          canOpenImmediately = canMadLibOpenImmediately(data as any, participants);
          break;
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
        case 'poll':
          processedData = processPollBeforeSubmit(data as any, status, participants);
          break;
        case 'question':
          processedData = processQuestionBeforeSubmit(data as any, status, participants);
          break;
        case 'multistep_form':
          processedData = processMultistepFormBeforeSubmit(data as any, status, participants);
          break;
        case 'announcement':
          processedData = processAnnouncementBeforeSubmit(data as any, status, participants);
          break;
        case 'mad_lib':
          processedData = processMadLibBeforeSubmit(data as any, status, participants);
          break;
        default:
          processedData = data;
      }

      let payload: Record<string, any>;
      switch (kind) {
        case 'poll':
          payload = buildPollPayload(processedData as any);
          break;
        case 'question':
          payload = buildQuestionPayload(processedData as any);
          break;
        case 'multistep_form':
          payload = buildMultistepFormPayload(processedData as any);
          break;
        case 'announcement':
          payload = buildAnnouncementPayload(processedData as any);
          break;
        case 'mad_lib':
          payload = buildMadLibPayload(processedData as any);
          break;
        default:
          throw new Error(`Unknown block kind: ${kind}`);
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
