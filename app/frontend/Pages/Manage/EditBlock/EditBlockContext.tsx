import { ReactNode, createContext, useCallback, useContext, useRef, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useUpdateExperienceBlock } from '@cctv/hooks/useUpdateExperienceBlock';
import {
  ApiPayload,
  Block,
  BlockKind,
  EditBlockContextValue,
  FamilyFeudPayload,
  FormBlockData,
  MadLibBlock,
  MadLibPayload,
  MultistepFormPayload,
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
  buildFamilyFeudPayload,
  familyFeudPayloadToFormData,
  validateFamilyFeud,
} from '../CreateBlock/CreateFamilyFeud/CreateFamilyFeud';
import { madLibPayloadToFormData, validateMadLib } from '../CreateBlock/CreateMadLib/CreateMadLib';
import {
  buildMultistepFormPayload,
  multistepFormPayloadToFormData,
  validateMultistepForm,
} from '../CreateBlock/CreateMultistepForm/CreateMultistepForm';
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

function blockToFormData(block: Block, participants: ParticipantSummary[]): FormBlockData {
  switch (block.kind) {
    case BlockKind.POLL:
      return { kind: BlockKind.POLL, data: pollPayloadToFormData(block.payload) };
    case BlockKind.QUESTION:
      return { kind: BlockKind.QUESTION, data: questionPayloadToFormData(block.payload) };
    case BlockKind.MULTISTEP_FORM:
      return {
        kind: BlockKind.MULTISTEP_FORM,
        data: multistepFormPayloadToFormData(block.payload as MultistepFormPayload),
      };
    case BlockKind.ANNOUNCEMENT:
      return { kind: BlockKind.ANNOUNCEMENT, data: announcementPayloadToFormData(block.payload) };
    case BlockKind.MAD_LIB: {
      const madLibBlock = block as MadLibBlock;
      return {
        kind: BlockKind.MAD_LIB,
        data: madLibPayloadToFormData(
          block.payload as MadLibPayload,
          madLibBlock.variables,
          block.children,
          participants,
        ),
      };
    }
    case BlockKind.FAMILY_FEUD:
      return {
        kind: BlockKind.FAMILY_FEUD,
        data: familyFeudPayloadToFormData(block.payload as FamilyFeudPayload, block.children),
      };
    case BlockKind.PHOTO_UPLOAD:
      return { kind: BlockKind.PHOTO_UPLOAD, data: photoUploadPayloadToFormData(block.payload) };
    case BlockKind.BUZZER:
      return { kind: BlockKind.BUZZER, data: buzzerPayloadToFormData(block.payload) };
    default: {
      const _exhaust: never = block;
      throw new Error(`Unknown block kind: ${(_exhaust as Block).kind}`);
    }
  }
}

function buildUpdatePayload(blockData: FormBlockData): {
  payload: ApiPayload;
  variables?: Array<{ key: string; label: string; datatype: string; required: boolean }>;
  questions?: Array<{ id: string; question: string }>;
} {
  switch (blockData.kind) {
    case BlockKind.POLL:
      return { payload: buildPollPayload(blockData.data) };
    case BlockKind.QUESTION:
      return { payload: buildQuestionPayload(blockData.data) };
    case BlockKind.MULTISTEP_FORM:
      return { payload: buildMultistepFormPayload(blockData.data) };
    case BlockKind.ANNOUNCEMENT:
      return { payload: buildAnnouncementPayload(blockData.data) };
    case BlockKind.MAD_LIB: {
      const variables = (blockData.data.variables || []).map((v) => ({
        key: v.id,
        label: v.name,
        datatype: v.dataType === 'number' ? 'number' : 'string',
        required: true,
      }));
      return {
        payload: { type: BlockKind.MAD_LIB, parts: blockData.data.parts },
        variables,
      };
    }
    case BlockKind.FAMILY_FEUD:
      return {
        payload: buildFamilyFeudPayload(blockData.data),
        questions: blockData.data.questions.map((q) => ({ id: q.id, question: q.question })),
      };
    case BlockKind.PHOTO_UPLOAD:
      return { payload: buildPhotoUploadPayload(blockData.data) };
    case BlockKind.BUZZER:
      return { payload: buildBuzzerPayload(blockData.data) };
    default: {
      const _exhaust: never = blockData;
      throw new Error(`Unknown block kind: ${(_exhaust as FormBlockData).kind}`);
    }
  }
}

export function EditBlockProvider({
  children,
  block,
  participants,
  onClose,
}: EditBlockProviderProps) {
  const [blockData, setBlockData] = useState<FormBlockData>(() =>
    blockToFormData(block, participants),
  );

  const initialVisibleSegments = block.visible_to_segments ?? [];
  const [visibleSegments, setVisibleSegments] = useState<string[]>(initialVisibleSegments);
  const [showOnMonitor, setShowOnMonitor] = useState<boolean>(
    (block.payload as { show_on_monitor?: boolean }).show_on_monitor !== false,
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
      const { payload, variables, questions } = buildUpdatePayload(blockData);

      const result = await updateExperienceBlock(block.id, {
        payload: { ...payload, show_on_monitor: showOnMonitor },
        visible_to_segment_ids,
        ...(variables && { variables }),
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

    if (
      blockData.kind === BlockKind.MAD_LIB &&
      block.status === 'open' &&
      (block.responses?.total ?? 0) > 0
    ) {
      setUpdateError(
        'Cannot edit a Mad Lib while it is active. Stop presenting this block first — you will be asked to confirm before saving.',
      );
      return;
    }

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
      case BlockKind.FAMILY_FEUD:
        validationError = validateFamilyFeud(blockData.data);
        break;
      case BlockKind.PHOTO_UPLOAD:
        validationError = validatePhotoUpload(blockData.data);
        break;
      case BlockKind.BUZZER:
        validationError = validateBuzzer(blockData.data);
        break;
      default: {
        const _exhaust: never = blockData;
        validationError = `Unknown block kind: ${(_exhaust as FormBlockData).kind}`;
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
      BlockKind.MULTISTEP_FORM,
      BlockKind.FAMILY_FEUD,
      BlockKind.MAD_LIB,
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

  const contextValue: EditBlockContextValue = {
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
  };

  return <EditBlockContext.Provider value={contextValue}>{children}</EditBlockContext.Provider>;
}
