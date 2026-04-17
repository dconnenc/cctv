import { useCallback, useMemo, useState } from 'react';

import { Link } from 'react-router-dom';

import { DragDropContext, Draggable, type DropResult, Droppable } from '@hello-pangea/dnd';
import classNames from 'classnames';
import { Layers, LayoutList, Monitor as MonitorIcon, Plus, Users } from 'lucide-react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Dialog, DialogContent } from '@cctv/core';
import { useBlockPresentation } from '@cctv/hooks/useBlockPresentation';
import { useReorderBlock } from '@cctv/hooks/useReorderBlock';
import { Block, BlockStatus, ExperienceSegment, ParticipantSummary } from '@cctv/types';

import CreateBlock from '../Manage/CreateBlock/CreateBlock';
import SegmentManager from '../Manage/ParticipantsTab/SegmentManager/SegmentManager';

import styles from './Timeline.module.scss';

const MONITOR_TRACK_ID = '__monitor__';
const AUDIENCE_TRACK_ID = '__audience__';

type Track =
  | { id: typeof MONITOR_TRACK_ID; label: 'Monitor'; kind: 'monitor' }
  | { id: typeof AUDIENCE_TRACK_ID; label: 'Audience'; kind: 'audience' }
  | { id: string; label: string; kind: 'segment'; segment: ExperienceSegment };

function buildTracks(segments: ExperienceSegment[]): Track[] {
  const sorted = [...segments].sort((a, b) => a.position - b.position);
  return [
    { id: MONITOR_TRACK_ID, label: 'Monitor', kind: 'monitor' },
    { id: AUDIENCE_TRACK_ID, label: 'Audience', kind: 'audience' },
    ...sorted.map<Track>((segment) => ({
      id: segment.id,
      label: segment.name,
      kind: 'segment',
      segment,
    })),
  ];
}

function blockIsVisibleOnTrack(block: Block, track: Track): boolean {
  const blockSegments = block.visible_to_segments || [];
  const hasSegmentTargeting = blockSegments.length > 0;

  switch (track.kind) {
    case 'monitor':
      return true;
    case 'audience':
      return !hasSegmentTargeting;
    case 'segment':
      if (!hasSegmentTargeting) return true;
      return blockSegments.includes(track.segment.name);
  }
}

function blockColumn(block: Block): number {
  const pos = Number(block.position);
  return Number.isFinite(pos) && pos >= 0 ? Math.floor(pos) : 0;
}

function buildColumns(topLevelBlocks: Block[]): number[] {
  if (topLevelBlocks.length === 0) return [0];
  const positions = topLevelBlocks.map(blockColumn);
  const max = Math.max(0, ...positions);
  const columns: number[] = [];
  for (let i = 0; i <= max; i += 1) columns.push(i);
  columns.push(max + 1);
  return columns;
}

function statusDotClass(status: BlockStatus): string {
  if (status === 'open') return styles.statusOpen;
  if (status === 'closed') return styles.statusClosed;
  return '';
}

function blockLabel(block: Block): string {
  const payload = block.payload as Record<string, unknown> | undefined;
  if (!payload) return block.kind;
  const candidate =
    (payload.question as string | undefined) ||
    (payload.title as string | undefined) ||
    (payload.message as string | undefined) ||
    (payload.prompt as string | undefined);
  return candidate && candidate.length > 0 ? candidate : block.kind;
}

interface BlockCardProps {
  block: Block;
  ghost?: boolean;
  dragging?: boolean;
}

