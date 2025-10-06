import { useMemo } from 'react';

import { Column, Pill, Table } from '@cctv/core';
import { ParticipantSummary } from '@cctv/types';

import styles from './ParticipantsTab.module.scss';

interface ParticipantsTabProps {
  participants: ParticipantSummary[];
}

export default function ParticipantsTab({ participants }: ParticipantsTabProps) {
  const columns: Column<ParticipantSummary>[] = useMemo(() => {
    return [
      {
        key: 'id',
        label: 'ID',
        Cell: (p) => <span className={styles.mono}>{p.id}</span>,
      },
      {
        key: 'name',
        label: 'Name',
        Cell: (p) => <span>{p.name || '—'}</span>,
      },
      {
        key: 'email',
        label: 'Email',
        Cell: (p) => <span>{p.email || '—'}</span>,
      },
      {
        key: 'role',
        label: 'Role',
        Cell: (p) => <Pill label={p.role} />,
      },
    ];
  }, []);

  return (
    <div className={styles.root}>
      <h4 className={styles.title}>Participants</h4>
      <div className={styles.content}>
        <Table columns={columns} data={participants} emptyState="No participants yet." />
      </div>
    </div>
  );
}
