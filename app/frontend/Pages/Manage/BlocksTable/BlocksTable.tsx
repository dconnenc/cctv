import { useMemo } from 'react';

import { Link } from 'react-router-dom';

import { MoreHorizontal } from 'lucide-react';

import { useExperience } from '@cctv/contexts';
import {
  Button,
  Column,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Pill,
  Table,
} from '@cctv/core';
import { Block, BlockStatus, ParticipantSummary } from '@cctv/types';

import styles from './BlocksTable.module.scss';

interface BlockRow {
  block: Block;
  depth: number;
  isChild: boolean;
}

export function BlocksTable({
  blocks,
  onChange,
  busyId,
  participants,
}: {
  blocks: Block[];
  onChange: (b: Block, s: BlockStatus) => void;
  busyId?: string | null;
  participants?: ParticipantSummary[];
}) {
  const { code } = useExperience();
  const totalParticipants = participants?.length || 0;

  // Flatten blocks into hierarchical rows
  const blockRows = useMemo(() => {
    const rows: BlockRow[] = [];

    const addBlockAndChildren = (block: Block, depth: number, isChild: boolean) => {
      rows.push({ block, depth, isChild });

      // Add children from the children array if it exists
      if ((block as any).children && (block as any).children.length > 0) {
        (block as any).children.forEach((childBlock: Block) => {
          addBlockAndChildren(childBlock, depth + 1, true);
        });
      }
    };

    // All blocks returned from the API are now parent blocks
    // (children are nested within the 'children' property)
    blocks.forEach((block) => addBlockAndChildren(block, 0, false));

    return rows;
  }, [blocks]);

  const getTargetParticipantNames = (block: Block): string => {
    if (!block.target_user_ids || block.target_user_ids.length === 0) return '—';
    const targetParticipants = participants?.filter((p) =>
      block.target_user_ids!.includes(p.user_id),
    );
    return targetParticipants?.map((p) => p.name).join(', ') || '—';
  };

  const columns: Column<BlockRow>[] = useMemo(() => {
    return [
      {
        key: 'kind',
        label: 'Kind',
        Cell: (row) => (
          <span style={{ paddingLeft: `${row.depth * 24}px` }}>
            {row.isChild && <span className={styles.childIndicator}>└─ </span>}
            <Link
              to={`/experiences/${code}/manage/blocks/${row.block.id}`}
              className={styles.kindLink}
            >
              {row.block.kind}
            </Link>
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        Cell: (row) => <Pill label={row.block.status} />,
      },
      {
        key: 'responses',
        label: 'Responses',
        Cell: (row) => {
          // For child blocks, show if the assigned participant responded
          if (row.isChild && row.block.target_user_ids && row.block.target_user_ids.length > 0) {
            return <span>{row.block.responses?.total ? '✓' : '—'}</span>;
          }
          // For parent blocks, show aggregate
          return (
            <span>
              {row.block.responses?.total} / {totalParticipants}
            </span>
          );
        },
      },
      {
        key: 'visible_to_roles',
        label: 'Visible roles',
        Cell: (row) => {
          // Hide for child blocks (inherited from parent)
          if (row.isChild) return <span>—</span>;
          return (
            <span>
              {row.block.visible_to_roles?.length
                ? row.block.visible_to_roles.map((r) => <Pill key={r} label={r} />)
                : '—'}
            </span>
          );
        },
      },
      {
        key: 'visible_to_segments',
        label: 'Segments',
        Cell: (row) => {
          // Hide for child blocks (inherited from parent)
          if (row.isChild) return <span>—</span>;
          return (
            <span>
              {row.block.visible_to_segments?.length
                ? row.block.visible_to_segments.map((s) => <Pill key={s} label={s} />)
                : '—'}
            </span>
          );
        },
      },
      {
        key: 'target_user_ids',
        label: 'Target',
        Cell: (row) => {
          // For child blocks, show the assigned participant name
          if (row.isChild) {
            return <span>→ {getTargetParticipantNames(row.block)}</span>;
          }
          // For parent blocks with children, show — (targeting is on children)
          if ((row.block as any).children && (row.block as any).children.length > 0) {
            return <span>—</span>;
          }
          // For parent blocks without children, show count
          return <span>{row.block.target_user_ids?.length ?? 0}</span>;
        },
      },
      {
        key: 'actions',
        label: 'Actions',
        isHidden: true,
        Cell: (row) => (
          <BlockRowMenu
            block={row.block}
            onChange={(s) => onChange(row.block, s)}
            busy={busyId === row.block.id}
          />
        ),
      },
    ];
  }, [totalParticipants, participants, busyId, onChange]);

  return (
    <div>
      <Table columns={columns} data={blockRows} emptyState="No blocks yet." />
    </div>
  );
}

function BlockRowMenu({
  block,
  onChange,
  busy,
}: {
  block: Block;
  onChange: (next: BlockStatus) => void;
  busy?: boolean;
}) {
  const choose = (status: BlockStatus) => () => onChange(status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={styles.menuButton} disabled={busy}>
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={choose('open')} disabled={busy || block.status === 'open'}>
          Open
        </DropdownMenuItem>
        <DropdownMenuItem onClick={choose('closed')} disabled={busy || block.status === 'closed'}>
          Close
        </DropdownMenuItem>
        <DropdownMenuItem onClick={choose('hidden')} disabled={busy || block.status === 'hidden'}>
          Hide
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
