import { useCallback, useMemo, useState } from 'react';

import { Pill } from '@cctv/core/Pill/Pill';
import { SegmentBadge } from '@cctv/core/SegmentBadge/SegmentBadge';
import { Column, Table } from '@cctv/core/Table/Table';
import { useAssignSegment } from '@cctv/hooks';
import { ExperienceSegment, ParticipantSummary } from '@cctv/types';

import SegmentManager from './SegmentManager/SegmentManager';

import styles from './ParticipantsTab.module.scss';

interface ParticipantsTabProps {
  participants: ParticipantSummary[];
  segments: ExperienceSegment[];
}

export default function ParticipantsTab({ participants, segments }: ParticipantsTabProps) {
  const { assignSegment } = useAssignSegment();
  const [assigningFor, setAssigningFor] = useState<string | null>(null);

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
        key: 'role',
        label: 'Role',
        Cell: (p) => <Pill label={p.role} />,
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
                  <button className={styles.assignBtn} onClick={() => setAssigningFor(p.id)}>
                    +
                  </button>
                )}
              </div>
            )}
          </div>
        ),
      },
    ];
  }, [segments, assigningFor, handleAssign, handleRemoveSegment]);

  return (
    <div className={styles.root}>
      <SegmentManager segments={segments} />
      <Table columns={columns} data={participants} emptyState="No participants yet." />
    </div>
  );
}
