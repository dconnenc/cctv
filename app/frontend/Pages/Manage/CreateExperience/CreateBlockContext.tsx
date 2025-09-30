import React, { ReactNode, createContext, useCallback, useContext, useState } from 'react';

import { useCreateExperienceBlock } from '@cctv/hooks';
import { Block, BlockStatus, ParticipantSummary } from '@cctv/types';

import { createBlockHandler } from './handlers/blockHandlerFactory';
import { BlockTypeHandler, CreateBlockContextValue } from './types';

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

export function CreateBlockProvider({
  children,
  participants,
  onClose,
  onEndCurrentBlock,
  refetchExperience,
}: CreateBlockProviderProps) {
  const [kind, setKind] = useState<Block['kind']>('poll');
  const [handler, setHandler] = useState<BlockTypeHandler>(() =>
    createBlockHandler(kind, participants),
  );

  // Additional form state
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
      setHandler(createBlockHandler(newKind, participants));
    },
    [participants],
  );

  const submit = useCallback(
    async (status: BlockStatus) => {
      setCreateError(null);

      const validationError = handler.validate();
      if (validationError) {
        setCreateError(validationError);
        return;
      }

      if (status === 'open' && !handler.canOpenImmediately(participants)) {
        setCreateError('Cannot open this block immediately');

        return;
      }

      handler.processBeforeSubmit(status, participants);
      const payload = handler.buildPayload();

      // Process additional form data
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
      handler.resetData();
      setVisibleRoles([]);
      setVisibleSegmentsText('');
      setTargetUserIdsText('');
      setViewAdditionalDetails(false);
    },
    [
      handler,
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
    handler,
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
