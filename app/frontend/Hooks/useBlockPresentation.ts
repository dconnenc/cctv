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

  const findParentBlock = useCallback(
    (childBlock: Block): Block | undefined => {
      if (!experience || !childBlock.parent_block_ids?.length) return undefined;
      const parentId = childBlock.parent_block_ids[0];
      return experience.blocks.find((b) => b.id === parentId);
    },
    [experience],
  );

  const handlePresent = useCallback(
    async (block: Block) => {
      if (!code) return;

      setBusyBlockId(block.id);
      setStatusError(null);

      const parentBlock = findParentBlock(block);

      if (parentBlock) {
        if (parentBlock.status !== 'open') {
          await changeStatus(parentBlock, 'open');
        }

        const openSiblings =
          parentBlock.children?.filter((c) => c.id !== block.id && c.status === 'open') || [];
        for (const sibling of openSiblings) {
          await changeStatus(sibling, 'closed');
        }

        if (block.status !== 'open') {
          await changeStatus(block, 'open');
        }
      } else if (block.children?.length) {
        const otherOpenParents =
          experience?.blocks?.filter(
            (b) => b.id !== block.id && b.status === 'open' && !b.parent_block_ids?.length,
          ) || [];

        for (const otherParent of otherOpenParents) {
          await changeStatus(otherParent, 'closed');
        }

        if (block.status !== 'open') {
          await changeStatus(block, 'open');
        }
      } else {
        const openBlocks = experience?.blocks?.filter((b) => b.status === 'open') || [];
        for (const openBlock of openBlocks) {
          if (openBlock.id !== block.id) {
            await changeStatus(openBlock, 'closed');
          }
        }

        if (block.status !== 'open') {
          await changeStatus(block, 'open');
        }
      }

      setBusyBlockId(undefined);
    },
    [code, experience, changeStatus, setStatusError, findParentBlock],
  );

  const handleStopPresenting = useCallback(
    async (block: Block) => {
      if (!code) return;

      setBusyBlockId(block.id);
      setStatusError(null);

      const parentBlock = findParentBlock(block);

      if (parentBlock) {
        await changeStatus(parentBlock, 'closed');
      } else {
        await changeStatus(block, 'closed');
      }

      setBusyBlockId(undefined);
    },
    [code, changeStatus, setStatusError, findParentBlock],
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

      const currentParent = findParentBlock(selectedBlock);
      const nextParent = findParentBlock(nextBlock);

      setBusyBlockId(selectedBlock.id);
      setStatusError(null);

      if (currentParent && nextParent && currentParent.id === nextParent.id) {
        if (selectedBlock.status === 'open') {
          await changeStatus(selectedBlock, 'closed');
        }
        if (nextBlock.status !== 'open') {
          await changeStatus(nextBlock, 'open');
        }
      } else {
        const currentBlockParent = findParentBlock(selectedBlock);
        if (currentBlockParent) {
          if (currentBlockParent.status === 'open') {
            await changeStatus(currentBlockParent, 'closed');
          }
        } else if (selectedBlock.status === 'open') {
          await changeStatus(selectedBlock, 'closed');
        }

        const nextBlockParent = findParentBlock(nextBlock);
        if (nextBlockParent) {
          if (nextBlockParent.status !== 'open') {
            await changeStatus(nextBlockParent, 'open');
          }
          if (nextBlock.status !== 'open') {
            await changeStatus(nextBlock, 'open');
          }
        } else {
          if (nextBlock.status !== 'open') {
            await changeStatus(nextBlock, 'open');
          }
        }
      }

      setBusyBlockId(undefined);
      return nextBlock;
    },
    [code, changeStatus, setStatusError, findParentBlock],
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
