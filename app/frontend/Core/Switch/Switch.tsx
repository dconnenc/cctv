import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';

import * as SwitchPrimitives from '@radix-ui/react-switch';
import { Moon, Sun } from 'lucide-react';

import styles from './Switch.module.scss';

type SwitchProps = ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
  withIcons?: boolean;
};

const Switch = forwardRef<ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, withIcons = false, ...props }, ref) => (
    <SwitchPrimitives.Root className={`${styles.root} ${className || ''}`} {...props} ref={ref}>
      {withIcons && (
        <>
          <Sun className={styles.iconLeft} />
          <Moon className={styles.iconRight} />
        </>
      )}
      <SwitchPrimitives.Thumb className={styles.thumb} />
    </SwitchPrimitives.Root>
  ),
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
