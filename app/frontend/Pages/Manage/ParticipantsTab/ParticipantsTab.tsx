import { useCallback, useMemo, useState } from 'react';

import { Plus, X } from 'lucide-react';

import { Button } from '@cctv/core';
import { SegmentBadge } from '@cctv/core/SegmentBadge/SegmentBadge';
import { Column, Table } from '@cctv/core/Table/Table';
import { useAssignSegment, useKickParticipant } from '@cctv/hooks';
import { ExperienceSegment, ParticipantSummary } from '@cctv/types';

import SegmentManager from './SegmentManager/SegmentManager';
import SubmissionsDrawer from './SubmissionsDrawer/SubmissionsDrawer';

import styles from './ParticipantsTab.module.scss';

interface ParticipantsTabProps {
  participants: ParticipantSummary[];
  segments: ExperienceSegment[];
  defaultSegmentId?: string | null;
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
      const seg = segments.find((s) => s.name === segmentName);
      if (seg) {
        await assignSegment(seg.id, [participantId], 'remove');
      }
    },
    [assignSegment, segments],
  );

  const columns: Column<ParticipantSummary>[] = useMemo(() => {
    return [
      {
        key: 'name',
        label: 'Name',
        Cell: (p) => <span>{p.name || '\u2014'}</span>,
      },
      {
        key: 'email',
        label: 'Email',
        Cell: (p) => <span>{p.email || '\u2014'}</span>,
      },
      {
        key: 'segments',
        label: 'Segments',
        Cell: (p) => (
          <div className={styles.segmentsCell}>
            {(p.segments || []).map((name) => {
              const seg = segments.find((s) => s.name === name);
              return (
                <SegmentBadge
                  key={name}
                  name={name}
                  color={seg?.color || '#6B7280'}
                  onRemove={() => handleRemoveSegment(p.id, name)}
                />
              );
            })}
            {segments.length > 0 && (
              <div className={styles.assignWrapper}>
                {assigningFor === p.id ? (
                  <select
                    className={styles.assignSelect}
                    onChange={(e) => {
                      if (e.target.value) handleAssign(p.id, e.target.value);
                    }}
                    onBlur={() => setAssigningFor(null)}
                    autoFocus
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Pick...
                    </option>
                    {segments
                      .filter((s) => !(p.segments || []).includes(s.name))
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
                    onClick={() => setAssigningFor(p.id)}
                  >
                    Assign segment to {p.name || p.email}
                  </Button>
                )}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'actions',
        label: '',
        Cell: (p) => (
          <div className={styles.actionsCell}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubmissionsFor(p)}
              title="View submissions"
              aria-label={`View submissions for ${p.name || p.email}`}
            >
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<X size={14} />}
              hideLabel
              onClick={() => kickParticipant(p.id)}
              title="Remove participant"
            >
              Remove {p.name || p.email}
            </Button>
          </div>
        ),
      },
    ];
  }, [segments, assigningFor, handleAssign, handleRemoveSegment, kickParticipant]);

  return (
    <div className={styles.root}>
      <SegmentManager segments={segments} defaultSegmentId={defaultSegmentId ?? null} />
      <Table columns={columns} data={participants} emptyState="No participants yet." />
      <SubmissionsDrawer participant={submissionsFor} onClose={() => setSubmissionsFor(null)} />
    </div>
  );
}
