import { ButtonHTMLAttributes, PropsWithChildren, forwardRef } from 'react';

import styles from './Button.module.scss';

type ButtonProps = PropsWithChildren &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    /** Whether the button is in a loading state */
    loading?: boolean;
    /** Text to display when loading. Required when loading is true to provide clear user feedback */
    loadingText?: string;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, type = 'button', loading = false, loadingText, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;

    const getButtonText = () => {
      if (loading && loadingText) {
        return loadingText;
      }
      return children;
    };

    return (
      <button
        ref={ref}
        className={`${styles.button} ${loading ? styles.loading : ''}`}
        type={type}
        disabled={isDisabled}
        {...props}
      >
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        <span className={styles.content}>{getButtonText()}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';
