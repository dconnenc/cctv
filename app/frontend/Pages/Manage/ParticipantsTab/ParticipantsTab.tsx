import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Plus, X } from 'lucide-react';

import { Button } from '@cctv/core';
import { SegmentBadge } from '@cctv/core/SegmentBadge/SegmentBadge';
import { Column, Table } from '@cctv/core/Table/Table';
import { useAssignSegment, useKickParticipant } from '@cctv/hooks';
import { ExperienceSegment, ParticipantSummary } from '@cctv/types';

import SegmentManager from './SegmentManager/SegmentManager';
import SubmissionsDrawer from './SubmissionsDrawer/SubmissionsDrawer';

import styles from './ParticipantsTab.module.scss';

const FALLBACK_SEGMENT_COLOR = '#6B7280';

interface ParticipantsTabProps {
  participants: ParticipantSummary[];
  segments: ExperienceSegment[];
  defaultSegmentId?: string | null;
}

interface SegmentsCellProps {
  participant: ParticipantSummary;
  segments: ExperienceSegment[];
  isAssigning: boolean;
  onStartAssign: (participantId: string) => void;
  onAssign: (participantId: string, segmentId: string) => void;
  onCancelAssign: () => void;
  onRemoveSegment: (participantId: string, segmentName: string) => void;
}

interface ActionsCellProps {
  participant: ParticipantSummary;
  onViewSubmissions: (participant: ParticipantSummary) => void;
  onRemove: (participantId: string) => void;
}

const renderName = (participant: ParticipantSummary) => <span>{participant.name || '—'}</span>;

const renderEmail = (participant: ParticipantSummary) => <span>{participant.email || '—'}</span>;

function SegmentsCell({
  participant,
  segments,
  isAssigning,
  onStartAssign,
  onAssign,
  onCancelAssign,
  onRemoveSegment,
}: SegmentsCellProps) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const assignedNames = participant.segments || [];

  useEffect(() => {
    if (isAssigning) selectRef.current?.focus();
  }, [isAssigning]);

  return (
    <div className={styles.segmentsCell}>
      {assignedNames.map((name) => {
        const segment = segments.find((s) => s.name === name);
        return (
          <SegmentBadge
            key={name}
            name={name}
            color={segment?.color || FALLBACK_SEGMENT_COLOR}
            onRemove={() => onRemoveSegment(participant.id, name)}
          />
        );
      })}
      {segments.length > 0 && (
        <div className={styles.assignWrapper}>
          {isAssigning ? (
            <select
              ref={selectRef}
              className={styles.assignSelect}
              aria-label={`Segment for ${participant.name || participant.email}`}
              onChange={(e) => {
                if (e.target.value) onAssign(participant.id, e.target.value);
              }}
              onBlur={onCancelAssign}
              defaultValue=""
            >
              <option value="" disabled>
                Pick...
              </option>
              {segments
                .filter((s) => !assignedNames.includes(s.name))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={14} />}
              hideLabel
              onClick={() => onStartAssign(participant.id)}
            >
              Assign segment to {participant.name || participant.email}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ActionsCell({ participant, onViewSubmissions, onRemove }: ActionsCellProps) {
  return (
    <div className={styles.actionsCell}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewSubmissions(participant)}
        title="View submissions"
        aria-label={`View submissions for ${participant.name || participant.email}`}
      >
        View
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<X size={14} />}
        hideLabel
        onClick={() => onRemove(participant.id)}
        title="Remove participant"
      >
        Remove {participant.name || participant.email}
      </Button>
    </div>
  );
}

export default function ParticipantsTab({
  participants,
  segments,
  defaultSegmentId,
}: ParticipantsTabProps) {
  const { assignSegment } = useAssignSegment();
  const { kickParticipant } = useKickParticipant();
  const [assigningFor, setAssigningFor] = useState<string | null>(null);
  const [submissionsFor, setSubmissionsFor] = useState<ParticipantSummary | null>(null);

  const handleAssign = useCallback(
    async (participantId: string, segmentId: string) => {
      await assignSegment(segmentId, [participantId], 'add');
      setAssigningFor(null);
    },
    [assignSegment],
  );

  const handleRemoveSegment = useCallback(
    async (participantId: string, segmentName: string) => {
      const segment = segments.find((s) => s.name === segmentName);
      if (segment) {
        await assignSegment(segment.id, [participantId], 'remove');
      }
    },
    [assignSegment, segments],
  );

  const handleCancelAssign = useCallback(() => setAssigningFor(null), []);

  const handleRemoveParticipant = useCallback(
    (participantId: string) => {
      kickParticipant(participantId);
    },
    [kickParticipant],
  );

  const renderSegments = useCallback(
    (participant: ParticipantSummary) => (
      <SegmentsCell
        participant={participant}
        segments={segments}
        isAssigning={assigningFor === participant.id}
        onStartAssign={setAssigningFor}
        onAssign={handleAssign}
        onCancelAssign={handleCancelAssign}
        onRemoveSegment={handleRemoveSegment}
      />
    ),
    [segments, assigningFor, handleAssign, handleCancelAssign, handleRemoveSegment],
  );

  const renderActions = useCallback(
    (participant: ParticipantSummary) => (
      <ActionsCell
        participant={participant}
        onViewSubmissions={setSubmissionsFor}
        onRemove={handleRemoveParticipant}
      />
    ),
    [handleRemoveParticipant],
  );

  const columns: Column<ParticipantSummary>[] = useMemo(
    () => [
      { key: 'name', label: 'Name', Cell: renderName },
      { key: 'email', label: 'Email', Cell: renderEmail },
      { key: 'segments', label: 'Segments', Cell: renderSegments },
      { key: 'actions', label: '', Cell: renderActions },
    ],
    [renderSegments, renderActions],
  );

  return (
    <div className={styles.root}>
      <SegmentManager segments={segments} defaultSegmentId={defaultSegmentId ?? null} />
      <Table columns={columns} data={participants} emptyState="No participants yet." />
      <SubmissionsDrawer participant={submissionsFor} onClose={() => setSubmissionsFor(null)} />
    </div>
  );
}
