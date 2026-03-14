import { ButtonHTMLAttributes, PropsWithChildren, Ref } from 'react';

import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = PropsWithChildren &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    ref?: Ref<HTMLButtonElement>;
    loading?: boolean;
    loadingText?: string;
    variant?: ButtonVariant;
  };

export function Button({
  children,
  type = 'button',
  loading = false,
  loadingText,
  disabled,
  ref,
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getButtonText = () => {
    if (loading && loadingText) {
      return loadingText;
    }
    return children;
  };

  const variantClass = variant !== 'primary' ? styles[variant] : '';

  return (
    <button
      ref={ref}
      className={`${styles.button} ${variantClass} ${loading ? styles.loading : ''} ${className ?? ''}`}
      type={type}
      disabled={isDisabled}
      {...props}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span className={styles.content}>{getButtonText()}</span>
    </button>
  );
}
