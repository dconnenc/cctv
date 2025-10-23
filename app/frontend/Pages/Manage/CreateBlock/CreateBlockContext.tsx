import { ReactNode, createContext, useCallback, useContext, useState } from 'react';

import { useCreateExperienceBlock } from '@cctv/hooks';
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
import { getDefaultMadLibState, validateMadLib } from './CreateMadLib/CreateMadLib';
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
}

// NOTE: There are N number of branches for each block type. This is a good
// candidate for a factory style pattern, but for now it is all centralized here
// so we can keep adding to it without the conditional expansion leaking
export function CreateBlockProvider({
  children,
  participants,
  onClose,
  onEndCurrentBlock,
}: CreateBlockProviderProps) {
  const getDefaultFormData = useCallback((blockKind: BlockKind): FormBlockData => {
    switch (blockKind) {
      case BlockKind.POLL:
        return { kind: BlockKind.POLL, data: getDefaultPollState() };
      case BlockKind.QUESTION:
        return { kind: BlockKind.QUESTION, data: getDefaultQuestionState() };
      case BlockKind.MULTISTEP_FORM:
        return { kind: BlockKind.MULTISTEP_FORM, data: getDefaultMultistepFormState() };
      case BlockKind.ANNOUNCEMENT:
        return { kind: BlockKind.ANNOUNCEMENT, data: getDefaultAnnouncementState() };
      case BlockKind.MAD_LIB:
        return { kind: BlockKind.MAD_LIB, data: getDefaultMadLibState() };
      default:
        const exhaustiveCheck: never = blockKind;
        throw new Error(`Unknown block kind: ${exhaustiveCheck}`);
    }
  }, []);

  const [blockData, setBlockData] = useState<FormBlockData>(() =>
    getDefaultFormData(BlockKind.POLL),
  );

  const [visibleRoles, setVisibleRoles] = useState<string[]>([]);
  const [visibleSegmentsText, setVisibleSegmentsText] = useState<string>('');
  const [targetUserIdsText, setTargetUserIdsText] = useState<string>('');
  const [viewAdditionalDetails, setViewAdditionalDetails] = useState<boolean>(false);

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
        case BlockKind.MULTISTEP_FORM:
          validationError = validateMultistepForm(blockData.data);
          break;
        case BlockKind.ANNOUNCEMENT:
          validationError = validateAnnouncement(blockData.data);
          break;
        case BlockKind.MAD_LIB:
          validationError = validateMadLib(blockData.data);
          break;
        default:
          // This should never be reached due to exhaustive checking
          validationError = `Unknown block kind: ${(blockData as any).kind}`;
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
        case BlockKind.MULTISTEP_FORM:
          canOpenImmediately = canMultistepFormOpenImmediately(blockData.data, participants);
          break;
        case BlockKind.ANNOUNCEMENT:
          canOpenImmediately = canAnnouncementOpenImmediately(blockData.data, participants);
          break;
        case BlockKind.MAD_LIB:
          canOpenImmediately = true;
          break;
        default:
          // This should never be reached due to exhaustive checking
          canOpenImmediately = false;
          console.error(`Unknown block kind: ${(blockData as any).kind}`);
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
        case BlockKind.MULTISTEP_FORM:
          processedFormData = {
            kind: BlockKind.MULTISTEP_FORM,
            data: processMultistepFormBeforeSubmit(blockData.data, status, participants),
          };
          break;
        case BlockKind.ANNOUNCEMENT:
          processedFormData = {
            kind: BlockKind.ANNOUNCEMENT,
            data: processAnnouncementBeforeSubmit(blockData.data, status, participants),
          };
          break;
        case BlockKind.MAD_LIB:
          processedFormData = {
            kind: BlockKind.MAD_LIB,
            data: blockData.data,
          };
          break;
        default:
          // This should never be reached due to exhaustive checking
          processedFormData = blockData as any;
          console.error(`Unknown block kind: ${(blockData as any).kind}`);
      }

      let payload: ApiPayload;
      switch (processedFormData.kind) {
        case BlockKind.POLL:
          payload = buildPollPayload(processedFormData.data);
          break;
        case BlockKind.QUESTION:
          payload = buildQuestionPayload(processedFormData.data);
          break;
        case BlockKind.MULTISTEP_FORM:
          payload = buildMultistepFormPayload(processedFormData.data);
          break;
        case BlockKind.ANNOUNCEMENT:
          payload = buildAnnouncementPayload(processedFormData.data);
          break;
        case BlockKind.MAD_LIB:
          payload = {
            type: BlockKind.MAD_LIB,
            parts: processedFormData.data.parts,
          };
          break;
        default:
          // This should never be reached due to exhaustive checking
          throw new Error(`Unknown block kind: ${(processedFormData as any).kind}`);
      }

      const visible_to_segments = visibleSegmentsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const target_user_ids = targetUserIdsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      let submitPayload: any = {
        kind: blockData.kind,
        payload,
        visible_to_roles: visibleRoles,
        visible_to_segments,
        target_user_ids,
        status: status,
        open_immediately: status === 'open',
      };

      if (blockData.kind === BlockKind.MAD_LIB) {
        const internalData = processedFormData.data as any;
        const variables = (internalData.variables || []).map((v: any) => ({
          key: v.id,
          label: v.name,
          datatype: v.dataType === 'number' ? 'number' : 'string',
          required: true,
          source: v.assigned_user_id
            ? {
                type: 'participant',
                participant_id: v.assigned_user_id,
              }
            : {
                kind: 'question',
                question: v.question,
                input_type: 'text',
              },
        }));

        submitPayload.variables = variables;
      }

      await createExperienceBlock(submitPayload);

      onClose();

      if (status === 'open') {
        await onEndCurrentBlock();
      }

      // Reset all form state
      setBlockData(getDefaultFormData(blockData.kind));
      setVisibleRoles([]);
      setVisibleSegmentsText('');
      setTargetUserIdsText('');
      setViewAdditionalDetails(false);
    },
    [
      blockData,
      participants,
      visibleRoles,
      visibleSegmentsText,
      targetUserIdsText,
      createExperienceBlock,
      onClose,
      onEndCurrentBlock,
      setCreateError,
      getDefaultFormData,
    ],
  );

  const contextValue: CreateBlockContextValue = {
    blockData,
    setBlockData,
    setKind,
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
