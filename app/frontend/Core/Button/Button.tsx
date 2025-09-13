import { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import styles from './Button.module.scss';

type ButtonProps = PropsWithChildren & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({ children, ...props }: ButtonProps) => {
  return (
    <button className={styles.button} {...props}>
      {children}
    </button>
  );
};
