import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from 'react';

import { Link, LinkProps } from 'react-router-dom';

import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg';

interface SharedProps {
  loading?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Optional icon rendered before the label. Use lucide icons or any ReactNode. */
  icon?: ReactNode;
  /** Visually hide the label (children) but keep it for screen readers. Requires `icon`. */
  hideLabel?: boolean;
}

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedProps>;
type NativeLinkProps = Omit<
  LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof SharedProps | 'href'
>;
type NativeAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof SharedProps>;

type ButtonAsButton = SharedProps &
  NativeButtonProps & {
    to?: undefined;
    href?: undefined;
    ref?: Ref<HTMLButtonElement>;
  };

type ButtonAsLink = SharedProps &
  NativeLinkProps & {
    to: LinkProps['to'];
    href?: undefined;
    ref?: Ref<HTMLAnchorElement>;
  };

type ButtonAsAnchor = SharedProps &
  NativeAnchorProps & {
    to?: undefined;
    href: string;
    ref?: Ref<HTMLAnchorElement>;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

function isLinkProps(props: ButtonProps): props is ButtonAsLink {
  return 'to' in props && props.to !== undefined;
}

function isAnchorProps(props: ButtonProps): props is ButtonAsAnchor {
  return 'href' in props && props.href !== undefined;
}

function buildClassName({
  variant,
  size,
  loading,
  hideLabel,
  className,
}: {
  variant: ButtonVariant;
  size: ButtonSize;
  loading: boolean;
  hideLabel: boolean;
  className?: string;
}) {
  const sizeClass = size !== 'default' ? styles[size] : '';
  const loadingClass = loading ? styles.loading : '';
  const hideLabelClass = hideLabel ? styles.hideLabel : '';
  return `${styles.button} ${styles[variant]} ${sizeClass} ${loadingClass} ${hideLabelClass} ${className ?? ''}`
    .replace(/\s+/g, ' ')
    .trim();
}

function ButtonContent({
  icon,
  hideLabel,
  children,
}: {
  icon?: ReactNode;
  hideLabel: boolean;
  children: ReactNode;
}) {
  if (!icon) return <>{children}</>;
  return (
    <>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      {hideLabel ? <span className={styles.srOnly}>{children}</span> : children}
    </>
  );
}

export function Button(props: ButtonProps) {
  const {
    children,
    loading = false,
    loadingText,
    variant = 'primary',
    size = 'default',
    icon,
    hideLabel = false,
    className,
  } = props;

  if (hideLabel && !icon) {
    throw new Error(
      'Button: `hideLabel` requires an `icon` prop so the button has something visible.',
    );
  }

  const classes = buildClassName({ variant, size, loading, hideLabel, className });

  if (isLinkProps(props)) {
    const {
      to,
      ref,
      loading: _l,
      loadingText: _lt,
      variant: _v,
      size: _s,
      icon: _i,
      hideLabel: _h,
      ...rest
    } = props;
    return (
      <Link {...rest} to={to} ref={ref} className={classes}>
        <ButtonContent icon={icon} hideLabel={hideLabel}>
          {children}
        </ButtonContent>
      </Link>
    );
  }

  if (isAnchorProps(props)) {
    const {
      href,
      ref,
      loading: _l,
      loadingText: _lt,
      variant: _v,
      size: _s,
      icon: _i,
      hideLabel: _h,
      ...rest
    } = props;
    return (
      <a {...rest} href={href} ref={ref} className={classes}>
        <ButtonContent icon={icon} hideLabel={hideLabel}>
          {children}
        </ButtonContent>
      </a>
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
    icon: _i,
    hideLabel: _h,
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
        <ButtonContent icon={icon} hideLabel={hideLabel}>
          {children}
        </ButtonContent>
      )}
    </button>
  );
}
