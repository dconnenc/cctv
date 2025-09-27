import { InputHTMLAttributes, forwardRef, useId } from 'react';

import styles from './TextInput.module.scss';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/** Reusable text input component */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, name, type = 'text', placeholder, disabled, id, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={styles.input}>
        {label && (
          <label className={styles.label} htmlFor={inputId}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          {...rest}
        />
      </div>
    );
  },
);
