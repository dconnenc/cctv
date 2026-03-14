import { ButtonHTMLAttributes, PropsWithChildren, Ref } from 'react';

import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type ButtonSize = 'default' | 'sm' | 'lg';

type ButtonProps = PropsWithChildren &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    ref?: Ref<HTMLButtonElement>;
    loading?: boolean;
    loadingText?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
  };

export function Button({
  children,
  type = 'button',
  loading = false,
  loadingText,
  disabled,
  ref,
  variant = 'primary',
  size = 'default',
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
  const sizeClass = size !== 'default' ? styles[size] : '';

  return (
    <button
      ref={ref}
      className={`${styles.button} ${variantClass} ${sizeClass} ${loading ? styles.loading : ''} ${className ?? ''}`}
      type={type}
      disabled={isDisabled}
      {...props}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span className={styles.content}>{getButtonText()}</span>
    </button>
  );
}
