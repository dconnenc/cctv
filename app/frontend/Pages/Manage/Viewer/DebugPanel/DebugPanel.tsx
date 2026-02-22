import { useEffect, useState } from 'react';

import { Bug, ChevronDown, ChevronUp, Play, Users } from 'lucide-react';

import { DialogDescription, DialogTitle } from '@cctv/components/ui/dialog';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button } from '@cctv/core/Button/Button';
import { useDebugParticipants } from '@cctv/hooks/useDebugParticipants';
import { useSimulateResponses } from '@cctv/hooks/useSimulateResponses';
import { Block, BlockKind } from '@cctv/types';

import styles from './DebugPanel.module.scss';

interface DebugPanelProps {
  selectedBlock?: Block;
}

function canSimulateResponses(block?: Block): boolean {
  if (!block) return false;

  switch (block.kind) {
    case BlockKind.POLL:
    case BlockKind.QUESTION:
    case BlockKind.MULTISTEP_FORM:
      return true;
    case BlockKind.MAD_LIB:
    case BlockKind.FAMILY_FEUD:
      // Allow simulation if block has children (we'll auto-open first child)
      return Boolean(block.children && block.children.length > 0);
    case BlockKind.ANNOUNCEMENT:
      return false;
    default:
      return false;
  }
}

