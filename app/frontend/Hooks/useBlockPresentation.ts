import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Block } from '@cctv/types';

import { useChangeBlockStatus } from './useChangeBlockStatus';

export function useBlockPresentation() {
  const { code, experience } = useExperience();
  const {
    change: changeStatus,
    error: statusError,
    setError: setStatusError,
  } = useChangeBlockStatus();
  const [busyBlockId, setBusyBlockId] = useState<string>();

  const handlePresent = useCallback(
    async (block: Block) => {
      if (!code) return;

      setBusyBlockId(block.id);
      setStatusError(null);

      const openBlocks = experience?.blocks ?? [];
      await Promise.all(
        openBlocks
          .filter((openBlock) => openBlock.id !== block.id && openBlock.status === 'open')
          .map((openBlock) => changeStatus(openBlock, 'closed')),
      );

      if (block.status !== 'open') {
        await changeStatus(block, 'open');
      }

      setBusyBlockId(undefined);
    },
    [code, experience, changeStatus, setStatusError],
  );

  const handleStopPresenting = useCallback(
    async (block: Block) => {
      if (!code) return;

      setBusyBlockId(block.id);
      setStatusError(null);

      await changeStatus(block, 'closed');

      setBusyBlockId(undefined);
    },
    [code, changeStatus, setStatusError],
  );

  const handlePlayNext = useCallback(
    async (
      selectedBlock: Block,
      flattenedBlocks: { block: Block; isChild: boolean; parentId?: string }[],
    ): Promise<Block | null> => {
      if (!code || !selectedBlock) return null;

      const currentIndex = flattenedBlocks.findIndex(({ block }) => block.id === selectedBlock.id);
      if (currentIndex === -1 || currentIndex >= flattenedBlocks.length - 1) return null;

      const nextBlock = flattenedBlocks[currentIndex + 1].block;

      setBusyBlockId(selectedBlock.id);
      setStatusError(null);

      if (selectedBlock.status === 'open') {
        await changeStatus(selectedBlock, 'closed');
      }
      if (nextBlock.status !== 'open') {
        await changeStatus(nextBlock, 'open');
      }

      setBusyBlockId(undefined);
      return nextBlock;
    },
    [code, changeStatus, setStatusError],
  );

  const closeBlock = useCallback(
    async (block: Block) => {
      await changeStatus(block, 'closed');
    },
    [changeStatus],
  );

  return {
    handlePresent,
    handleStopPresenting,
    handlePlayNext,
    closeBlock,
    busyBlockId,
    statusError,
    setStatusError,
  };
}
