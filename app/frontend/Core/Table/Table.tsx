import { ReactNode } from 'react';

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
          {data.map((data, index) => {
            const row = columns.map((column) => column.Cell?.(data) || data[column.key as keyof T]);
            const rowKey = 'row-' + index;

            return (
              <tr key={'row:' + index}>
                {row.map((cell, cellIndex) => {
                  return <td key={rowKey + '-cell-' + cellIndex}>{cell as ReactNode}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