export default function DebugPanel({ selectedBlock }: DebugPanelProps) {
  const [userCount, setUserCount] = useState(10);
  const [showParticipants, setShowParticipants] = useState(false);
  const [delayMs, setDelayMs] = useState(100);
  const [isOpeningBlocks, setIsOpeningBlocks] = useState(false);

  const { experience, experienceFetch, code } = useExperience();

  const {
    createParticipants,
    clearParticipants,
    fetchJwtsForExisting,
    participants,
    existingParticipants,
    simulatableParticipants,
    isLoading: isCreating,
    error: createError,
  } = useDebugParticipants();

  const {
    simulateResponses,
    simulateChildResponses,
    isSimulating,
    progress,
    error: simulateError,
  } = useSimulateResponses();

  // Auto-fetch JWTs for existing participants when panel opens
  useEffect(() => {
    if (existingParticipants.length > 0) {
      const participantsWithoutJwts = existingParticipants.filter((p) => !p.jwt);
      if (participantsWithoutJwts.length > 0) {
        fetchJwtsForExisting();
      }
    }
  }, []); // Only run on mount

  const handleCreateParticipants = async () => {
    await createParticipants(userCount);
  };

  const handleEnableExisting = async () => {
    await fetchJwtsForExisting();
  };

  // Helper to find parent block for a child block
  const findParentBlock = (childBlock: Block): Block | undefined => {
    if (!experience || !childBlock.parent_block_ids?.length) return undefined;
    const parentId = childBlock.parent_block_ids[0];
    return experience.blocks.find((b) => b.id === parentId);
  };

  // Helper to ensure proper block lifecycle before simulation
  const ensureBlocksOpen = async (block: Block): Promise<boolean> => {
    if (!code || !experienceFetch) return false;

    setIsOpeningBlocks(true);

    try {
      // Check if this is a child block (has parent)
      const parentBlock = findParentBlock(block);

      if (parentBlock) {
        // This is a child block - ensure parent is open first
        if (parentBlock.status !== 'open') {
          // Open parent first
          const parentRes = await experienceFetch(
            `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(parentBlock.id)}/open`,
            { method: 'POST' },
          );
          if (!parentRes.ok) {
            console.error('Failed to open parent block');
            return false;
          }
        }

        // Close any other open children of the same parent (only one child can be active)
        const openSiblings =
          parentBlock.children?.filter((c) => c.id !== block.id && c.status === 'open') || [];
        for (const sibling of openSiblings) {
          await experienceFetch(
            `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(sibling.id)}/close`,
            { method: 'POST' },
          );
        }

        // Open the target child block
        if (block.status !== 'open') {
          const res = await experienceFetch(
            `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(block.id)}/open`,
            { method: 'POST' },
          );
          if (!res.ok) {
            console.error('Failed to open child block');
            return false;
          }
        }
      } else if (block.children?.length) {
        // This is a parent block with children
        // When parent goes live, its first child must also go live

        // First, close any other open parent blocks and their children
        const otherOpenParents =
          experience?.blocks.filter(
            (b) => b.id !== block.id && b.status === 'open' && !b.parent_block_ids?.length,
          ) || [];

        for (const otherParent of otherOpenParents) {
          // Close children first
          if (otherParent.children) {
            for (const child of otherParent.children) {
              if (child.status === 'open') {
                await experienceFetch(
                  `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(child.id)}/close`,
                  { method: 'POST' },
                );
              }
            }
          }
          // Close the parent
          await experienceFetch(
            `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(otherParent.id)}/close`,
            { method: 'POST' },
          );
        }

        // Open the parent block
        if (block.status !== 'open') {
          const res = await experienceFetch(
            `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(block.id)}/open`,
            { method: 'POST' },
          );
          if (!res.ok) {
            console.error('Failed to open parent block');
            return false;
          }
        }

        // Open the first child
        const firstChild = block.children[0];
        if (firstChild && firstChild.status !== 'open') {
          const res = await experienceFetch(
            `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(firstChild.id)}/open`,
            { method: 'POST' },
          );
          if (!res.ok) {
            console.error('Failed to open first child block');
            return false;
          }
        }
      } else {
        // Simple block with no parent/children - just open it
        if (block.status !== 'open') {
          const res = await experienceFetch(
            `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(block.id)}/open`,
            { method: 'POST' },
          );
          if (!res.ok) {
            console.error('Failed to open block');
            return false;
          }
        }
      }

      return true;
    } finally {
      setIsOpeningBlocks(false);
    }
  };

  const handleSimulateResponses = async () => {
    if (!selectedBlock || simulatableParticipants.length === 0) return;

    // Ensure proper block lifecycle before simulating
    const blocksReady = await ensureBlocksOpen(selectedBlock);
    if (!blocksReady) {
      console.error('Failed to prepare blocks for simulation');
      return;
    }

    // Give websocket time to update experience state
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (selectedBlock.kind === BlockKind.MAD_LIB || selectedBlock.kind === BlockKind.FAMILY_FEUD) {
      // For parent blocks with children, simulate on the first open child
      const openChild = selectedBlock.children?.find((child) => child.status === 'open');
      const targetChild = openChild || selectedBlock.children?.[0];
      if (targetChild) {
        await simulateChildResponses(targetChild, simulatableParticipants, delayMs);
      }
    } else {
      await simulateResponses(selectedBlock, simulatableParticipants, delayMs);
    }
  };

  const canSimulate = canSimulateResponses(selectedBlock);
  const existingWithoutJwts = existingParticipants.filter((p) => !p.jwt).length;
  const error = createError || simulateError;

  return (
    <div className={styles.panel}>
      <DialogTitle className={styles.headerTitle}>
        <Bug size={16} />
        <span>Debug Panel</span>
      </DialogTitle>
      <DialogDescription className="sr-only">
        Debug tools for creating test participants and simulating responses
      </DialogDescription>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Users size={14} />
            <span>Participants ({participants.length})</span>
          </h3>

          {participants.length > 0 && (
            <div className={styles.participantsSection}>
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={styles.participantsToggle}
              >
                <span>
                  {simulatableParticipants.length} simulatable / {participants.length} total
                </span>
                {showParticipants ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showParticipants && (
                <ul className={styles.participantsList}>
                  {participants.map((p) => (
                    <li key={p.id} className={styles.participantItem}>
                      {p.name} {p.jwt ? '✓' : ''}
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.participantActions}>
                {existingWithoutJwts > 0 && (
                  <button
                    onClick={handleEnableExisting}
                    className={styles.clearButton}
                    disabled={isCreating}
                  >
                    Enable {existingWithoutJwts} existing
                  </button>
                )}
                {simulatableParticipants.length > 0 && (
                  <button onClick={clearParticipants} className={styles.clearButton}>
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}

          <div className={styles.controls}>
            <div className={styles.inputGroup}>
              <label htmlFor="userCount">Count:</label>
              <input
                id="userCount"
                type="number"
                min={1}
                max={100}
                value={userCount}
                onChange={(e) =>
                  setUserCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))
                }
                className={styles.input}
              />
            </div>

            <Button
              onClick={handleCreateParticipants}
              loading={isCreating}
              loadingText="Creating..."
            >
              <Users size={14} />
              <span>Create {userCount} More</span>
            </Button>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Play size={14} />
            <span>Simulate Responses</span>
          </h3>

          {!selectedBlock && <p className={styles.hint}>Select a block to simulate responses</p>}

          {selectedBlock && selectedBlock.status !== 'open' && (
            <p className={styles.hint}>Block will be opened automatically when simulating</p>
          )}

          {selectedBlock &&
            selectedBlock.status === 'open' &&
            simulatableParticipants.length === 0 && (
              <p className={styles.hint}>
                Enable existing participants or create new ones above to simulate
              </p>
            )}

          {canSimulate && simulatableParticipants.length > 0 && (
            <div className={styles.controls}>
              <div className={styles.inputGroup}>
                <label htmlFor="delayMs">Delay (ms):</label>
                <input
                  id="delayMs"
                  type="number"
                  min={0}
                  max={5000}
                  step={50}
                  value={delayMs}
                  onChange={(e) => setDelayMs(Math.max(0, parseInt(e.target.value) || 0))}
                  className={styles.input}
                />
              </div>

              <Button
                onClick={handleSimulateResponses}
                loading={isSimulating || isOpeningBlocks}
                loadingText={
                  isOpeningBlocks
                    ? 'Opening blocks...'
                    : `${progress.completed}/${progress.total}...`
                }
              >
                <Play size={14} />
                <span>
                  Simulate {simulatableParticipants.length} Response
                  {simulatableParticipants.length !== 1 ? 's' : ''}
                </span>
              </Button>
            </div>
          )}

          {isSimulating && (
            <div className={styles.progress}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                />
              </div>
              <span className={styles.progressText}>
                {progress.completed}/{progress.total}
                {progress.failed > 0 && ` (${progress.failed} failed)`}
              </span>
            </div>
          )}

          {selectedBlock && (
            <div className={styles.blockInfo}>
              <span className={styles.blockKind}>{selectedBlock.kind}</span>
              <span className={styles.blockStatus}>{selectedBlock.status}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
