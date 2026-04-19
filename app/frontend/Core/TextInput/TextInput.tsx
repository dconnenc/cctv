import type { ForwardedRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';

import classNames from 'classnames';

import styles from './TextInput.module.scss';

interface InputComponent extends InputHTMLAttributes<HTMLInputElement> {
  multiline?: false;
}

interface TextareaComponent extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  multiline: true;
}

type TextInputComponent = InputComponent | TextareaComponent;

type TextInputProps = TextInputComponent & {
  label?: string;
};

export const TextInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextInputProps>(
  (props, ref) => {
    const generatedId = useId();
    const inputId = props.id ?? generatedId;

    if (props.multiline) {
      const { label, className, id, ...textareaRest } = props;

      return (
        <div className={styles.input}>
          {label && (
            <label className={styles.label} htmlFor={inputId}>
              {label}
            </label>
          )}
          <textarea
            ref={ref as ForwardedRef<HTMLTextAreaElement>}
            id={inputId}
            className={classNames(styles.control, className)}
            {...textareaRest}
          />
        </div>
      );
    }

    const { label, type = 'text', className, id, multiline: _multiline, ...inputRest } = props;

    return (
      <div className={styles.input}>
        {label && (
          <label className={styles.label} htmlFor={inputId}>
            {label}
          </label>
        )}
        <input
          ref={ref as ForwardedRef<HTMLInputElement>}
          id={inputId}
          type={type}
          className={classNames(styles.control, className)}
          {...inputRest}
        />
      </div>
    );
  },
);

TextInput.displayName = 'TextInput';
