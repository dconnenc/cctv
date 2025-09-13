import { useId, forwardRef } from 'react';
import styles from './TextInput.module.scss';

interface TextInputProps {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
}

/** Reusable text input component */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, name, type, placeholder }, ref) => {
    const inputId = useId();

    return (
      <div className={styles.input}>
        <label htmlFor={inputId}>{label}</label>
        <input ref={ref} id={inputId} name={name} type={type} placeholder={placeholder} />
      </div>
    );
  },
);
