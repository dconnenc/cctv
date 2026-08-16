import type { ComponentPropsWithRef } from 'react';
import { useId } from 'react';

import classNames from 'classnames';

import styles from './TextInput.module.scss';

type InputComponent = ComponentPropsWithRef<'input'> & {
  multiline?: false;
};

type TextareaComponent = ComponentPropsWithRef<'textarea'> & {
  multiline: true;
};

type TextInputComponent = InputComponent | TextareaComponent;

type TextInputProps = TextInputComponent & {
  label?: string;
};

export function TextInput(props: TextInputProps) {
  const generatedId = useId();
  const inputId = props.id ?? generatedId;

  if (props.multiline) {
    const { label, className, ...textareaRest } = props;

    return (
      <div className={styles.input}>
        {label && (
          <label className={styles.label} htmlFor={inputId}>
            {label}
          </label>
        )}
        <textarea
          {...textareaRest}
          id={inputId}
          className={classNames(styles.control, className)}
        />
      </div>
    );
  }

  const { label, type = 'text', className, multiline: _multiline, ...inputRest } = props;

  return (
    <div className={styles.input}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        {...inputRest}
        id={inputId}
        type={type}
        className={classNames(styles.control, className)}
      />
    </div>
  );
}
