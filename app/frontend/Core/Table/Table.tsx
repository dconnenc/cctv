import { ReactNode, memo } from 'react';

import styles from './Table.module.scss';

type TextValuedKey<T> = {
  [K in keyof T]-?: T[K] extends string | number | null | undefined ? K : never;
}[keyof T] &
  Extract<keyof T, string>;

interface ColumnHeader {
  key: string;
  label: string;
  isHidden?: boolean;
}

export type Column<T extends object> =
  | (ColumnHeader & { key: TextValuedKey<T>; Cell?: undefined })
  | (ColumnHeader & { Cell: (value: T) => ReactNode });

export interface TableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  emptyState?: ReactNode;
  getRowKey?: (row: T) => string;
}

function cellContent<T extends object>(column: Column<T>, rowData: T): ReactNode {
  if (column.Cell) return column.Cell(rowData);
  const value = rowData[column.key];
  if (value === null || value === undefined) return null;
  return String(value);
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
  return (
    <tr aria-rowindex={rowIndex + 1}>
      {columns.map((column) => (
        <td key={column.key}>{cellContent(column, rowData)}</td>
      ))}
    </tr>
  );
}

// SAFETY: memo forwards the props object to TableRow untouched, so the runtime
// contract is TableRow's own signature. React's MemoExoticComponent type erases
// the `T extends object` parameter to its constraint; this restores it.
const MemoizedTableRow = memo(TableRow) as typeof TableRow;

export function Table<T extends object>({ columns, data, emptyState, getRowKey }: TableProps<T>) {
  if (!data?.length) {
    return <div className={styles.emptyState}>{emptyState}</div>;
  }

  const rows = data.map((rowData, index) => ({
    key: getRowKey?.(rowData) ?? `row-${index}`,
    rowIndex: index,
    rowData,
  }));

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} aria-label={column.isHidden ? column.label : undefined}>
                {column.isHidden ? null : column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <MemoizedTableRow
              key={row.key}
              rowData={row.rowData}
              columns={columns}
              rowIndex={row.rowIndex}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
