import { ButtonHTMLAttributes, PropsWithChildren, Ref } from 'react';

import styles from './Button.module.scss';

type ButtonProps = PropsWithChildren &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    ref?: Ref<HTMLButtonElement>;
    loading?: boolean;
    loadingText?: string;
  };

export function Button({
  children,
  type = 'button',
  loading = false,
  loadingText,
  disabled,
  ref,
  ...props
}: ButtonProps) {
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
}
