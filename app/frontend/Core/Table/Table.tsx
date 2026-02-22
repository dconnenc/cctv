import { ReactNode, memo } from 'react';

import styles from './Table.module.scss';

export interface Column<T extends object> {
  key: string;
  label: string;
  isHidden?: boolean;
  Cell?: (value: T) => ReactNode;
}

export interface TableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  emptyState?: ReactNode;
}

function TableRow<T extends object>({
  rowData,
  columns,
  rowIndex,
}: {
  rowData: T;
  columns: Column<T>[];
  rowIndex: number;
}) {
  const row = columns.map(
    (column) => column.Cell?.(rowData) ?? (rowData as T)[column.key as keyof T],
  );
  const rowKey = 'row-' + rowIndex;
  return (
    <tr>
      {row.map((cell, cellIndex) => (
        <td key={rowKey + '-cell-' + cellIndex}>{cell as ReactNode}</td>
      ))}
    </tr>
  );
}

const MemoizedTableRow = memo(TableRow) as typeof TableRow;

export function Table<T extends object>({ columns, data, emptyState }: TableProps<T>) {
  if (!data?.length) {
    return <div className={styles.emptyState}>{emptyState}</div>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key as string}
                aria-label={column.isHidden ? column.label : undefined}
              >
                {column.isHidden ? null : column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((rowData, index) => (
            <MemoizedTableRow
              key={'row:' + index}
              rowData={rowData}
              columns={columns}
              rowIndex={index}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
