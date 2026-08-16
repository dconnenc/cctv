import { ChangeEvent, SelectHTMLAttributes } from 'react';

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
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = options.find((option) => option.value === event.target.value);
    if (selected) onChange(selected.value);
  };

  return (
    <label className={styles.root}>
      {label}:
      <select className={styles.input} onChange={handleChange} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