function BlockCard({ block, ghost, dragging }: BlockCardProps) {
  return (
    <div
      className={classNames(styles.blockCard, {
        [styles.blockCardGhost]: ghost,
        [styles.blockCardDragging]: dragging,
        [styles.blockCardActive]: block.status === 'open',
      })}
    >
      <div className={styles.blockHeader}>
        <span className={classNames(styles.blockStatusDot, statusDotClass(block.status))} />
        <span className={styles.blockKind}>{block.kind.replace(/_/g, ' ')}</span>
      </div>
      <div className={styles.blockLabel}>{blockLabel(block)}</div>
      {block.children && block.children.length > 0 && (
        <div className={styles.blockChildren}>
          {block.children.map((child) => (
            <span key={child.id} className={styles.childChip}>
              {child.kind.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Timeline() {
  const { experience, code, wsReady, isLoading } = useExperience();
  const { reorder } = useReorderBlock();
  const { closeBlock } = useBlockPresentation();
  const [isCreateBlockOpen, setIsCreateBlockOpen] = useState(false);
  const [isSegmentsOpen, setIsSegmentsOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);

  const segments = useMemo<ExperienceSegment[]>(
    () => experience?.segments || [],
    [experience?.segments],
  );
  const tracks = useMemo(() => buildTracks(segments), [segments]);

  const topLevelBlocks = useMemo<Block[]>(
    () => (experience?.blocks || []).filter((b) => !b.parent_block_id),
    [experience?.blocks],
  );

  const participantsCombined: ParticipantSummary[] = useMemo(
    () => [...(experience?.hosts || []), ...(experience?.participants || [])],
    [experience?.hosts, experience?.participants],
  );

  const currentOpenBlock = useMemo(
    () => (experience?.blocks || []).find((b) => b.status === 'open'),
    [experience?.blocks],
  );

  const columns = useMemo(() => buildColumns(topLevelBlocks), [topLevelBlocks]);

  const blocksByColumn = useMemo(() => {
    const map = new Map<number, Block[]>();
    topLevelBlocks.forEach((block) => {
      const col = blockColumn(block);
      const list = map.get(col) || [];
      list.push(block);
      map.set(col, list);
    });
    map.forEach((list) =>
      list.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')),
    );
    return map;
  }, [topLevelBlocks]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const destinationId = result.destination.droppableId;
      const match = /^col-(\d+)$/.exec(destinationId);
      if (!match) return;
      const targetColumn = Number(match[1]);
      const blockId = result.draggableId;

      const block = topLevelBlocks.find((b) => b.id === blockId);
      if (!block || blockColumn(block) === targetColumn) return;

      reorder(blockId, targetColumn);
    },
    [reorder, topLevelBlocks],
  );

  if (isLoading || !wsReady) {
    return <section className="page flex-centered">Loading...</section>;
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.title}>{experience?.name || 'Experience'} — Timeline</div>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            onClick={() => setIsCreateBlockOpen(true)}
            className={styles.navToggle}
          >
            <Plus size={14} />
            <span>Add block</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSegmentsOpen(true)}
            className={styles.navToggle}
          >
            <Layers size={14} />
            <span>Segments</span>
          </button>
          <Link to={`/experiences/${code}/manage`} className={styles.navToggle}>
            <LayoutList size={14} />
            <span>Manage view</span>
          </Link>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={styles.board}>
          <div className={styles.trackLabelCol}>
            <div className={styles.trackLabelHeader}>Tracks</div>
            {tracks.map((track) => (
              <div
                key={track.id}
                className={classNames(styles.trackLabel, {
                  [styles.trackLabelAudience]: track.kind === 'audience',
                  [styles.trackLabelSegment]: track.kind === 'segment',
                })}
              >
                {track.kind === 'monitor' && (
                  <>
                    <MonitorIcon size={14} />
                    <span>{track.label}</span>
                  </>
                )}
                {track.kind === 'audience' && (
                  <>
                    <Users size={14} />
                    <span>{track.label}</span>
                  </>
                )}
                {track.kind === 'segment' && (
                  <>
                    <span
                      className={styles.segmentSwatch}
                      style={{ background: track.segment.color }}
                    />
                    <span>{track.label}</span>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className={styles.scroll}>
            <div className={styles.columnHeaderRow}>
              {columns.map((col) => (
                <button
                  type="button"
                  key={`h-${col}`}
                  onClick={() => setSelectedColumn(col)}
                  className={classNames(styles.columnHeader, {
                    [styles.columnHeaderSelected]: selectedColumn === col,
                  })}
                >
                  {col + 1}
                </button>
              ))}
            </div>

            <div className={styles.rows}>
              {tracks.map((track) => (
                <div key={track.id} className={styles.row}>
                  {columns.map((col) => {
                    const blocksAtCol = blocksByColumn.get(col) || [];
                    const visibleBlocks = blocksAtCol.filter((b) =>
                      blockIsVisibleOnTrack(b, track),
                    );
                    const droppableId = `col-${col}`;

                    const isSelected = selectedColumn === col;

                    if (track.kind === 'monitor') {
                      return (
                        <Droppable droppableId={droppableId} key={droppableId}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              onClick={() => setSelectedColumn(col)}
                              className={classNames(styles.cell, {
                                [styles.cellDroppableOver]: snapshot.isDraggingOver,
                                [styles.cellSelected]: isSelected,
                              })}
                            >
                              {visibleBlocks.length === 0 && (
                                <div className={styles.placeholder}>—</div>
                              )}
                              {visibleBlocks.map((block, idx) => (
                                <Draggable key={block.id} draggableId={block.id} index={idx}>
                                  {(dragProvided, dragSnapshot) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                    >
                                      <BlockCard block={block} dragging={dragSnapshot.isDragging} />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      );
                    }

                    return (
                      <div
                        key={`${track.id}-${col}`}
                        onClick={() => setSelectedColumn(col)}
                        className={classNames(styles.cell, {
                          [styles.cellSelected]: isSelected,
                        })}
                      >
                        {visibleBlocks.length === 0 ? (
                          <div className={styles.placeholder}>—</div>
                        ) : (
                          visibleBlocks.map((block) => (
                            <BlockCard key={block.id} block={block} ghost />
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {topLevelBlocks.length === 0 && (
              <div className={styles.emptyState}>
                <div>No blocks yet.</div>
                <Link to={`/experiences/${code}/manage`} className={styles.navToggle}>
                  Create blocks in Manage view
                </Link>
              </div>
            )}
          </div>

          <div className={styles.previewCol}>
            <div className={styles.previewHeader}>
              <span>Preview</span>
              {selectedColumn !== null && (
                <span className={styles.previewColumnLabel}>Col {selectedColumn + 1}</span>
              )}
            </div>
            <div className={styles.previewRows}>
              {tracks.map((track) => {
                const blocksAtCol =
                  selectedColumn === null ? [] : blocksByColumn.get(selectedColumn) || [];
                const visibleBlocks = blocksAtCol.filter((b) => blockIsVisibleOnTrack(b, track));
                const previewBlock = visibleBlocks[0];
                const isLandscape = track.kind === 'monitor';
                return (
                  <div key={track.id} className={styles.previewRow}>
                    <div
                      className={classNames(styles.previewFrame, {
                        [styles.previewFrameLandscape]: isLandscape,
                        [styles.previewFramePortrait]: !isLandscape,
                        [styles.previewEmpty]: !previewBlock,
                      })}
                    >
                      {selectedColumn === null ? (
                        <span>Select a column</span>
                      ) : previewBlock ? (
                        <div>
                          <div className={styles.previewKind}>
                            {previewBlock.kind.replace(/_/g, ' ')}
                          </div>
                          <div>{blockLabel(previewBlock)}</div>
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DragDropContext>

      <Dialog open={isCreateBlockOpen} onOpenChange={setIsCreateBlockOpen}>
        <DialogContent style={{ maxWidth: '48rem', width: '100%' }}>
          <CreateBlock
            onClose={() => setIsCreateBlockOpen(false)}
            participants={participantsCombined}
            onEndCurrentBlock={async () => {
              if (!currentOpenBlock) return;
              await closeBlock(currentOpenBlock);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isSegmentsOpen} onOpenChange={setIsSegmentsOpen}>
        <DialogContent style={{ maxWidth: '32rem', width: '100%' }}>
          <SegmentManager segments={segments} />
        </DialogContent>
      </Dialog>
    </section>
  );
}
