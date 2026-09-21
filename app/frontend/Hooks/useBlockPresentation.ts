import { useCallback, useEffect, useRef, useState } from 'react';

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
  // Tracks the block status at the moment an operation was initiated.
  // When set, the WebSocket effect below clears busyBlockId once the status
  // changes — avoiding the double-render caused by HTTP and WebSocket settling
  // at different times.
  const busyStartStatusRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!busyBlockId || busyStartStatusRef.current === undefined) return;
    const block = experience?.blocks?.find((b) => b.id === busyBlockId);
    if (!block) return;
    if (block.status !== busyStartStatusRef.current) {
      busyStartStatusRef.current = undefined;
      setBusyBlockId(undefined);
    }
  }, [experience?.blocks, busyBlockId]);

  const handlePresent = useCallback(
    async (block: Block) => {
      if (!code) return;

      setBusyBlockId(block.id);
      busyStartStatusRef.current = block.status;
      setStatusError(null);

      const openBlocks = experience?.blocks ?? [];
      await Promise.all(
        openBlocks
          .filter((openBlock) => openBlock.id !== block.id && openBlock.status === 'open')
          .map((openBlock) => changeStatus(openBlock, 'closed')),
      );

      if (block.status !== 'open') {
        const result = await changeStatus(block, 'open');
        if (!result?.success) {
          busyStartStatusRef.current = undefined;
          setBusyBlockId(undefined);
        }
        // On success the WebSocket broadcast triggers the effect above, which
        // clears busyBlockId once the status change is confirmed.
      } else {
        busyStartStatusRef.current = undefined;
        setBusyBlockId(undefined);
      }
    },
    [code, experience, changeStatus, setStatusError],
  );

  const handleStopPresenting = useCallback(
    async (block: Block) => {
      if (!code) return;

      setBusyBlockId(block.id);
      busyStartStatusRef.current = block.status;
      setStatusError(null);

      const result = await changeStatus(block, 'closed');
      if (!result?.success) {
        busyStartStatusRef.current = undefined;
        setBusyBlockId(undefined);
      }
      // On success the WebSocket broadcast triggers the effect above.
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
