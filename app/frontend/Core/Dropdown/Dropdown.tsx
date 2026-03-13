import { SelectHTMLAttributes } from 'react';

import styles from './Dropdown.module.scss';

interface DropdownProps<T extends string>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}

export function Dropdown<T extends string>({
  label,
  options,
  onChange,
  ...props
}: DropdownProps<T>) {
  return (
    <label className={styles.root}>
      {label}:
      <select className={styles.input} onChange={(e) => onChange(e.target.value as T)} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
