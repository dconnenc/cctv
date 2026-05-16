import { AnchorHTMLAttributes, ButtonHTMLAttributes, Ref } from 'react';

import { Link, LinkProps } from 'react-router-dom';

import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg';

interface SharedProps {
  loading?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedProps>;
type NativeLinkProps = Omit<
  LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof SharedProps | 'href'
>;

type ButtonAsButton = SharedProps &
  NativeButtonProps & {
    to?: undefined;
    ref?: Ref<HTMLButtonElement>;
  };

type ButtonAsLink = SharedProps &
  NativeLinkProps & {
    to: LinkProps['to'];
    ref?: Ref<HTMLAnchorElement>;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function isLinkProps(props: ButtonProps): props is ButtonAsLink {
  return props.to !== undefined;
}

function buildClassName({
  variant,
  size,
  loading,
  className,
}: {
  variant: ButtonVariant;
  size: ButtonSize;
  loading: boolean;
  className?: string;
}) {
  const sizeClass = size !== 'default' ? styles[size] : '';
  const loadingClass = loading ? styles.loading : '';
  return `${styles.button} ${styles[variant]} ${sizeClass} ${loadingClass} ${className ?? ''}`.trim();
}

export function Button(props: ButtonProps) {
  const {
    children,
    loading = false,
    loadingText,
    variant = 'primary',
    size = 'default',
    className,
  } = props;

  const classes = buildClassName({ variant, size, loading, className });

  if (isLinkProps(props)) {
    const { to, ref, loading: _l, loadingText: _lt, variant: _v, size: _s, ...rest } = props;
    return (
      <Link {...rest} to={to} ref={ref} className={classes}>
        {children}
      </Link>
    );
  }

  const {
    type = 'button',
    disabled,
    ref,
    loading: _l,
    loadingText: _lt,
    variant: _v,
    size: _s,
    ...rest
  } = props;
  const isDisabled = disabled || loading;

  return (
    <button {...rest} ref={ref} type={type} disabled={isDisabled} className={classes}>
      {loading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          {loadingText && <span>{loadingText}</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}
