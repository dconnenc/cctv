import { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import styles from './Button.module.scss';

type ButtonProps = PropsWithChildren & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({ children, type = 'button', ...props }: ButtonProps) => {
  return (
    <button className={styles.button} type={type} {...props}>
      {children}
    </button>
  );
};
